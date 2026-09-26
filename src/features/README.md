# src/features 功能目录说明

这里放**各角色 / 各业务模块的独立功能代码**，目的是让大家并行开发时互不冲突。

## 目录归属（只在自己目录里写代码）

- `medication/` —— **队友三**。药品百科、图片上传、识别结果确认、用药计划展示
- `knowledge/` —— **队友三**。知识库 / RAG 问答页面
- `risk/` —— **队友三**。药物冲突风险、依从性风险提示组件

## 约定

1. **组件只在自己目录里新增**，不要跨目录改别人的文件
2. 样式写在同一个功能目录里，例如 `medication/MedicationPanel.css`，
   **不要改 `src/styles.css`**（该文件由集成负责人统一维护）
3. **不要改 `src/App.jsx` 和 `src/panels.jsx`** ——
   组件写好后由队友三整理导出、集成负责人统一挂载到页面上
4. 后端接口还没完成时，按 `_codex_workspace/api-contract.md` 的字段写 mock JSON，
   放在各自目录的 `mock/` 子目录下，例如 `medication/mock/medications.json`
5. 公共 UI 组件放 `src/components/`（该目录由队友三维护）
6. 微信患者端代码统一放在项目根目录 `mini-program/`，不要混入 React Web 的 `src/features/`

## 接口契约

所有前后端字段以 `_codex_workspace/api-contract.md` 为准。
该文件未确认的字段，不要自己发明。
