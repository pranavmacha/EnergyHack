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
from pydantic import BaseModel

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


# ── DDoS detection helper ──────────────────────────────────

def detect_ddos(packet_rate, packet_size, connections, error_rate):
    """Use Isolation Forest to detect DDoS anomalies."""
    sample = np.array([[packet_rate, packet_size, connections, error_rate]])
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
