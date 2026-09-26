# 蓉城医枢 · 患者端微信小程序

本目录由**队友一**负责，是患者侧的微信小程序。
现有 `src/` React Web 系统继续承担医生、药师、管理员工作台，不被小程序替代——
两者是同一套 Spring Boot 后端的两套前端。

技术方案：**微信原生小程序**（WXML / WXSS / JS，无构建步骤）。
理由：无构建链、不影响根目录 `npm run build` 与 CI；答辩现场用微信开发者工具打开本目录即可演示；
不引入 Taro 的版本与产物兼容成本。**方案已定，开发中途不要换第二套实现。**

## 主流程（比赛第一版范围）

患者登录 → 今日用药 → 服药打卡 → 药盒拍照或相册选图 → 识别结果人工确认 → 加入用药计划，
另外包含药品搜索 / 详情 / 知识库问答 / 药物冲突提示。

## 目录结构

```text
mini-program/
├─ app.js / app.json / app.wxss   小程序入口与全局配置（tabBar：用药 / 药品 / 问答 / 我的）
├─ project.config.json            开发者工具项目配置；appid 为 touristappid（测试号，可直接运行）
├─ package.json                   仅为声明本目录是 CommonJS（仓库根是 type=module），不需要 npm install
├─ config/env.js                  baseUrl、useMock、置信度阈值——唯一环境配置入口
├─ api/                           request.js 统一请求封装 + auth / medication / plan / ai / knowledge
├─ pages/                         8 个页面：login / index / upload / confirm / medications / detail / qa / profile
├─ components/                    state-view（加载/空/失败三态）、conflict-tip（冲突提示）
├─ mock/                          按契约字段的样例数据 + mock 实现（useMock=true 时生效）
├─ scripts/                       check-structure.js（结构自检）、smoke-test-mock.js（mock 契约冒烟测试）
└─ utils/                         const.js（状态映射与安全文案）、format.js（格式化）
```

## 怎么跑起来

1. 装微信开发者工具，**导入目录选 `mini-program/`**（不是仓库根目录）。
2. appid 用 `touristappid`（已写在 `project.config.json` 里）；换自己的测试号也行，不影响本地开发。
3. `config/env.js` 里 `useMock: true` 时不需要后端，直接就能走完整主流程
   （mock 默认返回**低置信度**识别结果，用来验证「必须人工确认」这条红线）。
4. 要连真后端：后端启动后把 `useMock` 改成 `false`，并在开发者工具里勾选
   「详情 → 本地设置 → 不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」。
5. 真机预览：`baseUrl` 换成电脑的局域网 IP（手机与电脑同一 WiFi），
   或换成可访问的 HTTPS 地址并在微信后台配置 request / uploadFile 合法域名。

演示账号（与 `backend/src/main/resources/demo-data.sql` 一致）：患者手机号 `13800000012`，密码 `123456`。
医护账号（如 `K001`）在患者端会被拒绝，提示改用 Web 工作台。

## 提交前自检（必跑）

```bash
node mini-program/scripts/check-structure.js    # 结构、语法、硬编码地址、直连请求、密钥字样
node mini-program/scripts/smoke-test-mock.js    # mock 数据与接口契约是否还能跑通
```

两条命令都会进 CI（`.github/workflows/ci.yml` 的 `miniprogram` 任务），红了就说明契约或结构被改坏了。

## 约束（与 `_codex_workspace/development-contract.md` 一致）

- 代码只在本目录，不混进 `src/`；React Web 端不重复实现患者页面。
- 后端地址只写在 `config/env.js` 的 `baseUrl`，**页面里禁止出现 `http://` 字面量**。
- 所有请求走 `api/request.js`（它负责注入 `X-Auth-Token`、超时、错误文案），
  页面**不直接调用** `wx.request` / `wx.uploadFile`。
- 只调用 Spring Boot 的 `/api/**`，**禁止直连 `ai-service:8090`**（小程序访问不到内网地址）。
- 字段以 `_codex_workspace/api-contract.md` 为准，不得自行发明字段名。
- 医疗安全：`confidence < 0.6` 必须人工核对药品名称后才能入库；知识库回答必须展示来源，
  无来源必须标注；涉及用药的页面必须显示「请咨询医生 / 药师」。
- 不提交 AppSecret、患者隐私图片、`project.private.config.json`、`miniprogram_npm/`（已写进 `.gitignore`）。

## 当前进度

- ✅ 骨架完成：入口配置、tabBar、8 个页面、请求封装、mock 数据、三态与冲突组件、自检脚本
- ✅ mock 模式下主流程可跑通（登录 → 今日用药 → 打卡 → 拍照识别 → 人工确认 → 入库）
- ⬜ 接真后端联调（等队友二的接口就绪，把 `useMock` 改为 `false` 逐个页面验证）
- ⬜ 页面视觉细化、真机适配与录屏（答辩材料）
- ⚠️ 待队友二确认：新建用药计划时小程序只有药品名称，拿不到 `registrationId` /
  `medicationInventoryId`，需要后端按名称匹配库存，或提供一个只接收名称的计划接口
  （已写进 `api-contract.md` 第 7 节）。

队友一每完成一块，把这一节更新一下（提交前检查项里也要求了）。
