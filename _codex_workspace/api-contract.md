# 接口契约（Interface Contract）

状态：**草案 v0.1** —— 由队友二确认或修改后转正，转正后字段不得单方面变更。
规则：任何字段调整必须先在群里说明，并同步更新本文件，再由队友二通过 PR 提交。

本文件是**解冻钥匙**：契约定下来之后，前端、移动端、AI 三边可以同时开工，不需要等后端把代码写完。

---

## 0. 通用约定

- 路径统一前缀 `/api`
- JSON 字段统一 **camelCase**（与现有前端一致）
- 时间字段用字符串，格式 `yyyy-MM-dd HH:mm:ss`（与现有表字段保持一致）
- 鉴权：登录返回 `token`，后续请求放在请求头 **`X-Auth-Token`**；缺失或失效返回 401
- 错误响应统一为：

```json
{
  "timestamp": "2026-09-26T07:38:23.746+00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "可读的中文说明",
  "path": "/api/xxx"
}
```

- 图片上传统一 `multipart/form-data`：
  - 字段名 `image`
  - 允许格式 jpg / jpeg / png / webp
  - 单文件大小上限 **5 MB**
  - 超过限制返回 413，格式不符返回 415

---

## 1. 药品查询

### GET /api/medications/{id}

⚠️ **字段来源必须先看清楚，否则会踩坑：**

现有表 `tb_medication_inventory` 里的字段只有：
`id`、`medicationCode`、`medicationName`、`specification`、`unit`、`unitPrice`、`stockQuantity`、`safeStock`、`usageNotes`

下面响应里的 `indications`、`contraindications`、`sourceName`、`sourceUrl`、`versionLabel`
**当前数据库里没有这些字段**，需要队友二新建 `tb_medication_knowledge` 表之后才能提供。
在知识表建好之前，这 5 个字段先返回 `null`，前端按空值处理。

响应样例（200）：

```json
{
  "id": 2,
  "medicationCode": "M002",
  "medicationName": "阿莫西林胶囊",
  "specification": "0.25g*24粒",
  "unit": "盒",
  "unitPrice": 22.00,
  "stockQuantity": 58,
  "safeStock": 15,
  "usageNotes": "青霉素过敏者禁用",
  "indications": "用于敏感菌所致的感染",
  "contraindications": "对青霉素过敏者禁用",
  "sourceName": "国家药品监督管理局药品说明书",
  "sourceUrl": "https://www.nmpa.gov.cn/",
  "versionLabel": "2026-01",
  "updatedAt": "2026-09-26"
}
```

失败场景：id 不存在 → 404，`message` 为「未找到该药品」。

### GET /api/medications?keyword=阿莫&page=1&size=20

响应：

```json
{
  "total": 1,
  "page": 1,
  "size": 20,
  "items": [ /* 同上单个药品对象 */ ]
}
```

> 待队友二定：搜索是用 `keyword` 查询参数（如上），还是独立的 `/api/medications/search`。
> **二选一，定了就把另一种从本文件删掉**，不要两个都实现。

---

## 2. 药物冲突检查

### POST /api/medication-conflicts/check

请求：

```json
{ "medicationNames": ["布洛芬缓释胶囊", "阿司匹林肠溶片"] }
```

响应：

```json
{
  "hasConflict": true,
  "conflicts": [
    {
      "leftMedicationName": "布洛芬缓释胶囊",
      "rightMedicationName": "阿司匹林肠溶片",
      "severity": "中风险",
      "guidance": "可能增加胃肠道刺激"
    }
  ],
  "modelVersion": "rule-baseline-0.1"
}
```

✅ 现有表 `tb_medication_conflict` 字段已完全够用：
`left_medication_name` / `right_medication_name` / `severity` / `guidance`

现有演示数据（可直接复用）：

- 布洛芬缓释胶囊 + 阿司匹林肠溶片 → 中风险 / 可能增加胃肠道刺激
- 氯雷他定片 + 复方感冒灵颗粒 → 中风险 / 存在成分叠加风险

无冲突时返回 `{"hasConflict": false, "conflicts": [], ...}`。

---

## 3. 图片识别代理

### POST /api/ai/medicine-image

`multipart/form-data`，字段 `image`。后端转发到 ai-service：
`POST http://localhost:8090/predict/medicine-image`

响应字段**必须与 ai-service 完全一致，不要改名**：

```json
{
  "medicineName": null,
  "specification": null,
  "manufacturer": null,
  "expiryDate": null,
  "confidence": 0.0,
  "modelVersion": "mock-0.1",
  "warnings": ["当前为联调占位结果，请接入真实识别模型。"]
}
```

⚠️ **低置信度规则（医疗安全红线）**：
`confidence < 0.6` 时，前端**必须**要求用户人工确认药品名称后才能入库，
禁止把识别结果直接写入用药计划。

ai-service 不可用时应返回 503 且 `message` 可读，不要返回空白页。

---

## 4. 知识库检索

### POST /api/knowledge/search

请求：

```json
{ "query": "阿莫西林", "topK": 5 }
```

响应：

```json
{
  "answers": [
    {
      "title": "阿莫西林胶囊说明书",
      "content": "……",
      "sourceName": "国家药品监督管理局",
      "sourceUrl": "https://www.nmpa.gov.cn/",
      "versionLabel": "2026-01",
      "reviewStatus": "PENDING",
      "score": 0.82
    }
  ]
}
```

⚠️ 医疗安全要求：**没有来源的回答必须明确标注**，前端不得把无来源内容当结论展示。

---

## 5. 用药计划

### GET /api/medication-plans?patientUserId=13

返回该患者的用药计划列表（含 `lastCheckedInAt`、`nextReminderAt` 用于今日用药页）。

### POST /api/medication-plans

请求：

```json
{
  "patientUserId": 13,
  "registrationId": 2,
  "medicationInventoryId": 1,
  "medicationName": "布洛芬缓释胶囊",
  "dosage": "1 粒 / 次",
  "quantity": 2,
  "frequencyCode": "BID",
  "frequencyLabel": "每日 2 次",
  "frequencyPerDay": 2,
  "unit": "盒",
  "instructions": "饭后服用"
}
```

字段命名与现有 `tb_medication_plan` 表一一对应 ✅

### PUT /api/medication-plans/{id}/check-in

✅ **已经实现，不要在本次开发中改动它的请求与响应。**

---

## 6. 前端在接口完成前怎么办

**不要等后端写完。** 本文件就是唯一依据：

- 队友三：按本文件写 mock JSON，放在 `src/features/<模块>/mock/` 下
- 队友一：同样用 mock 数据开发手机页面
- 你：用 mock 图片识别结果开发 ai-service 链路
- 队友二：按本文件实现真实数据库与 API

后端就绪后，前端只需把 mock 数据源换成真实请求，页面代码不用改。

---

## 7. 待队友二确认的 4 件事

1. 搜索接口：`keyword` 查询参数 还是 独立 `/search` 路径？
2. `indications` / `contraindications` / `sourceName` / `sourceUrl` / `versionLabel`
   是否落在新建的 `tb_medication_knowledge` 表？（建议：是）
3. 分页参数是否用 `page` / `size`？
4. 错误响应是否统一带 `message` 中文字段？

确认后请把本文件状态改为 **v1.0 已确认**，并在群里通知队友一、队友三、你。
