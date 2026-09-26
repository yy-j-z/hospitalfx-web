# AI Service

这是独立于 Spring Boot 的神经网络服务目录。训练、评估和推理代码都放在这里，避免把模型依赖塞进前端或 Java 业务层。

要求 Python 3.10 或更高版本。

当前版本只提供联调骨架，返回 mock 结果；真实 OCR、药品识别和依从性模型由 `feature/neural` 分支逐步替换。

启动：

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8090
```

接口：

- `GET /health`
- `POST /predict/medicine-image`
- `POST /ocr/medicine-package`
- `POST /risk/adherence`
