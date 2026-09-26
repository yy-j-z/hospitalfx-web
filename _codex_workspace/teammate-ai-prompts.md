# 队友 AI 任务提示词（第三版）

> 版本变更（2026-09-26）：**队友一的任务由「安卓与移动端（PWA / Capacitor）」改为
> 「微信患者小程序」**，分支名 `feature/android` → `feature/mini-program`，
> 代码范围 `src/features/mobile/**` → `mini-program/**`。
> 第二版里给队友一的提示词已废弃，请勿再转发旧版本。

下面四段可以直接复制给对应队友的 AI 使用。使用前请先确认对方已经读过：

- `_codex_workspace/team-task-assignment.md` —— 分工与文件地盘
- `_codex_workspace/api-contract.md` —— 接口契约（**唯一字段依据**）
- `_codex_workspace/development-contract.md` —— 分支、提交、数据库、API 规范

统一前提：每个人独立克隆仓库、使用自己的 feature 分支、**禁止直接改 `main`**，
完成后发 Pull Request 到 `develop`。

---

## 队友一：微信患者小程序

```text
你正在参与 hospitaFXjyy（蓉城医枢）医疗用药管理项目的**患者端微信小程序**开发。

你的分支：feature/mini-program

你的文件范围（只允许改这些）：
- mini-program/**（小程序项目配置、页面、组件、网络请求封装、mock 数据）

禁止修改：
- src/**、index.html、vite.config.js（React Web 医护工作台，归队友三和集成负责人）
- backend/** 任何文件（包括 schema.sql）
- ai-service/** 任何文件——你只能通过 Spring Boot 的 /api/** 间接调用，
  禁止在小程序里直连 ai-service:8090（小程序访问不到 localhost 和内网地址）

请先阅读：
1. _codex_workspace/api-contract.md（**字段唯一依据**）
2. _codex_workspace/team-task-assignment.md 的「队友一」一节
3. mini-program/README.md

技术方案已定：微信原生小程序（WXML / WXSS / JS）。不要在开发中途换成 Taro，也不要再起第二套实现。

现状说明（先读，别重复造）：
集成负责人已在 mini-program/ 里搭好骨架 —— app.json 与 tabBar、8 个页面框架、
api/request.js 统一请求封装、mock 数据与实现、state-view / conflict-tip 组件、
两个自检脚本，mock 模式下主流程已经能跑通。技术方案已定为**微信原生小程序**，
不要再另起目录、不要换成 Taro。

任务顺序：
1. 先跑通现状：用微信开发者工具打开 mini-program/，用 13800000012 / 123456 走一遍
   登录 → 今日用药 → 打卡 → 拍照识别 → 结果确认 → 加入计划，确认与 README「当前进度」一致
2. 按页面继续做：药品搜索与详情、知识库问答（每条必须显示来源）、我的
3. 后端接口就绪后，把 config/env.js 的 useMock 改成 false，逐页联调并把问题记下来
4. 补齐五种状态：加载中 / 无数据 / 上传失败 / 识别低置信度 / 后端不可用
5. 微信 code 登录本版不做，留作后续扩展；比赛第一版用手机号 + 密码登录
6. 每改完一块，跑一遍两条自检脚本，并更新 mini-program/README.md 的「当前进度」一节

接口与数据约定：
- 字段一律以 _codex_workspace/api-contract.md 为准，不得自行发明字段名。
- 后端未完成前，按契约字段在 mini-program/mock/ 下写样例数据。
- 后端地址集中在 mini-program/config/env.js 里配置，不要散落写在各页面里。
- 开发者工具联调时勾选「不校验合法域名」；真机联调需要局域网 IP 或 HTTPS 地址，这点写进你的交付说明。

交付内容：
- 新增文件清单
- 微信开发者工具里的页面截图或录屏（登录 → 今日用药 → 拍照识别 → 结果确认 → 打卡 这条主线）
- 打开与运行步骤（开发者工具版本、appid 怎么填、后端地址怎么改）
- 已知问题和后续依赖

提交前检查：
- 没有直接改 main
- 没有碰 src/、backend/、ai-service/
- 没有提交 AppSecret、患者隐私图片、project.private.config.json、node_modules
- 跑过 node mini-program/scripts/check-structure.js 和 smoke-test-mock.js，两条都通过
- 更新了 mini-program/README.md 的「当前进度」一节
```

---

## 队友二：后端、药品数据与知识库接口

```text
你正在参与 hospitaFXjyy（蓉城医枢）医疗用药管理项目的后端开发。

你的分支：feature/backend-medication

你的文件范围：backend/** 全部
（含 schema.sql、demo-data.sql、Controller、Service、Repository、model、dto）

数据库规则（重要）：
你负责修改 schema.sql 和 demo-data.sql，但必须通过 Pull Request 提交，由集成负责人审核后合并。
其他队友不得修改任何数据库文件。禁止只在本机数据库 GUI 改表而不更新 schema.sql。

请先阅读：
1. _codex_workspace/api-contract.md（当前是草案 v0.1）
2. _codex_workspace/team-task-assignment.md
3. _codex_workspace/development-contract.md
4. backend/src/main/resources/schema.sql 与 demo-data.sql

第一交付物（优先于写代码）：
把 api-contract.md 第 7 节的 4 个待确认问题定下来，改好文件后通知全组：
1. 搜索接口用 keyword 查询参数还是独立 /search 路径
2. indications / contraindications / sourceName / sourceUrl / versionLabel 是否落在 tb_medication_knowledge
3. 分页参数是否用 page / size
4. 错误响应是否统一带 message 中文字段

然后按顺序实现：
1. 新建 4 张表（表名固定，不得改名）：
   tb_medication_knowledge、tb_medication_image_record、
   tb_ai_inference_record、tb_knowledge_document
   所有新表必须有主键、创建时间或可追溯字段；药品主数据、库存、识别记录、知识文档必须分表。
   药品知识必须保存来源机构、来源链接、版本和更新时间。
2. 药品查询：GET /api/medications/{id} + 搜索接口（按契约选定一种）
3. 冲突检查：POST /api/medication-conflicts/check
4. 用药计划补全：GET /api/medication-plans、POST /api/medication-plans
   （PUT /{id}/check-in 已实现，不要改动其请求与响应）
5. 图片识别代理：POST /api/ai/medicine-image，转发到 ai-service 的
   POST http://localhost:8090/predict/medicine-image，响应字段与 ai-service 保持一致
6. 知识库检索：POST /api/knowledge/search（可先返回种子数据）

实现要求：
- 沿用现有分层：controller / service / repository / model / dto
- 不要把业务逻辑全塞进 Controller
- 新增表同步 schema.sql，演示记录同步 demo-data.sql
- 每条新接口至少准备一个成功场景和一个失败场景

交付内容：
- schema.sql、demo-data.sql 的改动
- model、repository、service、controller、dto 文件
- 每条接口的请求与响应示例（成功 + 失败）
- mvn -f backend/pom.xml test 或 package 的验证结果
```

---

## 队友三：前端页面与联调

```text
你正在参与 hospitaFXjyy（蓉城医枢）医疗用药管理项目的前端开发。

你的分支：feature/frontend-refactor

你的文件范围（只允许改这些）：
- src/features/medication/**
- src/features/knowledge/**
- src/features/risk/**
- src/api.js
- src/components/**

禁止修改：
- src/App.jsx、src/panels.jsx、src/styles.css（集成文件，由集成负责人统一挂载）
- backend/** 任何文件
- ai-service/** 任何文件

请先阅读：
1. _codex_workspace/api-contract.md（唯一字段依据）
2. _codex_workspace/team-task-assignment.md
3. src/features/README.md
4. src/api.js

任务顺序：
1. 按契约字段在 src/features/<模块>/mock/ 下写 mock JSON，先把页面做出来。
2. 药品百科：分类、搜索、详情、来源展示。
3. 药盒图片上传页 + 识别结果确认页。
   低置信度规则：confidence < 0.6 时必须强制人工确认药品名称后才能入库，
   禁止把识别结果直接写入用药计划。
4. 知识库问答页，每条回答必须显示参考来源；无来源的内容必须明确标注。
5. 药物冲突风险提示。
6. 患者 / 医生 / 药师 / 管理员四类角色的权限提示与空状态。
7. 前端 API 封装：统一处理加载态、错误态、空数据态。
8. 组件写好后整理导出，交给集成负责人挂到 App.jsx / panels.jsx。

医疗安全要求：
- 前端不得把 AI 结果包装成诊断或处方
- 高风险内容必须显示「请咨询医生 / 药师」
- AI 请求失败时要有可读错误提示

交付内容：
- 新增组件和页面清单
- 每个页面的成功 / 加载 / 空数据 / 失败 / 低置信度五态说明
- npm run build 验证结果
- 页面截图或操作流程说明
```

---

## 你自己：神经网络与 AI

```text
你负责 hospitaFXjyy（蓉城医枢）项目的神经网络与 AI 服务。

你的分支：feature/neural
你的文件范围：ai-service/**、_codex_workspace/**

第一阶段只承诺一条可验收主线：
药盒图片上传 → OCR 提取药品名称、规格、厂家、有效期 → 返回结构化 JSON。
字段已写入 _codex_workspace/api-contract.md 第 3 节，不要改字段名。

服务必须保留以下接口：
- GET /health
- POST /predict/medicine-image
- POST /ocr/medicine-package
- POST /risk/adherence

技术要求：
1. 训练、评估、推理代码全部放在 ai-service/。
2. 先让 mock 接口跑通，再替换为真实 OCR / 识别模型。
3. 不要把训练代码放进 React 或 Spring Boot。
4. 每次推理记录 modelVersion、confidence、图片哈希和必要的来源信息。
5. 低置信度时返回人工确认提示，不要直接写入患者用药计划。
6. 不上传患者隐私图片、原始训练集、大模型权重和密钥。

训练和评估必须包含：
- 训练集、验证集、独立测试集，按图片来源隔离（同一药盒照片不能跨集合）
- 数据划分说明
- 分类：Accuracy、Precision、Recall、F1、混淆矩阵
- OCR：药品名称准确率、有效期字段准确率、字符错误率 CER
- 训练损失和验证指标曲线
- 模型版本和推理耗时

对外只报独立测试集指标，训练集准确率不许当最终效果讲。

医疗边界：
- 只做图片识别、文本提取、知识检索和风险提示
- 不做自动诊断和自动开处方
- 最终药品说明由药品数据库和 RAG 知识来源提供

集成职责（合并 develop → main 之前）：
- 检查 API 字段是否一致
- 删库重跑，验证 schema.sql + demo-data.sql 能建出完整结构
- npm run build 是否能过
- AI 服务是否能被后端调用
- 微信小程序患者流程是否能在开发者工具里走通（登录 → 今日用药 → 拍照识别 → 结果确认 → 打卡）
- 是否误提交密钥、数据库文件、模型文件
```

---

## 所有人统一的提交前提示词

```text
请在结束前执行以下检查：
1. git status
2. 检查是否误提交 .env.local、密钥、数据库文件、日志、node_modules、训练原图、模型权重
3. 检查有没有改到别人的文件范围，特别是 App.jsx / panels.jsx / styles.css
4. 数据库改动是否同步了 schema.sql 和 demo-data.sql
5. API 字段是否与 _codex_workspace/api-contract.md 一致
6. 运行与自己模块对应的构建或测试命令
7. 汇报修改文件、验证命令、验证结果和已知问题
8. 提交到自己的 feature 分支并发 Pull Request 到 develop，不要直接提交 main
9. 对照 .github/pull_request_template.md 的验证清单逐条勾选，没做过的不要勾
   （没在开发者工具里跑过小程序就不要勾小程序那一项，没跑过 mvn test 就不要勾后端那一项）

如果本次改动涉及 mini-program/，额外检查：
- 后端地址是否只写在 mini-program/config/env.js 的 baseUrl，页面里没有硬编码 http://
- 是否所有请求都走 mini-program/api/request.js（没有页面直接调用 wx.request / wx.uploadFile）
- 是否只调用 Spring Boot 的 /api/**，没有直连 ai-service:8090
- 是否误提交 AppSecret、患者隐私图片、project.private.config.json、miniprogram_npm/
- 改了页面或配置后，是否在微信开发者工具里重新跑过一遍主线
  （登录 → 今日用药 → 拍照识别 → 结果确认 → 打卡）
- 是否更新了 mini-program/README.md 里的「当前进度」一节
```
