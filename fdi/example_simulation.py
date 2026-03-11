import time
from fdi_detector import FDIDetector

def print_header():
    print("="*60)
    print("         GridShield AI - FDI Detection Pipeline ")
    print("="*60)
    
def simulate_scenario(detector, name, node_id, node_v, neighbors_v, delay=1.0):
    print(f"\n[!] Simulating Scenario: {name}")
    time.sleep(delay)
    print(f"    Target Node       : {node_id}")
    print(f"    Node Voltage      : {node_v}V")
    print(f"    Neighbor Voltages : {neighbors_v}V")
    
    print("\n    Analyzing Spatial Correlation...")
    time.sleep(delay * 1.5)
    
    result = detector.detect_fdi(node_v, neighbors_v)
    
    prediction = result['prediction']
    confidence = result['confidence']
    
    action = "None"
    color_start = "\033[0m" # Reset
    color_end = "\033[0m"
    
    if prediction == "FDI_ATTACK":
        action = "QUARANTINE NODE. IGNORE TELEMETRY."
        color_start = "\033[91m" # Red
    elif prediction == "GENUINE_FAILURE":
        action = "DISPATCH REPAIR CREW."
        color_start = "\033[93m" # Yellow
    else:
        action = "CONTINUE MONITORING."
        color_start = "\033[92m" # Green
        
    print(f"    {color_start}Prediction        : {prediction}{color_end}")
    print(f"    {color_start}Confidence        : {confidence}{color_end}")
    print(f"    {color_start}Recommended Action: {action}{color_end}")
    print("-" * 60)

if __name__ == "__main__":
    print_header()
    time.sleep(1)
    
    try:
        print("Loading Pre-Trained RF Model (fdi_model.pkl)...")
        detector = FDIDetector()
        print("Model Loaded Successfully.\n")
        time.sleep(1)
        
        # Scenario 1: Normal Grid Operations
        simulate_scenario(
            detector,
            name="Normal Grid Operations",
            node_id="Substation_012",
            node_v=230.5,
            neighbors_v=[229.8, 231.2, 230.1]
        )
        
        # Scenario 2: Genuine Physical Failure (Trees on power line)
        simulate_scenario(
            detector,
            name="Physical Line Fault (Tree Fall)",
            node_id="Substation_045",
            node_v=35.0, # Massive drop
            neighbors_v=[42.0, 39.5] # Neighbors also experience drop
        )
        
        # Scenario 3: The FDI Attack 
        simulate_scenario(
            detector,
            name="False Data Injection (FDI) Attack",
            node_id="Substation_088",
            node_v=0.0, # Attacker spoofs catastrophic failure
            neighbors_v=[228.0, 231.5, 229.2] # Neighbors are perfectly fine!
        )
        
        print("\n[SUCCESS] Simulation Complete. GridShield AI is active.")
        
    except Exception as e:
        print(f"\n[ERROR] {str(e)}")
        print("Tip: Did you run train_model.py first to generate fdi_model.pkl?")