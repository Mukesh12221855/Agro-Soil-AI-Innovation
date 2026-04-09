"""
Fertilizer Recommendation Model Training
Dataset: Fertilizer_Prediction.csv (Kaggle)
Features: Temperature, Humidity, Moisture, Soil Type (OHE), Crop Type (OHE), N, K, P
Model: RandomForestClassifier (scikit-learn)
"""
import os
import sys
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report


def train():
    dataset_path = os.path.join(os.path.dirname(__file__), "..", "datasets", "Fertilizer_Prediction.csv")

    if not os.path.exists(dataset_path):
        print(f"ERROR: Dataset not found at {dataset_path}")
        print("Please download Fertilizer_Prediction.csv from Kaggle and place it in backend/datasets/")
        sys.exit(1)

    df = pd.read_csv(dataset_path)
    print(f"Dataset shape: {df.shape}")
    print(f"Fertilizers: {df['Fertilizer Name'].nunique()} unique classes")

    le = LabelEncoder()
    y = le.fit_transform(df["Fertilizer Name"])

    feature_df = df.drop(columns=["Fertilizer Name"])
    feature_df = pd.get_dummies(feature_df, columns=["Soil Type", "Crop Type"])

    feature_cols = list(feature_df.columns)
    X = feature_df.values

    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        n_jobs=-1,
        class_weight="balanced",
    )
    model.fit(X_tr, y_tr)

    test_acc = model.score(X_te, y_te)
    print(f"\nTest Accuracy : {test_acc:.4f}")

    print("\nClassification Report:")
    print(classification_report(y_te, model.predict(X_te), target_names=le.classes_))

    output_dir = os.path.join(os.path.dirname(__file__), "..", "trained_models")
    os.makedirs(output_dir, exist_ok=True)

    joblib.dump(model, os.path.join(output_dir, "fertilizer_rf_model.pkl"))
    joblib.dump(feature_cols, os.path.join(output_dir, "fertilizer_feature_cols.pkl"))
    joblib.dump(le, os.path.join(output_dir, "fertilizer_label_encoder.pkl"))

    print(f"\nModels saved to {output_dir}")
    print("  - fertilizer_rf_model.pkl")
    print("  - fertilizer_feature_cols.pkl")
    print("  - fertilizer_label_encoder.pkl")


if __name__ == "__main__":
    train()
