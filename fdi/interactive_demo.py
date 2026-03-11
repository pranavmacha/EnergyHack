import time
from fdi_detector import FDIDetector

def main():
    print("============================================================")
    print("       GridShield AI - Interactive FDI Tester ")
    print("============================================================\n")
    
    try:
        detector = FDIDetector()
        print("Model loaded successfully. Type 'quit' at any prompt to exit.\n")
    except Exception as e:
        print(f"Error loading model: {e}")
        print("Tip: Ensure you have run 'python train_model.py' first.")
        return

    while True:
        try:
            print("-" * 60)
            node_v_str = input("Enter target node voltage (e.g., 230): ")
            if node_v_str.lower() in ['quit', 'q', 'exit']:
                break
            
            node_v = float(node_v_str)

            neighbors_str = input("Enter neighbor voltages separated by space (e.g., 231 228 229): ")
            if neighbors_str.lower() in ['quit', 'q', 'exit']:
                break

            # Parse neighbors, allowing empty input if no neighbors
            neighbors_v = [float(x) for x in neighbors_str.split()] if neighbors_str.strip() else []

            print("\nAnalyzing spatial correlation...")
            time.sleep(0.5)

            result = detector.detect_fdi(node_v, neighbors_v)
            
            prediction = result['prediction']
            confidence = result['confidence']
            features = result['extracted_features']
            
            color_start = "\033[0m" # Reset
            color_end = "\033[0m"
            action = "CONTINUE MONITORING"
            
            if prediction == "FDI_ATTACK":
                color_start = "\033[91m" # Red
                action = "QUARANTINE NODE"
            elif prediction == "GENUINE_FAILURE":
                color_start = "\033[93m" # Yellow
                action = "DISPATCH REPAIR CREW"
            else:
                color_start = "\033[92m" # Green

            print(f"    {color_start}Prediction        : {prediction}{color_end}")
            print(f"    {color_start}Confidence        : {confidence}{color_end}")
            print(f"    {color_start}Recommended Action: {action}{color_end}")
            print(f"\n    Extracted Features used by Model:")
            for feature, val in features.items():
                print(f"      - {feature}: {val:.2f}" if isinstance(val, float) else f"      - {feature}: {val}")
            print()

        except ValueError:
            print("\n❌ Invalid input. Please enter numbers only.\n")
        except Exception as e:
            print(f"\n❌ Error: {e}\n")

if __name__ == "__main__":
    main()
