# Kairos Server & Web UI

A real-time disaster response platform for earthquake survivor rescue operations. A mobile-first web UI connects to a FastAPI backend that handles video streaming, computer vision injury detection, and sensor data from Kairos robot.

## Structure

```
robot-monorepo/
├── apps/
│   ├── frontend/                   # Vite + React 18 + TypeScript + Tailwind CSS
│   └── backend/                    # FastAPI + OpenCV + PyTorch (Python 3.12+, uv)
├── multi-label_classifier/         # Pre-trained YOLO + ResNet18 injury detection models
├── package.json                    # npm workspaces root
├── pyproject.toml                  # uv workspace root
└── docker-compose.dev.yml          # Local dev environment
```

## Getting Started

### Requirements

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| npm | 10+ |
| Python | 3.12+ |
| [uv](https://docs.astral.sh/uv/) | latest |

[direnv](https://direnv.net/) is recommended to auto-activate the ROS 2 environment via `.envrc`.

### Install & Run

```bash
# Install all dependencies
npm install
cd apps/backend && uv sync

# Start both servers concurrently
npm run dev

# Or start individually
npm run dev:frontend   # Vite on http://localhost:5173
npm run dev:backend    # FastAPI on http://localhost:8000

# Production
npm run build
npm start
```

## Frontend

A mobile-first application with a multi-screen flow enforcing orientation:

| Screen | Orientation | Purpose |
|--------|-------------|---------|
| Onboarding | Portrait | Welcome / splash |
| Tutorial | Portrait | Instructions for operators |
| Step Execution | Landscape | Main control interface |
| Create Profile | Landscape | Post-rescue survivor record |

**Step Execution** is the primary interface:
- Live video stream from the robot via WebRTC (low-latency, H.264)
- Real-time sensor telemetry: heart rate, breathing rate, distance, temperature
- Push-to-Talk (PTT) button for audio communication
- Audio command dispatch to the robot
- Activity log (up to 50 entries)

## Backend

### Video Pipeline

- **Camera capture**: Background thread reads frames from `/dev/video0`; falls back to a "NO SIGNAL" placeholder if no device is found
- **YOLOv8n**: Person detection at ~5 fps
- **ResNet18 multi-label classifier**: Injury detection per detected person
  - Labels: `open_wound`, `swelling`, `trapped_limb`, `unclear`, `visible_blood`
  - Urgency triage: P3 (trapped limb) → P2 (open wound / visible blood) → P1 (no injuries)
- Frames are resized to 640 px wide and JPEG-encoded at 55% quality

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/video` | MJPEG stream (fallback if no WebRTC) |
| `POST` | `/webrtc/offer` | WebRTC signaling (SDP offer → answer) |
| `WS` | `/ws` | Real-time sensor data and command bus |

## ML Models

Pre-trained models live in `multi-label_classifier/`:

| File | Purpose |
|------|---------|
| `yolov8n.pt` | Person detection (YOLOv8 nano, 6.5 MB) |
| `best_injury_multilabel_resnet18.pth` | Injury multi-label classification (ResNet18, 44 MB) |

