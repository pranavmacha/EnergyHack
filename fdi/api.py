"""
GridShield AI — FDI Detection API
Exposes the pre-trained FDI ML model as a REST API for the React dashboard.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fdi_detector import FDIDetector

app = FastAPI(title="GridShield FDI API")

# Allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model once on startup
model_path = os.path.join(os.path.dirname(__file__), "fdi_model.pkl")
detector = FDIDetector(model_path=model_path)


# ── Request / Response schemas ──────────────────────────────

class NodeReading(BaseModel):
    nodeId: str
    nodeName: str
    voltage: float
    neighborVoltages: list[float]


class ScanRequest(BaseModel):
    nodes: list[NodeReading]


# ── Endpoints ───────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "model": "fdi_model.pkl"}


@app.post("/api/detect")
def detect_single(reading: NodeReading):
    """Analyze a single node for FDI attack."""
    result = detector.detect_fdi(reading.voltage, reading.neighborVoltages)
    return {
        "nodeId": reading.nodeId,
        "nodeName": reading.nodeName,
        **result,
    }


@app.post("/api/scan-all")
def scan_all(req: ScanRequest):
    """Scan all nodes and return FDI analysis for each."""
    results = []
    for node in req.nodes:
        result = detector.detect_fdi(node.voltage, node.neighborVoltages)
        results.append({
            "nodeId": node.nodeId,
            "nodeName": node.nodeName,
            **result,
        })
    return {"results": results, "scanned": len(results)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
