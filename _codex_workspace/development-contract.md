# 开发统一约定

## 分支

- `main`：可演示、可部署的稳定版本。
- `develop`：集成开发分支。
- `feature/neural`：神经网络与 AI。
- `feature/android`：安卓和移动端。
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

## 联调顺序

1. 先确定数据库字段和 API 请求/响应样例。
2. 后端提供可用的演示数据。
3. 前端接入真实接口，再补充错误和空状态。
4. AI 服务先提供 mock 推理，再替换为真实模型。
5. 合并前运行前端构建和后端测试。
