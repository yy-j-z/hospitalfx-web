/**
 * mock 契约冒烟测试（提交前跑一次，CI 也会跑）
 *
 *   node mini-program/scripts/smoke-test-mock.js
 *
 * 作用：在不开后端、不开微信开发者工具的情况下，验证 mock 数据与
 * api-contract.md 的字段一致、主流程能走通、异常场景确实会报错。
 * 队友二改了后端字段后，这里会第一时间红掉，提醒大家同步契约。
 */
const path = require('path');

// 模拟小程序的本地存储
const store = {};
global.wx = {
  getStorageSync: function (key) {
    return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : '';
  },
  setStorageSync: function (key, value) {
    store[key] = value;
  },
  removeStorageSync: function (key) {
    delete store[key];
  }
};

const mock = require(path.join(__dirname, '..', 'mock', 'index.js'));
const results = [];

function check(name, fn) {
  try {
    const value = fn();
    results.push(['PASS', name, value === undefined ? '' : JSON.stringify(value).slice(0, 110)]);
  } catch (err) {
    results.push(['FAIL', name, String(err && (err.message || err.status))]);
  }
}

function expectThrow(name, fn) {
  try {
    fn();
    results.push(['FAIL', name, '应当报错但没有报错']);
  } catch (err) {
    results.push(['PASS', name, '已拒绝：' + (err.message || '')]);
  }
}

check('登录：演示患者 13800000012 / 123456', function () {
  const session = mock.login('13800000012', '123456');
  return { token: !!session.token, userId: session.user.id, role: session.user.roleCode };
});
expectThrow('登录失败：密码错误', function () { mock.login('13800000012', '000000'); });

check('今日用药计划', function () {
  return mock.getPlans(13).map(function (item) {
    return item.id + ':' + item.medicationName + '/' + item.status;
  });
});
check('服药打卡', function () { return mock.checkIn(1); });
check('打卡后计划带着打卡时间与下次提醒', function () {
  const plan = mock.getPlans(13).filter(function (item) { return item.id === 1; })[0];
  return { lastCheckedInAt: !!plan.lastCheckedInAt, nextReminderAt: !!plan.nextReminderAt };
});
expectThrow('打卡失败：计划不存在', function () { mock.checkIn(999); });

check('药品搜索：按名称', function () {
  const res = mock.searchMedications('阿莫', 1, 20);
  return { total: res.total, first: res.items[0].medicationName };
});
check('药品搜索：空关键字返回全部', function () { return mock.searchMedications('', 1, 20).total; });
check('药品详情：知识字段齐全的药品', function () {
  const detail = mock.getMedication(2);
  return { name: detail.medicationName, sourceName: detail.sourceName };
});
check('药品详情：知识表未就绪时 5 个字段为 null', function () {
  const detail = mock.getMedication(1);
  return { indications: detail.indications, sourceName: detail.sourceName, versionLabel: detail.versionLabel };
});
expectThrow('药品详情失败：id 不存在', function () { mock.getMedication(999); });

check('冲突检查：两药同用应报冲突', function () {
  const res = mock.checkConflicts(['布洛芬缓释胶囊', '阿司匹林肠溶片']);
  return { hasConflict: res.hasConflict, count: res.conflicts.length, severity: res.conflicts[0].severity };
});
check('冲突检查：单药不报冲突', function () {
  return mock.checkConflicts(['布洛芬缓释胶囊']).hasConflict;
});

check('药盒识别 mock 返回低置信度（触发人工确认）', function () {
  const res = mock.recognizeMedicineImage('/tmp/box.jpg');
  return { medicineName: res.medicineName, confidence: res.confidence, modelVersion: res.modelVersion, needConfirm: res.confidence < 0.6 };
});

check('知识库检索：命中', function () {
  const res = mock.searchKnowledge('阿莫西林');
  return { count: res.answers.length, source: res.answers[0].sourceName };
});
check('知识库检索：存在无来源条目（页面必须标注）', function () {
  const res = mock.searchKnowledge('');
  return { total: res.answers.length, noSourceCount: res.answers.filter(function (item) { return !item.sourceName; }).length };
});
expectThrow('知识库检索失败：无内容', function () { mock.searchKnowledge('量子力学'); });

check('新建用药计划（人工确认后提交）', function () {
  return mock.createPlan({ patientUserId: 13, medicationName: '阿莫西林胶囊' });
});
expectThrow('新建用药计划失败：缺药品名称', function () { mock.createPlan({ patientUserId: 13 }); });

let pass = 0;
let fail = 0;
console.log('=== mock 契约冒烟测试 ===');
results.forEach(function (row) {
  if (row[0] === 'PASS') pass += 1;
  else fail += 1;
  console.log(row[0] + ' | ' + (row[1] + '                              ').slice(0, 30) + ' | ' + row[2]);
});
console.log('\n合计：PASS=' + pass + '  FAIL=' + fail);
process.exit(fail ? 1 : 0);
