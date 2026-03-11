import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import joblib

def load_and_preprocess_data(filepath):
    """
    Loads telemetry data and extracts features for the ML model.
    """
    df = pd.read_csv(filepath)
    
    # Feature Engineering: We'll use the spatial features
    # as defined in the project prompt and generated in generate_dataset.py
    features = [
        'voltage', 
        'neighbor_mean', 
        'neighbor_variance',
        'difference_from_neighbors', 
        'voltage_ratio'
    ]
    
    X = df[features]
    y = df['label'] # 0 = Genuine Fault / Normal, 1 = FDI Spoof
    
    return X, y, features

def train_model(X, y, features):
    """
    Trains a RandomForestClassifier and evaluates performance.
    """
    # Split into train and test sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Initialize the model
    # Random Forest is lightweight, strong for tabular data, and provides feature importance
    print("Training RandomForestClassifier...")
    clf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)
    
    # Predictions
    y_pred = clf.predict(X_test)
    
    # Evaluation Metrics
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    conf_matrix = confusion_matrix(y_test, y_pred)
    
    print("\n--- Model Evaluation Metrics ---")
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    
    print("\nConfusion Matrix:")
    print("                 Predicted Genuine(0)  Predicted FDI(1)")
    print(f"Actual Genuine  | {conf_matrix[0][0]:<20} | {conf_matrix[0][1]}")
    print(f"Actual FDI      | {conf_matrix[1][0]:<20} | {conf_matrix[1][1]}")
    
    # Explainability: Feature Importance
    importances = clf.feature_importances_
    
    print("\n--- Feature Importance ---")
    importance_df = pd.DataFrame({
        'Feature': features,
        'Importance': importances
    }).sort_values(by='Importance', ascending=False)
    
    for _, row in importance_df.iterrows():
        print(f"{row['Feature']:25}: {row['Importance']:.4f}")
        
    return clf

if __name__ == "__main__":
    filepath = "grid_telemetry_data.csv"
    print(f"Loading data from {filepath}...")
    
    try:
        X, y, feature_names = load_and_preprocess_data(filepath)
        
        # Train and evaluate the model
        model = train_model(X, y, feature_names)
        
        # Save the model
        model_filename = "fdi_model.pkl"
        joblib.dump(model, model_filename)
        print(f"\nModel saved successfully to {model_filename}")
        
    except FileNotFoundError:
        print(f"Error: Could not find {filepath}. Please run generate_dataset.py first.")
