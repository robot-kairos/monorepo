# Earthquake robot server + web UI

This repo consists of

- Backend: a Python server that
  - Reads webcam as input, streaming video via HTTP
  - Subscribes to ROS 2 topics to read sensors
- Frontend: a Vite project that hosts the website frontend

## Structure

```
robot_web/
├── apps/
│   ├── frontend/       # Vite + React 18 + TypeScript
│   └── backend/        # FastAPI + OpenCV  (Python 3.13, uv)
├── package.json        # npm workspaces root
└── pyproject.toml      # uv workspace root
```

## Getting started

You will need these in order to run the project:

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| npm | 10+ |
| Python | 3.13+ |
| [uv](https://docs.astral.sh/uv/) | latest |
| tailscale | latest |
| [ROS 2](https://docs.ros.org/en/foxy/Installation/Ubuntu-Install-Debians.html) | latest |

Given the complexity of the ROS 2 environment, it is suggested
to work on this repo on Ubuntu if you want to work on the backend server.

However if you want to work only on the frontend server, you can make it work
by mocking the backend server (consult AI for this).

Also, direnv should be installed in order to automatically activate
the ROS 2 environment, or you can run directly the `.envrc` file.

Tailscale should be connected to Giovanni's tailnet
to access the servers in another device.

```bash
# Install all dependencies
npm install
cd apps/backend && uv sync

# Start both servers
npm run dev

# Start frontend
npm run dev:frontend

# Start backend
npm run dev:backend
```

## Backend API

**`GET /video`** — MJPEG stream from the connected camera device. Falls back to a "NO SIGNAL" placeholder frame if no device is found.

**`WS /ws`** — WebSocket for real-time sensor data and command bus.

## Connection to ROS

The backend is designed to be wired up to a ROS 2 robot. See [./apps/backend/main.py](./apps/backend/main.py)

