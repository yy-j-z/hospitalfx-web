# 队友 AI 任务提示词（第二版）

下面四段可以直接复制给对应队友的 AI 使用。使用前请先确认对方已经读过：

- `_codex_workspace/team-task-assignment.md` —— 分工与文件地盘
- `_codex_workspace/api-contract.md` —— 接口契约（**唯一字段依据**）
- `_codex_workspace/development-contract.md` —— 分支、提交、数据库、API 规范

统一前提：每个人独立克隆仓库、使用自己的 feature 分支、**禁止直接改 `main`**，
完成后发 Pull Request 到 `develop`。

---

## 队友一：安卓与移动端

```text
你正在参与 hospitaFXjyy（蓉城医枢）医疗用药管理项目的移动端开发。

你的分支：feature/android

你的文件范围（只允许改这些）：
- src/features/mobile/**
- public/manifest.json
- PWA / Capacitor 相关配置

禁止修改：
- src/App.jsx、src/panels.jsx、src/styles.css（这三个是集成文件，由集成负责人统一挂载）
- backend/** 任何文件（包括 schema.sql）
- ai-service/** 任何文件

请先阅读：
1. _codex_workspace/api-contract.md
2. _codex_workspace/team-task-assignment.md
3. src/features/README.md

任务顺序：
1. 窄屏适配：把现有页面在手机宽度下跑一遍，列出布局崩掉的位置。
2. 新增移动端底部导航，替代桌面侧边栏。
3. 患者侧四个页面：今日用药、服药打卡、药盒图片上传、识别结果确认。
4. 统一处理加载中、上传失败、识别低置信度、后端不可用四种状态。
5. PWA 打包；Capacitor 打 Android APK 放第二优先。
6. 浏览器本地提醒（不做服务端推送）。

接口约定：
- 字段一律以 _codex_workspace/api-contract.md 为准，不得自行发明字段。
- 后端未完成前，按契约字段写 mock JSON，放在 src/features/mobile/mock/ 下。
- 样式写在本目录内，例如 src/features/mobile/MobileNav.css。

交付内容：
- 修改或新增的文件清单
- 手机端页面截图或录屏说明
- PWA / Android 启动步骤
- npm run build 验证结果
- 已知问题和后续依赖

提交前检查：
- 没有直接改 main
- 没有碰 App.jsx / panels.jsx / styles.css
- 没有改 backend/ 或 ai-service/
- 已运行 npm run build
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
- 手机端是否能走完整流程
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
```
