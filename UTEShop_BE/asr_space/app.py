import os
import tempfile

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_NAME = os.getenv("ASR_MODEL", "small")
MODEL_DEVICE = os.getenv("ASR_DEVICE", "cpu")
MODEL_COMPUTE = os.getenv("ASR_COMPUTE_TYPE", "int8")

_model = None


def get_model():
    global _model
    if _model is None:
        _model = WhisperModel(MODEL_NAME, device=MODEL_DEVICE, compute_type=MODEL_COMPUTE)
    return _model


@app.get("/health")
def health():
    return {"ok": True, "model": MODEL_NAME}


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...), language: str = Form("vi")):
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(audio.filename or "audio.webm")[1]) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    try:
        model = get_model()
        segments, info = model.transcribe(tmp_path, language=language or None)
        text = "".join([segment.text for segment in segments]).strip()
        return {"text": text, "language": info.language}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass
