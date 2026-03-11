import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib

# -----------------------------
# Generate normal network traffic
# -----------------------------

np.random.seed(42)

data = {
    "packet_rate": np.random.normal(500, 50, 1000),
    "packet_size": np.random.normal(512, 40, 1000),
    "connections": np.random.normal(50, 10, 1000),
    "error_rate": np.random.normal(0.01, 0.005, 1000)
}

df = pd.DataFrame(data)

# -----------------------------
# Train Isolation Forest model
# -----------------------------

model = IsolationForest(
    contamination=0.02,
    random_state=42
)

model.fit(df)

print("✅ DDoS detection model trained")

# -----------------------------
# Save model
# -----------------------------

joblib.dump(model, "ddos_detector.pkl")

print("✅ Model saved as ddos_detector.pkl")