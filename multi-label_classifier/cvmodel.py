import os
import argparse
import json

import torch
import torch.nn as nn
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image


# =====================================================
# Configuration
# =====================================================

INJURY_MODEL_PATH = "best_injury_multilabel_resnet18.pth"

LABEL_COLS = [
    "open_wound",
    "swelling",
    "trapped_limb",
    "unclear",
    "visible_blood",
]

CLASS_THRESHOLDS = {
    "open_wound": 0.30,
    "swelling": 0.35,
    "trapped_limb": 0.50,
    "unclear": 0.40,
    "visible_blood": 0.35,
}


# =====================================================
# Load Injury Model
# =====================================================

def load_injury_model(model_path):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    model = models.resnet18(weights=None)

    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, len(LABEL_COLS))

    model.load_state_dict(torch.load(model_path, map_location=device))
    model = model.to(device)
    model.eval()

    return model, device


# =====================================================
# Image Transform
# =====================================================

def get_inference_transform():
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
    ])

    return transform


# =====================================================
# Predict Injury Labels
# =====================================================

def predict_image_labels(image_path, model, device, transform):
    image = Image.open(image_path).convert("RGB")

    input_tensor = transform(image)
    input_tensor = input_tensor.unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(input_tensor)
        probabilities = torch.sigmoid(outputs).cpu().numpy()[0]

    all_results = {}

    for label, probability in zip(LABEL_COLS, probabilities):
        threshold = CLASS_THRESHOLDS[label]

        all_results[label] = {
            "confidence": round(float(probability), 3),
            "threshold": threshold,
            "predicted": bool(probability >= threshold),
        }

    predicted_labels = [
        label for label, data in all_results.items()
        if data["predicted"]
    ]

    # Keep unclear exclusive:
    # If any clear injury label is detected, remove unclear.
    clear_labels = [
        label for label in predicted_labels
        if label != "unclear"
    ]

    if len(clear_labels) > 0:
        predicted_labels = clear_labels
        all_results["unclear"]["predicted"] = False

    detected_labels = [
        {
            "label": label,
            "confidence": all_results[label]["confidence"],
        }
        for label in predicted_labels
    ]

    return detected_labels, all_results


# =====================================================
# Priority / Urgency Logic
# =====================================================

def calculate_urgency(detected_labels):
    label_names = [item["label"] for item in detected_labels]

    # P3 = Critical
    if "trapped_limb" in label_names:
        return "P3"

    # P2 = High
    if "open_wound" in label_names:
        return "P2"

    if "visible_blood" in label_names:
        return "P2"

    # P1 = Rest
    # swelling, unclear, or no clear injury
    return "P1"


# =====================================================
# Main Pipeline
# =====================================================

def run_pipeline(image_path):
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    if not os.path.exists(INJURY_MODEL_PATH):
        raise FileNotFoundError(f"Model not found: {INJURY_MODEL_PATH}")

    model, device = load_injury_model(INJURY_MODEL_PATH)

    transform = get_inference_transform()

    detected_labels, all_results = predict_image_labels(
        image_path=image_path,
        model=model,
        device=device,
        transform=transform,
    )

    urgency_level = calculate_urgency(detected_labels)

    output = {
        "image_path": image_path,
        "detected_labels": detected_labels,
        "urgency_level": urgency_level,
        "all_label_probabilities": all_results,
    }

    print(json.dumps(output, indent=2))

    return output


# =====================================================
# CLI
# =====================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Predict injury labels and urgency priority from an image."
    )

    parser.add_argument(
        "--image",
        required=True,
        help="Path to input image.",
    )

    args = parser.parse_args()

    run_pipeline(args.image)