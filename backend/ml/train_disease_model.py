"""
Disease Detection Model Training
Dataset: PlantVillage (38 disease classes, ~54,000 images)
Features: HOG + LBP + Color Histogram
Model: RandomForestClassifier with SMOTE balancing
"""
import os
import sys
import numpy as np
import joblib
from pathlib import Path
from collections import Counter
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

sys.path.insert(0, os.path.dirname(__file__))
from feature_extractor import extract_features


def train():
    dataset_path = os.path.join(os.path.dirname(__file__), "..", "datasets", "PlantVillage")

    if not os.path.exists(dataset_path):
        print(f"ERROR: Dataset not found at {dataset_path}")
        print("Please download PlantVillage dataset and place it in backend/datasets/PlantVillage/")
        print("Each class should be in its own subdirectory.")
        sys.exit(1)

    features, labels = [], []
    dataset_dir = Path(dataset_path)

    for class_folder in sorted(dataset_dir.iterdir()):
        if not class_folder.is_dir():
            continue
        count = 0
        for img_file in class_folder.glob("*.jpg"):
            feat = extract_features(str(img_file))
            if feat is not None:
                features.append(feat)
                labels.append(class_folder.name)
                count += 1
        for img_file in class_folder.glob("*.JPG"):
            feat = extract_features(str(img_file))
            if feat is not None:
                features.append(feat)
                labels.append(class_folder.name)
                count += 1
        for img_file in class_folder.glob("*.png"):
            feat = extract_features(str(img_file))
            if feat is not None:
                features.append(feat)
                labels.append(class_folder.name)
                count += 1
        print(f"  {class_folder.name}: {count} images")

    print(f"\nTotal: {len(features)} images across {len(set(labels))} classes")

    X = np.array(features)
    le = LabelEncoder()
    y = le.fit_transform(labels)

    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Apply SMOTE if class imbalance exists
    counts = Counter(y_tr)
    if max(counts.values()) / max(min(counts.values()), 1) > 3:
        try:
            from imblearn.over_sampling import SMOTE
            smote = SMOTE(random_state=42, k_neighbors=3)
            X_tr, y_tr = smote.fit_resample(X_tr, y_tr)
            print("SMOTE applied for class balancing.")
        except ImportError:
            print("imblearn not installed — skipping SMOTE.")

    model = RandomForestClassifier(
        n_estimators=300,
        class_weight="balanced",
        n_jobs=-1,
        random_state=42,
    )
    model.fit(X_tr, y_tr)

    test_acc = model.score(X_te, y_te)
    print(f"\nTest Accuracy : {test_acc:.4f}")

    print("\nClassification Report:")
    print(classification_report(y_te, model.predict(X_te), target_names=le.classes_))

    output_dir = os.path.join(os.path.dirname(__file__), "..", "trained_models")
    os.makedirs(output_dir, exist_ok=True)

    joblib.dump(model, os.path.join(output_dir, "disease_rf_model.pkl"))
    joblib.dump(le, os.path.join(output_dir, "disease_label_encoder.pkl"))

    print(f"\nModels saved to {output_dir}")
    print("  - disease_rf_model.pkl")
    print("  - disease_label_encoder.pkl")


if __name__ == "__main__":
    train()
