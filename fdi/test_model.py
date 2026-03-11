import pandas as pd
from fdi_detector import FDIDetector

def test_model_with_mock_data():
    """
    Tests the trained FDI ML model using a set of mock input data.
    """
    print("Loading the trained model...")
    try:
        detector = FDIDetector()
    except Exception as e:
        print(f"Error: {e}")
        return

    # Define your mock data here to test the model
    # Each item needs a target 'node_voltage' and a list of 'neighbor_voltages'
    mock_data = [
        # Normal Situations
        {"scenario": "Normal Day 1",   "node_voltage": 230.1, "neighbor_voltages": [229.5, 231.0, 230.2]},
        {"scenario": "Normal Day 2",   "node_voltage": 228.0, "neighbor_voltages": [227.5, 229.0, 228.1]},
        
        # Genuine Physical Failures (Line fault, equipment failure)
        # Node and neighbors all drop together
        {"scenario": "Tree on Line",   "node_voltage": 45.0,  "neighbor_voltages": [42.0, 48.0, 44.5]},
        {"scenario": "Substation Off", "node_voltage": 0.0,   "neighbor_voltages": [0.0,  5.0,  0.0]},

        # False Data Injection (Cyberattacks!)
        # Attacker spoofs target node, but neighbors are fine
        {"scenario": "Zero Spoof",     "node_voltage": 0.0,   "neighbor_voltages": [229.5, 231.0, 230.2]},
        {"scenario": "Surge Spoof",    "node_voltage": 500.0, "neighbor_voltages": [230.0, 229.5, 230.5]},
        {"scenario": "Slight Drop",    "node_voltage": 180.0, "neighbor_voltages": [230.1, 229.8, 230.0]},
    ]

    print("\nStarting tests on mock data...\n")
    print(f"{'Scenario':<20} | {'Node (V)':<10} | {'Neighbors (V)':<25} | {'Prediction':<18} | {'Confidence'}")
    print("-" * 95)

    for item in mock_data:
        scenario = item["scenario"]
        node_v = item["node_voltage"]
        neighbors_v = item["neighbor_voltages"]

        # Run the model prediction
        result = detector.detect_fdi(node_v, neighbors_v)
        
        prediction = result["prediction"]
        confidence = result["confidence"]
        
        neighbors_str = str(neighbors_v)
        
        # Add a little color based on the prediction for readability
        color_start = "\033[0m"
        if prediction == "FDI_ATTACK":
            color_start = "\033[91m" # Red
        elif prediction == "GENUINE_FAILURE":
            color_start = "\033[93m" # Yellow
        else:
            color_start = "\033[92m" # Green
            
        color_end = "\033[0m"

        print(f"{scenario:<20} | {node_v:<10} | {neighbors_str:<25} | {color_start}{prediction:<18}{color_end} | {confidence}")

if __name__ == "__main__":
    test_model_with_mock_data()
