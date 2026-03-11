import joblib
import numpy as np
import pandas as pd

class FDIDetector:
    def __init__(self, model_path="fdi_model.pkl"):
        """
        Initializes the FDI detector by loading the pre-trained ML model.
        """
        try:
            self.model = joblib.load(model_path)
            self.features = [
                'voltage', 
                'neighbor_mean', 
                'neighbor_variance',
                'difference_from_neighbors', 
                'voltage_ratio'
            ]
        except FileNotFoundError:
            raise Exception(f"Model file '{model_path}' not found. Please train the model first.")
            
    def _extract_features(self, node_voltage, neighbor_voltages):
        """
        Computes spatial features from raw telemetry readings.
        """
        if not neighbor_voltages:
            # Fallback if node has no neighbors (isolated node)
            n_mean = node_voltage
            n_var = 0.0
        else:
            n_mean = np.mean(neighbor_voltages)
            n_var = np.var(neighbor_voltages) if len(neighbor_voltages) > 1 else 0.0
            
        diff = abs(node_voltage - n_mean)
        v_ratio = node_voltage / n_mean if n_mean != 0 else 0
        
        # Return as a DataFrame to match exactly how sklearn trained it
        feature_dict = {
            'voltage': node_voltage,
            'neighbor_mean': n_mean,
            'neighbor_variance': n_var,
            'difference_from_neighbors': diff,
            'voltage_ratio': v_ratio
        }
        
        return pd.DataFrame([feature_dict])[self.features]

    def detect_fdi(self, node_voltage, neighbor_voltages):
        """
        Detects if a telemetry reading is a False Data Injection (FDI) attack
        or a Genuine Physical Failure based on spatial cross-referencing.
        
        Returns:
            dict: Prediction result ('FDI_ATTACK', 'GENUINE_FAILURE', or 'NORMAL') 
                  and confidence score.
        """
        # 1. Feature Engineering (Spatial Cross-Referencing)
        X = self._extract_features(node_voltage, neighbor_voltages)
        
        # 2. Inference
        prediction_num = self.model.predict(X)[0]
        probabilities = self.model.predict_proba(X)[0]
        confidence = round(float(probabilities[prediction_num]) * 100, 2)
        
        # 3. Interpret Results
        # Label 0 = Normal / Genuine Fault
        # Label 1 = FDI Spoofed Attack
        
        if prediction_num == 1:
            prediction_label = "FDI_ATTACK"
        else:
            # We must differentiate between 'Normal' and 'Genuine Fault' manually 
            # since the classifier groups them together as "Not an Attack"
            n_mean = X['neighbor_mean'].iloc[0]
            # Normal voltage in grid is around 230V. If neighbor mean drops significantly,
            # it indicates a genuine physical failure affecting the area.
            if n_mean < 200: 
                prediction_label = "GENUINE_FAILURE"
            else:
                prediction_label = "NORMAL"

        return {
            "prediction": prediction_label,
            "confidence": f"{confidence}%",
            "extracted_features": X.to_dict(orient='records')[0]
        }

# Example usage if run directly
if __name__ == "__main__":
    detector = FDIDetector()
    
    # Test Normal
    print(detector.detect_fdi(230, [231, 228]))
    
    # Test Genuine Failure
    print(detector.detect_fdi(40, [45, 38]))
    
    # Test FDI Attack
    print(detector.detect_fdi(0, [228, 231]))
