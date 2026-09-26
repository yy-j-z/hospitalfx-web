# 开发统一约定

## 分支

- `main`：可演示、可部署的稳定版本。
- `develop`：集成开发分支。
- `feature/neural`：神经网络与 AI。
- `feature/mini-program`：微信患者小程序。
- `feature/backend-medication`：后端、药品数据和知识库接口。
- `feature/frontend-refactor`：前端页面和联调。

分支命名必须使用 `feature/`、`fix/` 或 `chore/` 前缀。禁止直接在 `main` 上开发。

## 提交信息

统一格式：

```text
feat(scope): 新增功能
fix(scope): 修复问题
refactor(scope): 重构
test(scope): 测试
docs(scope): 文档
chore(scope): 工程配置
```

示例：`feat(ai): add medicine OCR contract`。

## 数据库

- 表名使用 `tb_` 前缀，小写蛇形命名。
- 字段使用小写蛇形命名。
- 所有新增表必须有主键、创建时间或可追溯字段。
- 用户相关外键统一关联 `tb_user(id)`。
- 药品主数据与库存分离：药品说明不能直接写进库存表。
- 药品来源必须保存来源机构、来源链接、版本和更新时间。
- 禁止通过 GUI 直接改表后不更新 `schema.sql`。
- 演示数据统一写入 `backend/src/main/resources/demo-data.sql`。

第一批新增表建议固定为以下名称，队友二不得自行改名：

- `tb_medication_knowledge`：药品通用名、适应症、禁忌、不良反应、来源和版本。
- `tb_medication_image_record`：上传图片哈希、识别结果、置信度、模型版本、确认状态。
- `tb_ai_inference_record`：模型类型、输入摘要、输出摘要、耗时、模型版本和创建时间。
- `tb_knowledge_document`：RAG 文档标题、来源机构、来源链接、版本、审核状态和更新时间。

建议字段：

```text
id BIGINT AUTO_INCREMENT PRIMARY KEY
created_at DATETIME NOT NULL
updated_at DATETIME NULL
source_name VARCHAR(120) NULL
source_url VARCHAR(500) NULL
version_label VARCHAR(40) NULL
review_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
```

不要把药品说明文字、库存数量、图片识别记录混在同一张表中；主数据、业务记录和审计记录必须分离。

## API

- 路径统一使用 `/api/...`。
- JSON 字段使用 camelCase，与现有前端保持一致。
- 成功返回结构化 JSON；错误至少包含 `message` 和可定位的 `path`。
- 图片上传接口使用 `multipart/form-data`，最大文件大小和允许格式必须写在接口说明中。
- AI 返回必须包含 `modelVersion`、`confidence` 或 `sources` 中适用的字段。

## 微信患者小程序

- 代码只在 `mini-program/`，不混入 `src/`；React Web 端不重复实现小程序页面。
- 使用**微信原生小程序**（WXML / WXSS / JS），不引入构建工具：
  根目录的 `npm run build` 与 CI 的前端任务与小程序无关，互不影响。
- 目录固定，不得自行新增一级目录：

```text
mini-program/
├─ app.js / app.json / app.wxss   小程序入口与全局配置
├─ project.config.json            开发者工具项目配置（miniprogramRoot 指向本目录）
├─ config/env.js                  baseUrl 与开关（唯一环境配置入口）
├─ api/                           请求封装与各模块接口（auth / medication / plan / knowledge / ai）
├─ pages/                         页面（每个页面一个目录，含 .js/.json/.wxml/.wxss）
├─ components/                    自定义组件（状态视图、冲突提示等）
├─ mock/                          按契约字段的样例数据
└─ utils/                         常量与格式化工具
```

- 后端地址只写在 `config/env.js` 的 `baseUrl`；**禁止在页面里硬编码 `http://` 地址**。
- 所有请求统一走 `api/request.js`，由它注入 `X-Auth-Token`、加超时、统一错误文案；
  页面不直接调用 `wx.request` / `wx.uploadFile`。
- 只允许请求 Spring Boot 的 `/api/**`，**禁止访问 `ai-service:8090` 或其它内网地址**。
- 字段以 `api-contract.md` 为准。后端未完成时用 `mock/` 里的同字段样例数据，
  并在 `config/env.js` 的 `useMock` 开关上切换，切换时页面代码不改。
- 医疗安全：`confidence < 0.6` 的识别结果必须经用户人工确认；知识库回答必须展示来源，
  无来源必须标注；涉及用药的页面必须有「请咨询医生 / 药师」提示。
- 禁止提交 AppSecret、患者隐私图片、`project.private.config.json`、`miniprogram_npm/`。
- 页面命名：目录与文件名一律小写英文，不用拼音缩写；一个页面一个目录，
  四件套（`.js` / `.json` / `.wxml` / `.wxss`）同名。
- `mini-program/package.json` 只用于声明本目录是 CommonJS（仓库根 `package.json` 是 `type: module`），
  不需要 `npm install`，也不参与根目录的 `npm run build`。不要往里面加依赖。
- 提交前必须跑（CI 也会跑）：

```bash
node mini-program/scripts/check-structure.js
node mini-program/scripts/smoke-test-mock.js
```

  第一条检查结构、语法、硬编码地址、绕过 `api/request.js` 的直接请求和密钥字样；
  第二条验证 mock 数据与 `api-contract.md` 是否仍然一致。接口字段一改，这里会先红。

## 联调顺序

1. 先确定数据库字段和 API 请求/响应样例。
2. 后端提供可用的演示数据。
3. 前端接入真实接口，再补充错误和空状态。
4. AI 服务先提供 mock 推理，再替换为真实模型。
5. 合并前运行前端构建和后端测试。
