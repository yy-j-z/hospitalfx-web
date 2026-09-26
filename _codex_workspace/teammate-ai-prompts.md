# 队友 AI 任务提示词

下面的提示词可以分别复制给对应队友使用。每个人都必须先阅读项目中的：

- `_codex_workspace/team-task-assignment.md`
- `_codex_workspace/development-contract.md`

所有人都必须在自己的 feature 分支开发，禁止直接修改 `main`。

---

## 队友一：安卓与移动端

```text
你正在参与 hospitaFXjyy 医疗用药管理项目开发。

你的任务是：负责移动端适配和 Android 版本，不负责修改数据库结构，也不负责训练神经网络。

请先阅读：
1. _codex_workspace/team-task-assignment.md
2. _codex_workspace/development-contract.md
3. _codex_workspace/neural-network-plan.md

项目现状：
- 前端是 React + Vite。
- 后端是 Spring Boot。
- 主要业务文件 src/App.jsx 和 src/panels.jsx 很大，不能大范围重写。
- 你应优先新增独立组件，减少和其他队友的代码冲突。

请按以下顺序完成：
1. 检查现有页面在窄屏设备上的布局问题。
2. 新增或整理移动端导航、患者首页、今日用药、服药打卡、图片上传和识别结果展示组件。
3. 统一处理加载中、上传失败、识别低置信度和后端不可用状态。
4. 设计 PWA 或 Capacitor Android 打包方案，但不要破坏现有 Web 端。
5. 图片上传必须调用后端约定接口，不要把模型逻辑写进前端。
6. 不要把图片、模型文件、数据库文件和密钥提交到 Git。

建议目录：
- src/features/mobile/
- src/features/medication/
- src/components/

交付内容：
- 修改或新增的文件清单
- 手机端页面截图或录屏说明
- Android/PWA 启动步骤
- npm run build 验证结果
- 已知问题和后续依赖

提交前必须检查：
- 没有直接修改 main 分支
- 没有擅自修改 schema.sql
- 没有改变 AI 接口字段名称
- 已运行 npm run build
```

---

## 队友二：后端、药品数据库和 RAG 接口

```text
你正在参与 hospitaFXjyy 医疗用药管理项目。

你的任务是：负责 Spring Boot 后端、药品数据库、药品查询接口、药物冲突接口和知识库/RAG 接口预留。

请先阅读：
1. _codex_workspace/team-task-assignment.md
2. _codex_workspace/development-contract.md
3. backend/src/main/resources/schema.sql
4. backend/src/main/resources/demo-data.sql

必须遵守的数据库规范：
- 表名使用 tb_ 前缀和小写蛇形命名。
- 字段使用小写蛇形命名。
- 新增表必须同步修改 schema.sql。
- 演示记录必须同步修改 demo-data.sql。
- 禁止只在本地数据库 GUI 中改表。
- 药品主数据、库存、识别记录和知识文档必须分表。
- 药品知识必须保存来源机构、来源链接、版本和更新时间。

固定的新表名称：
- tb_medication_knowledge
- tb_medication_image_record
- tb_ai_inference_record
- tb_knowledge_document

建议新增接口：
- GET /api/medications
- GET /api/medications/{id}
- GET /api/medications/search?keyword=...
- POST /api/medication-conflicts/check
- POST /api/knowledge/search
- POST /api/ai/medicine-image

接口要求：
- 路径统一使用 /api。
- JSON 字段使用 camelCase。
- 错误响应至少包含 message 和 path。
- AI 结果保留 confidence、modelVersion、sources 等字段。
- 图片上传使用 multipart/form-data，并限制大小和格式。

实现要求：
1. 先设计请求和响应 JSON，再写 Controller。
2. 使用现有项目的 controller、service、repository、model、dto 分层方式。
3. 不要把业务逻辑全部塞进 Controller。
4. 给接口准备可运行的 demo-data.sql 数据。
5. 不要把真正的大模型或神经网络训练代码放进 Java 项目。
6. AI 服务先允许调用 ai-service 的 mock 接口，后续再替换真实模型。

交付内容：
- schema.sql 修改
- demo-data.sql 修改
- model、repository、service、controller、dto 文件
- API 请求和响应示例
- 至少一个成功和一个失败场景
- mvn -f backend/pom.xml test 或 package 验证结果
```

---

## 队友三：前端系统改装与联调

```text
你正在参与 hospitaFXjyy 医疗用药管理项目。

你的任务是：负责药品百科、图片识别结果、RAG 问答、风险提示和多角色联调，不负责数据库设计和神经网络训练。

请先阅读：
1. _codex_workspace/team-task-assignment.md
2. _codex_workspace/development-contract.md
3. _codex_workspace/neural-network-plan.md
4. src/api.js

前端开发要求：
- React + Vite。
- 优先新增 src/features/ 下的独立功能模块。
- 公共 UI 放到 src/components/。
- 不要大范围重写 src/App.jsx、src/panels.jsx 和 src/styles.css。
- API 调用统一放在 src/api.js 或独立 feature API 文件中。

需要完成：
1. 药品分类、搜索、详情和来源展示。
2. 药盒图片上传页面。
3. 识别结果确认页面，低置信度时必须要求人工确认。
4. RAG 问答页面，显示参考来源。
5. 药物冲突风险提示。
6. 患者、医生、药师、管理员不同角色的权限和空状态。
7. 手机端和桌面端都能使用。

医疗安全要求：
- 前端不得把 AI 结果包装成诊断或处方。
- 对高风险内容显示“请咨询医生/药师”。
- 没有来源的知识回答要明确标识。
- AI 请求失败时要有可读错误提示。

交付内容：
- 新增组件和页面
- API 对接说明
- 成功、加载、空数据、失败、低置信度五类状态
- npm run build 验证结果
- 页面截图或操作流程说明
```

---

## 你自己：神经网络与 AI

```text
你负责 hospitaFXjyy 项目的神经网络和 AI 服务。

请先阅读：
1. _codex_workspace/team-task-assignment.md
2. _codex_workspace/development-contract.md
3. _codex_workspace/neural-network-plan.md
4. ai-service/README.md
5. ai-service/app/main.py

第一阶段目标必须可验收：
药盒图片上传 → OCR 提取药品名称、规格、厂家、有效期 → 返回结构化 JSON。

服务必须保留以下接口：
- GET /health
- POST /predict/medicine-image
- POST /ocr/medicine-package
- POST /risk/adherence

技术要求：
1. 训练、评估、推理代码全部放在 ai-service/。
2. 先让 mock 接口跑通，再替换为真实 OCR/识别模型。
3. 不要把训练代码放入 React 或 Spring Boot。
4. 记录 modelVersion、confidence、warnings 和必要的来源信息。
5. 低置信度时返回人工确认提示，不要直接写入患者用药计划。
6. 不上传患者隐私图片、原始训练集、大模型权重和密钥。

训练和评估必须包含：
- 训练集、验证集、独立测试集
- 数据划分说明
- Accuracy、Precision、Recall、F1
- 混淆矩阵或 OCR 字段准确率
- 训练损失和验证指标曲线
- 模型版本和推理耗时

医疗边界：
- 只做图片识别、文本提取、知识检索和风险提示。
- 不做自动诊断和自动开处方。
- 最终药品说明由药品数据库和 RAG 知识来源提供。

交付内容：
- 训练代码
- 评估代码
- 推理接口
- 模型指标报告
- 测试样例
- 前后端联调说明
```

---

## 所有人统一的提交前提示词

```text
请在结束前执行以下检查：
1. git status
2. 检查是否误提交 .env、密钥、数据库、日志、node_modules、训练原图和大型模型
3. 检查数据库改动是否同步 schema.sql 和 demo-data.sql
4. 检查 API 字段是否符合项目约定
5. 运行与你负责模块对应的测试或构建命令
6. 汇报修改文件、验证命令、验证结果和已知问题
7. 不要直接提交到 main，请提交 feature 分支或 Pull Request
```
