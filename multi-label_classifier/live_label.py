import cv2
import time
import torch
import torch.nn as nn
import torchvision.transforms as transforms
import torchvision.models as models
from ultralytics import YOLO
from PIL import Image


# =====================================================
# Configuration
# =====================================================

YOLO_MODEL_PATH = "multi-label_classifier\\yolov8n.pt"
INJURY_MODEL_PATH = "multi-label_classifier\\best_injury_multilabel_resnet18.pth"

CAMERA_INDEX = 0

PERSON_CLASS_ID = 0
PERSON_CONF_THRESHOLD = 0.5

MIN_W = 40
MIN_H = 60

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
# Load Models
# =====================================================

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", device)

person_model = YOLO(YOLO_MODEL_PATH)

injury_model = models.resnet18(weights=None)
in_features = injury_model.fc.in_features
injury_model.fc = nn.Linear(in_features, len(LABEL_COLS))

injury_model.load_state_dict(
    torch.load(INJURY_MODEL_PATH, map_location=device)
)

injury_model = injury_model.to(device)
injury_model.eval()

print("Models loaded successfully.")


# =====================================================
# Transform
# =====================================================

inference_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])


# =====================================================
# Injury Prediction
# =====================================================

def predict_injury_from_crop(crop_bgr):
    crop_rgb = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB)
    image = Image.fromarray(crop_rgb).convert("RGB")

    input_tensor = inference_transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = injury_model(input_tensor)
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

    # Keep unclear exclusive
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
# Priority Logic
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
    return "P1"


def build_display_text(detected_labels, urgency):
    if len(detected_labels) == 0:
        return f"no_clear_injury | {urgency}"

    label_parts = []

    for item in detected_labels:
        label_parts.append(
            f"{item['label']} {item['confidence']:.2f}"
        )

    return f"{', '.join(label_parts)} | {urgency}"


def get_box_color(urgency):
    if urgency == "P3":
        return (0, 0, 255)      # red
    elif urgency == "P2":
        return (0, 165, 255)    # orange
    else:
        return (0, 255, 0)      # green


# =====================================================
# Start Camera
# =====================================================

cap = cv2.VideoCapture(CAMERA_INDEX)

if not cap.isOpened():
    raise RuntimeError("Error: Could not open camera.")

print("Live injured-person boxing started. Press 'q' to quit.")

prev_time = time.time()


# =====================================================
# Main Loop
# =====================================================

while True:
    ret, frame = cap.read()

    if not ret:
        print("Failed to read frame.")
        break

    frame_h, frame_w = frame.shape[:2]

    results = person_model(
        frame,
        conf=PERSON_CONF_THRESHOLD,
        verbose=False
    )

    for result in results:
        boxes = result.boxes

        if boxes is None:
            continue

        for box in boxes:
            cls_id = int(box.cls[0].item())
            person_conf = float(box.conf[0].item())

            if cls_id != PERSON_CLASS_ID:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())

            x1 = max(0, x1)
            y1 = max(0, y1)
            x2 = min(frame_w, x2)
            y2 = min(frame_h, y2)

            w = x2 - x1
            h = y2 - y1

            if w < MIN_W or h < MIN_H:
                continue

            person_crop = frame[y1:y2, x1:x2]

            if person_crop.size == 0:
                continue

            detected_labels, all_results = predict_injury_from_crop(person_crop)

            urgency = calculate_urgency(detected_labels)

            display_text = build_display_text(detected_labels, urgency)

            box_color = get_box_color(urgency)

            # Draw box around the person
            cv2.rectangle(
                frame,
                (x1, y1),
                (x2, y2),
                box_color,
                2
            )

            # Draw label background
            text_x = x1
            text_y = max(25, y1 - 10)

            cv2.putText(
                frame,
                display_text,
                (text_x, text_y),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                box_color,
                2
            )

    # FPS
    current_time = time.time()
    fps = 1 / (current_time - prev_time)
    prev_time = current_time

    cv2.putText(
        frame,
        f"FPS: {fps:.2f}",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 0, 0),
        2
    )

    cv2.imshow("Injured Person Detection Box", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break


cap.release()
cv2.destroyAllWindows()

print("System stopped.")