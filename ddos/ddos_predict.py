import joblib
import numpy as np

# load trained model
model = joblib.load("ddos_detector.pkl")


def predict_ddos(packet_rate, packet_size, connections, error_rate):

    sample = np.array([[packet_rate, packet_size, connections, error_rate]])

    prediction = model.predict(sample)

    if prediction[0] == -1:
        return "DDOS ATTACK DETECTED"
    else:
        return "NORMAL TRAFFIC"


# -----------------------------
# Example test
# -----------------------------

if __name__ == "__main__":

    normal = predict_ddos(520, 500, 45, 0.01)
    attack = predict_ddos(2000000, 400, 2000, 0.3)

    print("Normal test:", normal)
    print("Attack test:", attack)