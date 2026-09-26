# 神经网络实施方案

## 主线功能

药盒图片识别与 OCR 信息提取：

```text
上传图片 → 图像预处理 → OCR/药品识别 → 字段清洗 → 匹配药品库 → 返回置信度和来源
```

第一版返回字段建议：

```json
{
  "medicineName": "",
  "specification": "",
  "manufacturer": "",
  "expiryDate": "",
  "confidence": 0.0,
  "modelVersion": "ocr-baseline-0.1",
  "warnings": []
}
```

## 数据集和评估

- 训练集、验证集、测试集按患者/图片来源隔离，避免同一药盒照片泄漏到多个集合。
- 图片中必须包含清晰、模糊、倾斜、反光和不同背景样本。
- 图像分类报告 Accuracy、Precision、Recall、F1 和混淆矩阵。
- 目标检测报告 mAP@0.5、Precision、Recall。
- OCR 报告药品名称准确率、有效期字段准确率和字符错误率 CER。
- 只把独立测试集结果作为最终对外指标。

## 安全边界

- 模型只做识别、检索和风险提示，不做自动诊断或自动开处方。
- 低置信度结果必须要求用户确认，不能直接加入用药计划。
- 图片和推理日志不能包含未经授权的患者隐私。

## 服务接口

AI 服务目录为 `ai-service/`，先使用 mock 返回打通联调，再接入真实模型：

- `GET /health`
- `POST /predict/medicine-image`
- `POST /ocr/medicine-package`
- `POST /risk/adherence`

Spring Boot 后端作为业务入口，前端不直接依赖模型实现细节。
