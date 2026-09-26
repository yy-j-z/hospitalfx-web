/**
 * 小程序结构自检脚本（提交前跑一次，CI 也会跑）
 *
 *   node mini-program/scripts/check-structure.js
 *
 * 检查内容：
 *   1. 所有 JSON 能被解析
 *   2. 所有 JS 语法正确（node --check）
 *   3. app.json 声明的每个页面都有 .js/.json/.wxml/.wxss 四件套
 *   4. tabBar 里的 pagePath 都在 pages 中声明过
 *   5. 页面 usingComponents 引用的组件文件存在
 *   6. 页面里没有硬编码 http:// 或 https:// 地址（地址只写在 config/env.js）
 *   7. 页面里没有直接调用 wx.request / wx.uploadFile（必须走 api/request.js）
 *   8. 仓库里没有 AppSecret 之类的密钥字样
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const problems = [];
const infos = [];

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function walk(dir, ext, out) {
  out = out || [];
  fs.readdirSync(dir).forEach(function (name) {
    if (name === 'node_modules' || name === 'miniprogram_npm') return;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, ext, out);
    else if (!ext || name.endsWith(ext)) out.push(full);
  });
  return out;
}

// 1 + 3 + 4 + 5
const jsonFiles = walk(ROOT, '.json');
jsonFiles.forEach(function (file) {
  try {
    JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    problems.push('JSON 无法解析：' + rel(file) + ' —— ' + err.message);
  }
});
infos.push('JSON 文件 ' + jsonFiles.length + ' 个全部可解析');

const appJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'));
const pages = appJson.pages || [];
pages.forEach(function (page) {
  ['.js', '.json', '.wxml', '.wxss'].forEach(function (ext) {
    const file = path.join(ROOT, page + ext);
    if (!fs.existsSync(file)) problems.push('缺少文件：' + page + ext + '（app.json 里声明了 ' + page + '）');
  });
});
infos.push('页面四件套检查完成，共 ' + pages.length + ' 个页面');

((appJson.tabBar && appJson.tabBar.list) || []).forEach(function (tab) {
  if (pages.indexOf(tab.pagePath) < 0) {
    problems.push('tabBar 的 pagePath 未在 pages 中声明：' + tab.pagePath);
  }
});

pages.forEach(function (page) {
  const pageJson = path.join(ROOT, page + '.json');
  if (!fs.existsSync(pageJson)) return;
  const config = JSON.parse(fs.readFileSync(pageJson, 'utf8'));
  const components = config.usingComponents || {};
  Object.keys(components).forEach(function (name) {
    const target = components[name];
    const base = target.charAt(0) === '/' ? path.join(ROOT, target) : path.resolve(path.dirname(pageJson), target);
    ['.js', '.json', '.wxml'].forEach(function (ext) {
      if (!fs.existsSync(base + ext)) {
        problems.push('页面 ' + page + ' 引用的组件文件不存在：' + target + ext);
      }
    });
  });
});

// 2
const jsFiles = walk(ROOT, '.js');
jsFiles.forEach(function (file) {
  const res = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (res.status !== 0) {
    problems.push('JS 语法错误：' + rel(file) + ' —— ' + (res.stderr || '').split('\n')[1]);
  }
});
infos.push('JS 文件 ' + jsFiles.length + ' 个语法检查通过');

// 6 + 7 —— 只检查 pages/ 与 components/ 里的代码
const codeFiles = jsFiles.concat(walk(path.join(ROOT, 'pages'), '.wxml')).filter(function (file) {
  const r = rel(file);
  return r.indexOf('pages/') === 0 || r.indexOf('components/') === 0;
});
codeFiles.forEach(function (file) {
  const text = fs.readFileSync(file, 'utf8');
  if (/https?:\/\//.test(text)) {
    problems.push('页面/组件里出现了硬编码地址：' + rel(file) + '（地址只允许写在 config/env.js）');
  }
  if (file.endsWith('.js') && /wx\.(request|uploadFile)\s*\(/.test(text)) {
    problems.push('页面/组件里直接调用了 wx.request / wx.uploadFile：' + rel(file) + '（必须走 api/request.js）');
  }
});

// 8
walk(ROOT).forEach(function (file) {
  if (!/\.(js|json|wxml|wxss)$/.test(file)) return;
  const text = fs.readFileSync(file, 'utf8');
  if (/appsecret|app_secret|AppSecret/.test(text) && rel(file) !== 'scripts/check-structure.js') {
    problems.push('出现疑似密钥字样：' + rel(file));
  }
});

console.log('=== 小程序结构自检 ===');
infos.forEach(function (line) { console.log('  ✔ ' + line); });
if (problems.length) {
  console.log('\n=== 发现问题 ' + problems.length + ' 项 ===');
  problems.forEach(function (line) { console.log('  ✘ ' + line); });
  process.exit(1);
}
console.log('\n全部检查通过。');
