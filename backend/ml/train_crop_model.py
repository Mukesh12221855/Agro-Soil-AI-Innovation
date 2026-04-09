"""
Crop Recommendation Model Training
Dataset: crop_recommendation.csv (Kaggle — 2200 rows, 22 Indian crops)
Features: N, P, K, temperature, humidity, ph, rainfall → label: crop name
Model: RandomForestClassifier (scikit-learn)
"""
import os
import sys
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report


def train():
    dataset_path = os.path.join(os.path.dirname(__file__), "..", "datasets", "crop_recommendation.csv")

    if not os.path.exists(dataset_path):
        print(f"ERROR: Dataset not found at {dataset_path}")
        print("Please download crop_recommendation.csv from Kaggle and place it in backend/datasets/")
        sys.exit(1)

    df = pd.read_csv(dataset_path)
    print(f"Dataset shape: {df.shape}")
    print(f"Crops: {df['label'].nunique()} unique classes")

    X = df[["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]].values
    le = LabelEncoder()
    y = le.fit_transform(df["label"])

    scaler = StandardScaler()
    X_sc = scaler.fit_transform(X)

    X_tr, X_te, y_tr, y_te = train_test_split(
        X_sc, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=300,
        max_features="sqrt",
        min_samples_split=2,
        min_samples_leaf=1,
        bootstrap=True,
        n_jobs=-1,
        random_state=42,
    )
    model.fit(X_tr, y_tr)

    test_acc = model.score(X_te, y_te)
    print(f"\nTest Accuracy : {test_acc:.4f}")

    cv = cross_val_score(model, X_sc, y, cv=5)
    print(f"CV Mean±Std   : {cv.mean():.4f} ± {cv.std():.4f}")

    print("\nClassification Report:")
    print(classification_report(y_te, model.predict(X_te), target_names=le.classes_))

    output_dir = os.path.join(os.path.dirname(__file__), "..", "trained_models")
    os.makedirs(output_dir, exist_ok=True)

    joblib.dump(model, os.path.join(output_dir, "crop_rf_model.pkl"))
    joblib.dump(scaler, os.path.join(output_dir, "crop_scaler.pkl"))
    joblib.dump(le, os.path.join(output_dir, "crop_label_encoder.pkl"))

    print(f"\nModels saved to {output_dir}")
    print("  - crop_rf_model.pkl")
    print("  - crop_scaler.pkl")
    print("  - crop_label_encoder.pkl")


if __name__ == "__main__":
    train()
