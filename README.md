# 蓉城医枢 · 智能门诊与用药管理系统

一个面向医院门诊场景的全流程管理系统，覆盖 **挂号 → 接诊 → 诊断 → 发药 → 用药打卡** 的完整闭环，
并在此基础上叠加用药安全与 AI 辅助能力：药品库存与低库存预警、药物冲突检测、患者端服药打卡与依从性提示、
以及基于大模型的导诊建议、用药咨询和在线留言问答。

系统按角色划分四套工作台 —— 管理员、医生、药师、患者，各自登录后只看到自己职责范围内的功能。

> 本项目为参加四川省大学生计算机设计大赛暨华迪杯中国大学生计算机设计大赛（四川省级赛）的作品，获省级三等奖。

---

## 技术栈

**前端**
- React 18 + Vite 5
- React Router 7（多入口路由：公众门户 / 员工版门户 / 患者版门户）
- GSAP 3、Three.js、OGL（首页动效与视觉展示）
- 原生 CSS（`src/styles.css`）

**后端**
- Spring Boot 3.3.5 + Java 17
- Spring JDBC（`JdbcTemplate`，未使用 JPA）
- MySQL 8
- Maven 构建，含多阶段 `Dockerfile`

**AI 服务**（`ai-service/`，独立进程）
- Python 3.10+ / FastAPI + Uvicorn
- 提供药品图片识别、药盒 OCR、服药依从性风险的推理接口
- 当前为**联调骨架，返回 mock 结果**，真实模型待接入

**大模型**
- DeepSeek API（`deepseek-chat`），用于挂号建议、患者用药建议、医生用药建议与 Agent 问答
- 未配置 API Key 时项目管理与用药等核心功能照常可用，仅 AI 相关提示不可用

**持续集成**
- GitHub Actions：前端 `npm ci` + `npm run build`，后端 `mvn test`

---

## 目录结构

```
hospitaFXjyy/
├─ src/                        前端源码（React + Vite）
│  ├─ App.jsx                  门户首页、路由、角色入口与登录弹窗
│  ├─ panels.jsx               各角色工作台面板（医生 / 药师 / 患者 / 管理员）
│  ├─ api.js                   统一接口层（注入 X-Auth-Token、超时与错误文案处理）
│  ├─ mockData.js              本地兜底数据
│  ├─ components/              公共组件（品牌 Logo、动效、展示模块等）
│  ├─ assets/                  首页配图
│  └─ styles.css               全局样式
├─ public/
│  └─ article.html             站点内文章页
├─ backend/                    Spring Boot 后端
│  ├─ src/main/java/com/hospitalfx/backend/
│  │  ├─ controller/           接口层
│  │  ├─ service/              业务层（AppStateService、AiService、AuthService）
│  │  ├─ repository/           JDBC 数据访问层
│  │  ├─ model/ dto/           实体对象与请求/响应对象
│  │  └─ config/               CORS 等配置
│  ├─ src/main/resources/
│  │  ├─ application.yml       端口、数据源、大模型配置
│  │  ├─ schema.sql            建表语句（幂等，IF NOT EXISTS）
│  │  └─ demo-data.sql         演示数据（账号、挂号、用药计划等）
│  ├─ scripts/                 环境变量加载、演示库重置脚本
│  ├─ Dockerfile               后端镜像（Maven 构建 → JRE 运行）
│  ├─ start-local.ps1          单独启动后端（源码有变动时自动重新打包）
│  └─ .env.example             后端环境变量模板
├─ ai-service/                 Python 神经网络 / OCR 服务（FastAPI）
│  ├─ app/main.py              服务入口与接口定义
│  ├─ requirements.txt         依赖
│  └─ README.md                服务说明与启动步骤
├─ _codex_workspace/           团队协作约定、任务分工、接口契约与阶段验收记录
├─ .github/                    PR 模板 + CI 工作流
├─ start-project.ps1           一键启动（MySQL + 后端 + 前端）
├─ start-frontend.ps1          只启动前端
├─ setup-windows.ps1           环境检查与安装（Node / JDK / Maven 等）
└─ .env.example                前端环境变量模板
```

---

## 数据库

库名 `his`（连接串带 `createDatabaseIfNotExist=true`，首次运行会自动建库）。

共 9 张表：

- `tb_user` —— 账号、登录工号/手机号、密码、角色
- `tb_doctor` —— 医生信息（科室、挂号级别、挂号费）
- `tb_patient_profile` —— 患者档案（姓名、性别、证件号、出生日期、年龄、住址）
- `tb_registinfo` —— 挂号与就诊记录（含诊断、发药状态）
- `tb_consult_message` —— 患者留言与医生回复
- `tb_medication_inventory` —— 药品库存
- `tb_medication_conflict` —— 药物相互作用/冲突规则
- `tb_medication_plan` —— 患者用药计划
- `tb_medication_checkin` —— 服药打卡记录

建表与演示数据分别由 `schema.sql` 和 `demo-data.sql` 管理。后端启动时若 `SQL_INIT_MODE=always`，
会自动执行这两个脚本，因此**首次运行不需要手动建表**。

---

## 运行方式

### 环境要求

- Node.js 18 或更高（含 npm）
- JDK 17 或更高（实测 JDK 21 可正常运行）
- Maven 3.9 或更高（启动脚本和 CI 均调用系统 `mvn`；仓库未包含 Maven Wrapper）
- MySQL 8 或更高，且服务已启动
- Python 3.10 或更高（**仅**在需要运行 `ai-service` 时才需要）

### 一键启动（Windows，推荐）

1. 确认本机 MySQL 服务已启动。
2. 配置数据库连接：把 `backend/.env.example` 复制为 `backend/.env.local`，按本机情况修改
   `DB_USERNAME` 和 `DB_PASSWORD`。`DB_URL` 默认指向 `jdbc:mysql://127.0.0.1:3306/his`。
3. 在项目根目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File start-project.ps1
```

脚本会自动完成：启动 MySQL 服务 → 清理 8080 / 5173 上的残留进程 → 分别开窗口运行后端
（源码有变动时自动执行 `mvn package`）→ 等后端就绪 → 启动前端 → 打开浏览器。
后端与前端跑在各自的独立窗口里，**不要关闭这两个窗口**，关掉服务就停了。

4. 浏览器访问 <http://localhost:5173>

### 手动启动

前端：

```powershell
npm install
npm run dev            # http://localhost:5173
```

后端：

```powershell
cd backend
.\start-local.ps1      # http://localhost:8080
```

### 启动 AI 服务（可选）

```powershell
cd ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8090
```

接口文档（Swagger UI）：<http://127.0.0.1:8090/docs>

---

## 演示账号

数据来自 `backend/src/main/resources/demo-data.sql`，**所有账号密码统一为 `123456`**。

登录框填的是「工号 / 手机号」，**不是用户名**。填 `doctor_zhang` 会提示账号或密码错误，要填 `K001`。

**管理员（ADMIN）**
- 工号 `A001` —— 系统管理员（运营统计、用户与角色管理）

**医生（DOCTOR）** —— 工号登录
- `K001` 张三（内科）· `K002` 李四（外科）· `K003` 王五（儿科）
- `K004` 赵六（男科）· `K005` 刘七（皮肤科）· `K006` 陈八（耳鼻喉科）

**药师（PHARMACIST）** —— 工号登录
- `Y001` 周建华 · `Y002` 孙宝国

**患者（PATIENT）** —— **手机号**登录，患者没有工号
- `13800000012` 刘小明 · `13800000013` 王小芳 · `13800000014` 赵小强
- `13800000015` 孙大伟 · `13800000016` 陈小丽 · `13800000017` 周子琪

> 以上均为演示用虚构数据，手机号与证件号非真实信息。

---

## 接口

后端默认地址 <http://localhost:8080>，接口统一前缀 `/api`。
登录成功后返回 `token`，前端把它放在请求头 **`X-Auth-Token`** 中；未携带或失效会返回 401。

**认证与基础**
- `POST /api/auth/login` —— 登录
- `GET  /api/health` —— 健康检查
- `GET  /api/app/state` —— 拉取整站业务数据
- `POST /api/app/reset` —— 重置演示数据

**挂号与就诊**
- `POST   /api/registrations` —— 挂号
- `DELETE /api/registrations/{id}` —— 退号
- `PUT    /api/registrations/{id}/diagnosis` —— 医生保存诊断
- `PUT    /api/registrations/{id}/dispense` —— 药师发药

**患者与留言**
- `POST /api/patients/register` —— 患者注册
- `POST /api/consult-messages` —— 患者留言
- `PUT  /api/consult-messages/{id}/reply` —— 医生回复

**用药管理**
- `PUT /api/medication-plans/{id}/check-in` —— 服药打卡

**用户**
- `PUT /api/users/{id}` —— 修改用户信息

**AI 辅助**
- `POST /api/ai/registration-advice` —— 挂号建议
- `POST /api/ai/patient-advice` —— 患者用药建议
- `POST /api/ai/doctor-medication-advice` —— 医生用药建议
- `POST /api/ai/agent-chat` —— Agent 问答

**ai-service**（默认 8090）
- `GET  /health` —— 健康检查
- `POST /predict/medicine-image` —— 药品图片识别
- `POST /ocr/medicine-package` —— 药盒 OCR
- `POST /risk/adherence` —— 服药依从性风险

> ⚠️ 目前前端尚未接入 `ai-service`，该服务可独立通过 Swagger 或 curl 调试，属于后续联调范围。

---

## 环境变量

**前端** —— 把 `.env.example` 复制为 `.env.local`

- `VITE_API_BASE_URL` —— 后端地址，默认 `http://localhost:8080/api`
- 可选：`VITE_PROXY_TARGET`、`VITE_PORT`、`BACKEND_PORT`（由 `vite.config.js` 读取）

**后端** —— 把 `backend/.env.example` 复制为 `backend/.env.local`

- `DB_URL` —— JDBC 连接串
- `DB_USERNAME` / `DB_PASSWORD` —— 数据库账号密码
- `SQL_INIT_MODE` —— 首次运行填 `always`，自动执行 `schema.sql` + `demo-data.sql`
- `APP_CORS_ALLOWED_ORIGIN_PATTERNS` —— 允许的前端来源
- `DEEPSEEK_API_KEY` —— 大模型 Key，留空则 AI 接口不可用

> ⚠️ `.env.local` 已被 `.gitignore` 排除，**不要提交到仓库**。

---

## 常见问题

**页面提示「无法连接后端服务」**
后端窗口还没启动完成，或已经被关闭。等待约 30 秒，或重新执行 `start-project.ps1`。

**登录提示账号或密码错误**
确认填写的是工号（如 `K001`）或患者手机号，而不是 `doctor_zhang` 这类用户名。

**后端启动失败**
依次检查：MySQL 服务是否在运行 → `backend/.env.local` 里的账号密码是否正确 →
3306 端口是否被其他程序占用。

**8080 / 5173 端口被占用**
启动脚本会自动清理这两个端口上的残留进程，直接重跑即可。

**前端构建提示 chunk 大于 500 kB**
只是体积告警，不影响构建成功与运行。

---

## 说明

- 本项目定位为医疗场景的**演示与教学系统**，AI 输出仅作辅助参考，**不构成医学诊断或处方**。
- `ai-service` 目前返回 mock 结果，用于打通前后端联调链路，真实模型接入后接口字段保持不变。
- 演示数据库中的所有账号、姓名、手机号、证件号均为虚构数据。
