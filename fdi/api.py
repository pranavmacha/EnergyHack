"""
GridShield AI — Unified Threat Detection API
Exposes both FDI and DDoS ML models as REST endpoints for the React dashboard.
"""
import os
import sys
import numpy as np
import joblib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from datetime import datetime
import pandas as pd

# Add parent dir so we can import from both fdi/ and ddos/
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ddos'))

from fdi_detector import FDIDetector

app = FastAPI(title="GridShield Threat API")

# Allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load ML models on startup ──────────────────────────────

fdi_model_path = os.path.join(os.path.dirname(__file__), "fdi_model.pkl")
fdi_detector = FDIDetector(model_path=fdi_model_path)

ddos_model_path = os.path.join(os.path.dirname(__file__), '..', 'ddos', 'ddos_detector.pkl')
ddos_model = joblib.load(ddos_model_path)

print("✅ FDI model loaded")
print("✅ DDoS model loaded")


# ── Request schemas ─────────────────────────────────────────

class NodeReading(BaseModel):
    nodeId: str
    nodeName: str
    voltage: float
    neighborVoltages: list[float]
    packetRate: float = 500.0
    packetSize: float = 512.0
    connections: float = 50.0
    errorRate: float = 0.01


class ScanRequest(BaseModel):
    nodes: list[NodeReading]

class LogEntry(BaseModel):
    timestamp: str
    event: str
    level: str = "INFO"

class ChatRequest(BaseModel):
    message: str

from typing import List, Dict, Any

# ── RAG Context Store ──────────────────────────────────────
SYSTEM_LOGS: List[Dict[str, Any]] = []

# ── DDoS detection helper ──────────────────────────────────

def detect_ddos(packet_rate, packet_size, connections, error_rate):
    """Use Isolation Forest to detect DDoS anomalies."""
    sample = pd.DataFrame([[packet_rate, packet_size, connections, error_rate]], 
                          columns=["packet_rate", "packet_size", "connections", "error_rate"])
    prediction = ddos_model.predict(sample)[0]
    score = ddos_model.decision_function(sample)[0]
    # Isolation Forest: -1 = anomaly (attack), 1 = normal
    # Convert score to confidence percentage (higher = more confident)
    confidence = round(min(abs(score) * 500, 100.0), 2)
    if prediction == -1:
        return {"prediction": "DDOS_ATTACK", "confidence": f"{confidence}%"}
    else:
        return {"prediction": "NORMAL", "confidence": f"{confidence}%"}


# ── Endpoints ───────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "models": ["fdi_model.pkl", "ddos_detector.pkl"]}


@app.post("/api/scan-all")
def scan_all(req: ScanRequest):
    """Scan all nodes for BOTH FDI and DDoS threats."""
    results = []
    for node in req.nodes:
        # ── FDI Detection (Spatial Cross-Referencing) ──
        fdi_result = fdi_detector.detect_fdi(node.voltage, node.neighborVoltages)

        # ── DDoS Detection (Isolation Forest) ──
        ddos_result = detect_ddos(
            node.packetRate, node.packetSize,
            node.connections, node.errorRate
        )

        # Pick the worst threat
        if fdi_result["prediction"] == "FDI_ATTACK":
            threat = "FDI_ATTACK"
            confidence = fdi_result["confidence"]
        elif ddos_result["prediction"] == "DDOS_ATTACK":
            threat = "DDOS_ATTACK"
            confidence = ddos_result["confidence"]
        elif fdi_result["prediction"] == "GENUINE_FAILURE":
            threat = "GENUINE_FAILURE"
            confidence = fdi_result["confidence"]
        else:
            threat = "NORMAL"
            confidence = fdi_result["confidence"]

        results.append({
            "nodeId": node.nodeId,
            "nodeName": node.nodeName,
            "prediction": threat,
            "confidence": confidence,
            "fdi": fdi_result,
            "ddos": ddos_result,
            "extracted_features": fdi_result.get("extracted_features", {}),
        })

    return {"results": results, "scanned": len(results)}


@app.post("/api/log")
def receive_log(entry: LogEntry):
    """Store system logs for the RAG chatbot context."""
    SYSTEM_LOGS.append(entry.model_dump() if hasattr(entry, "model_dump") else entry.dict())
    if len(SYSTEM_LOGS) > 50:
        SYSTEM_LOGS.pop(0)
    return {"status": "ok"}


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    """LangChain RAG endpoint using Ollama."""
    try:
        from langchain_community.llms import Ollama
        llm = Ollama(model="mistral")
        
        # Build context from the last 20 logs
        context_lines = []
        for log in SYSTEM_LOGS[-20:]:
            context_lines.append(f"[{log['timestamp']}] {log['level']}: {log['event']}")
        context_str = "\n".join(context_lines) if context_lines else "No recent events."
        
        prompt = f"""You are GridShield AI, an advanced forensics copilot for a power grid control room.
You analyze telemetry data, FDI (False Data Injection) attacks, and DDoS attacks.
Be concise, professional, and tactical.

Recent Grid Events Context:
{context_str}

Operator Question: {req.message}
GridShield AI Response:"""

        async def generate():
            try:
                for chunk in llm.stream(prompt):
                    yield chunk
            except Exception as e:
                yield f"Error generating text: {e}"

        return StreamingResponse(generate(), media_type="text/plain")

    except Exception as e:
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse(f"Ollama connection error: {str(e)}\nMake sure Ollama is running (`ollama serve`).", status_code=500)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
