# 团队任务分工（第二版 · 多人并行开发）

## 总体目标

把现有系统升级为「蓉城医枢智能用药闭环平台」：
药品查询 → 图片识别 → 知识库问答 → 药物冲突检查 → 用药提醒 → 服药打卡 → 医护协同，形成完整闭环。

现有基础：门诊主流程（挂号 / 接诊 / 诊断 / 发药）已完成，用药计划、库存、冲突三张表已建好，
`PUT /api/medication-plans/{id}/check-in` 打卡接口已实现，`ai-service` 四个 mock 接口已跑通。

---

## 一、仓库与分支

远程仓库：<https://github.com/yy-j-z/hospitalfx-web.git>

- `main` —— 稳定、可演示版本。只接受集成负责人（你）从 `develop` 合并，其他人禁止直接推
- `develop` —— 集成测试版本。**所有人的 Pull Request 都提到这里**
- `feature/neural` —— 你 · 神经网络与 AI
- `feature/android` —— 队友一 · 安卓与移动端
- `feature/backend-medication` —— 队友二 · 后端、药品数据与知识库
- `feature/frontend-refactor` —— 队友三 · 前端页面与联调

每个人**独立克隆一份**，在自己的目录里开发，**不共用同一个工作目录**：

```powershell
git clone https://github.com/yy-j-z/hospitalfx-web.git
cd hospitalfx-web
git switch -c feature/android          # 队友一；其他人换成自己的分支名
```

---

## 二、文件地盘（只改自己范围内的文件）

**你**
- `ai-service/**`
- `_codex_workspace/**`
- 集成阶段：`src/App.jsx`、`src/panels.jsx`、`src/styles.css`

**队友一**
- `src/features/mobile/**`
- `public/manifest.json`
- PWA / Capacitor 相关配置

**队友二**
- `backend/**` 全部，含 `schema.sql`、`demo-data.sql`、Controller、Service、Repository

**队友三**
- `src/features/medication/**`、`src/features/knowledge/**`、`src/features/risk/**`
- `src/api.js`
- `src/components/**`

---

## 三、集成文件规则（这三个文件不许并行修改）

- `src/App.jsx`（142 KB）
- `src/panels.jsx`（180 KB）
- `src/styles.css`（112 KB）

规则：

1. 队友一、队友三**只新增独立组件**，不进去改这三个文件
2. 队友三负责在自己的 feature 目录里把组件导出整理好
3. 最后由**你**统一把组件挂到 `App.jsx` 或 `panels.jsx`
4. 样式写在各自功能目录里，例如 `src/features/medication/MedicationPanel.css`

这样三个人仍然可以同时开发，但不会频繁冲突。

---

## 四、数据库归属（已修订）

队友二负责修改 `backend/src/main/resources/schema.sql` 和 `demo-data.sql`，
但**必须通过 Pull Request 提交，由你审核后合并**。

其他队友不得修改任何数据库文件。

> 上一版写的「`schema.sql` 只有你能改」已废弃 —— 那会让队友二无法独立完成后端数据库任务，
> 形成互相等待。现在改为「队友二负责修改，你负责审核」，既并行又保证数据库统一。

---

## 五、第一步：先定接口契约，不是先写代码

队友二的**第一个交付物不是 Controller**，而是把接口定下来，写进：

`_codex_workspace/api-contract.md`

（仓库里已放了一份草案 v0.1，队友二在此基础上确认或修改。）

必须定清楚：

- 请求路径
- 请求参数
- 返回字段
- 错误格式
- 图片上传格式

---

## 六、第二步：三个人并行（谁都不用等谁）

接口契约发布后，四个人同时开工：

- **队友一**：手机布局、底部导航、PWA（先用 mock 数据）
- **队友二**：建表、药品接口、冲突检查接口、知识库接口（真实数据库）
- **队友三**：药品百科、图片上传页、识别结果页、RAG 页面（先用 mock JSON）
- **你**：OCR、图片识别、模型评估、`ai-service`

mock 数据放在各自 feature 目录下的 `mock/` 子目录。

---

## 七、第三步：按 Pull Request 合并

每个人完成一个小功能后：

```powershell
git add .
git commit -m "feat(scope): 说明"
git push -u origin feature/自己的分支
```

然后在 GitHub 上创建 Pull Request：`feature/自己的分支` → `develop`

**不要直接合并到 `main`。**

---

## 八、第四步：你负责集成

合并到 `main` 之前，你重点检查：

- API 字段是否一致
- 数据库能否初始化（删库重跑，验证 `schema.sql` + `demo-data.sql` 能建出完整结构）
- 前端是否能构建（`npm run build`）
- AI 服务是否能调用
- 手机端是否能走完整流程
- 是否误提交密钥、数据库文件、模型文件

验证通过后：`develop` → `main`

---

## 九、共同验收标准

- 不能提交密钥、数据库文件、日志、`node_modules`、模型权重、患者隐私图片
- 不能把训练集准确率当最终效果，必须报告独立测试集指标
- 医疗回答必须展示知识来源，或明确提示「请咨询医生 / 药师」
- 每条新增接口至少提供一个成功场景和一个失败场景的说明
- 新增表必须同步 `schema.sql`，演示记录必须同步 `demo-data.sql`

---

## 十、十条铁律

1. 每个人独立克隆项目
2. 每个人使用自己的 feature 分支
3. 禁止直接修改 `main`
4. 不共用同一个工作目录
5. 不同时修改 `App.jsx`、`panels.jsx`、`styles.css`
6. 数据库由队友二维护，你审核
7. 接口字段先确定，后写代码
8. 前端先用 mock，不等待后端
9. AI 服务先用 mock，再替换真实模型
10. 所有功能通过 Pull Request 合并

---

## 十一、任务清单

### 你：神经网络与 AI

1. 第一阶段只承诺一条可验收主线：
   药盒图片上传 → OCR 提取药品名称 / 规格 / 厂家 / 有效期 → 返回结构化 JSON
   字段已写入 `api-contract.md` 第 3 节，**不要改字段名**
2. 数据集：清晰、模糊、倾斜、反光、不同背景样本都要有；
   训练集 / 验证集 / 测试集**按图片来源隔离**（同一个药盒的照片不能跨集合）
3. 评估：分类报 Accuracy / Precision / Recall / F1 + 混淆矩阵；
   OCR 报药品名称准确率、有效期字段准确率、字符错误率 CER
4. 对外只报**独立测试集**指标，训练集准确率不许当结果讲
5. 每次推理记录 `modelVersion`、`confidence`、图片哈希
6. 先跑通 mock，再替换真模型，接口字段保持不变
7. 最后负责集成、审核 PR、合并 `develop → main`

### 队友一：安卓与移动端

1. 先做响应式适配：窄屏下把现有页面跑一遍，列出布局崩掉的地方
2. 新增移动端底部导航，替代桌面侧边栏
3. 患者侧四个页面：今日用药、服药打卡、药盒图片上传、识别结果确认
4. 三态处理：加载中 / 上传失败 / 后端不可用，都要有可读提示
5. 用 PWA 打包，Capacitor 打 Android APK 放第二优先
6. 浏览器本地提醒（不做服务端推送）
7. 不直接修改数据库，只依赖 `api-contract.md` 里已确认的接口

### 队友二：后端、药品数据与知识库接口

1. **第一交付物：把 `api-contract.md` 的 4 个待确认问题定下来**（优先于写代码）
2. 新建 4 张表（表名固定，不得改名）：
   `tb_medication_knowledge`、`tb_medication_image_record`、
   `tb_ai_inference_record`、`tb_knowledge_document`
3. 药品查询：`GET /api/medications/{id}`、搜索接口（按契约选定一种）
4. 冲突检查：`POST /api/medication-conflicts/check`
5. 用药计划补全：查询 + 新增（打卡接口已实现，**不要动**）
6. 图片识别代理：`POST /api/ai/medicine-image` 转发到 ai-service:8090
7. 知识库检索：`POST /api/knowledge/search`（可先返回种子数据）
8. 所有新增表同步 `schema.sql`，演示记录同步 `demo-data.sql`，**通过 PR 提交由你审核**
9. 禁止只在本机数据库 GUI 改表而不更新 `schema.sql`

### 队友三：前端页面与联调

1. 建立 `src/features/` 功能目录（仓库里已建好空目录，见 `src/features/README.md`）
2. 药品百科：分类、搜索、详情、来源展示
3. 药盒图片上传页 + 识别结果确认页
   （`confidence < 0.6` 必须强制人工确认才能入库）
4. 知识库问答页，**每条回答必须显示参考来源**
5. 药物冲突风险提示
6. 四类角色（患者 / 医生 / 药师 / 管理员）的权限提示与空状态
7. 前端 API 封装、加载态、错误态、空数据态
8. 不直接改 AI 模型训练代码，不修改数据库文件
