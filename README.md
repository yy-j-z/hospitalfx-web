# HospitaFX 交接说明

这个项目已经整理成适合发给朋友直接运行的形式了。

技术栈：

- 前端：React + Vite
- 后端：Spring Boot + JDBC
- 数据库：MySQL 8+

## 发给朋友时建议保留的文件

请把整个 `hospitaFX` 文件夹发给对方，不要只发 `src` 或 `backend`。

项目里最重要的入口文件：

- `setup-project.bat`：首次使用，自动检查并安装基础环境、下载项目依赖
- `start-project.bat`：启动前后端
- `.env.example`：前端环境变量模板
- `backend/.env.example`：后端环境变量模板

## 朋友第一次怎么运行

### 方案一：最省事的方式

1. 双击 `setup-project.bat`
2. 等脚本自动检查并安装：
   - Node.js LTS
   - JDK 17
   - 前端 npm 依赖
   - 后端 Maven 依赖
3. 打开 `backend/.env.local`
4. 按他自己的电脑修改数据库配置：
   - `DB_URL`
   - `DB_USERNAME`
   - `DB_PASSWORD`
5. 确保他的 MySQL 服务已经启动
6. 双击 `start-project.bat`
7. 浏览器打开 `http://localhost:5173`

### 方案二：手动运行

前提：

- Node.js 18+ 或更高
- JDK 17
- MySQL 8+

步骤：

1. 根目录执行 `npm install`
2. 后端目录执行 `.\mvnw.cmd dependency:go-offline`
3. 把根目录 `.env.example` 复制成 `.env.local`
4. 把 `backend/.env.example` 复制成 `backend/.env.local`
5. 修改 `backend/.env.local` 里的数据库配置
6. 根目录执行 `npm run dev`
7. 另开一个终端，在 `backend` 目录执行 `.\start-local.ps1`

## 数据库怎么处理

你朋友不需要拿到你的数据库文件，也不需要和你用同一个密码。

项目现在的默认逻辑是：

- 后端会根据 `backend/.env.local` 里的数据库连接信息去连接 MySQL
- `DB_URL` 默认带了 `createDatabaseIfNotExist=true`
- 首次启动时，如果数据库是空的，会自动执行：
  - `backend/src/main/resources/schema.sql`
  - `backend/src/main/resources/data.sql`

也就是说，只要对方电脑里有一个可连接的 MySQL 服务，这个项目就可以自动建表并导入演示数据。

### 后端本地配置示例

`backend/.env.local`

```env
DB_URL=jdbc:mysql://localhost:3306/his?useUnicode=true&characterEncoding=utf8&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai&createDatabaseIfNotExist=true
DB_USERNAME=root
DB_PASSWORD=这里改成你自己的数据库密码
SQL_INIT_MODE=always
APP_CORS_ALLOWED_ORIGIN_PATTERNS=http://localhost:*,http://127.0.0.1:*
DEEPSEEK_API_KEY=
```

说明：

- 如果对方的数据库密码和你不同，只改 `DB_PASSWORD` 即可
- 如果对方数据库用户名不是 `root`，就改 `DB_USERNAME`
- 如果对方数据库端口、库名不同，就改 `DB_URL`
- 如果不演示 AI，可以把 `DEEPSEEK_API_KEY` 留空

## 重新初始化演示库

如果对方想把数据库重置成初始演示数据，可以运行：

```powershell
.\backend\scripts\reset-demo-db.ps1 -DbUser root -DbPassword 他的密码
```

这个脚本会：

- 自动重建演示数据库
- 重新执行 `schema.sql`
- 重新执行 `data.sql`

## 演示账号

统一密码：

```text
123456
```

账号：

- 管理员：`A001`
- 挂号员：`G001`、`G002`
- 药房：`Y001`、`Y002`
- 医生：`K001` 到 `K006`
- 患者：`13800000012` 到 `13800000015`

## 现在已经帮你处理好的内容

- 去掉了写死在脚本里的数据库密码
- 增加了前后端本地环境变量模板
- 增加了 Windows 一键安装依赖脚本
- 增加了 Windows 一键启动脚本
- 增加了 Maven Wrapper，对方不需要自己安装 Maven
- 清理了不适合发给别人的构建产物和日志文件

## 额外提醒

- `setup-project.bat` 主要解决“环境和依赖”问题
- MySQL 账号密码属于每台电脑自己的配置，所以保留在 `backend/.env.local` 让对方自己改是最稳的
- 如果对方连 MySQL 都没装，需要先安装并启动 MySQL 服务，然后再改 `backend/.env.local`
