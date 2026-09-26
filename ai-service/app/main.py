from __future__ import annotations

from typing import Annotated

from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel, Field


app = FastAPI(title="HospitalFX AI Service", version="0.1.0")


class AdherenceRiskRequest(BaseModel):
    patient_id: int | None = None
    medication_count: int = Field(default=0, ge=0)
    missed_doses_last_7_days: int = Field(default=0, ge=0)
    check_in_rate: float = Field(default=1.0, ge=0, le=1)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ai-service", "modelVersion": "mock-0.1"}


@app.post("/predict/medicine-image")
async def predict_medicine_image(image: Annotated[UploadFile, File(...)]) -> dict:
    # 联调占位：真实模型接入后保留响应字段，避免前后端重复改接口。
    return {
        "medicineName": None,
        "specification": None,
        "manufacturer": None,
        "expiryDate": None,
        "confidence": 0.0,
        "modelVersion": "mock-0.1",
        "warnings": ["当前为联调占位结果，请接入真实识别模型。"],
        "filename": image.filename,
    }


@app.post("/ocr/medicine-package")
async def ocr_medicine_package(image: Annotated[UploadFile, File(...)]) -> dict:
    return {
        "text": "",
        "fields": {},
        "confidence": 0.0,
        "modelVersion": "mock-0.1",
        "warnings": ["当前为联调占位结果，请接入 OCR 模型。"],
        "filename": image.filename,
    }


@app.post("/risk/adherence")
def adherence_risk(payload: AdherenceRiskRequest) -> dict:
    # 可解释的占位规则，后续替换为训练好的神经网络推理。
    score = min(
        1.0,
        0.35 * min(payload.missed_doses_last_7_days / 3, 1)
        + 0.25 * min(payload.medication_count / 6, 1)
        + 0.40 * (1 - payload.check_in_rate),
    )
    level = "HIGH" if score >= 0.65 else "MEDIUM" if score >= 0.35 else "LOW"
    return {
        "riskScore": round(score, 4),
        "riskLevel": level,
        "modelVersion": "rule-baseline-0.1",
        "explanations": [
            "该结果是联调基线，不代表医学诊断。",
            "真实模型接入后必须使用独立测试集重新评估。",
        ],
    }
