"""
Feature extraction for plant disease detection.
Extracts HOG (shape/edge), LBP (texture), and Color Histogram (HSV) features
from leaf images for Random Forest classification.
"""
import cv2
import numpy as np
from skimage.feature import hog, local_binary_pattern


def extract_features(image_path: str):
    """Extract HOG + LBP + Color Histogram features from an image."""
    img = cv2.imread(image_path)
    if img is None:
        return None

    img = cv2.resize(img, (128, 128))
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # HOG — shape and edge of disease lesions
    hog_feat = hog(
        gray,
        orientations=9,
        pixels_per_cell=(16, 16),
        cells_per_block=(2, 2),
        feature_vector=True,
    )

    # LBP — surface texture patterns
    lbp = local_binary_pattern(gray, P=8, R=1, method="uniform")
    lbp_hist, _ = np.histogram(lbp.ravel(), bins=59, range=(0, 59), density=True)

    # Color histogram in HSV — yellowing, browning, dark spots
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    color_hist = []
    for ch in range(3):
        h, _ = np.histogram(hsv[:, :, ch], bins=32, range=(0, 256), density=True)
        color_hist.extend(h)

    return np.concatenate([hog_feat, lbp_hist, color_hist])
