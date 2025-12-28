#!/bin/bash
set -e

# --- Configuration ---
VNC_PASSWORD=${VNC_PASSWORD:-password}
RUNNER_TOKEN=${RUNNER_TOKEN}
REPO_URL=${REPO_URL:-"https://github.com/centervil/my-apps"}
RUNNER_NAME=${RUNNER_NAME:-"docker-self-hosted-runner"}
RUNNER_LABELS=${RUNNER_LABELS:-"self-hosted,linux,docker"}

# --- Tailscale Setup ---
echo "Starting Tailscale..."
sudo tailscaled --tun=userspace-networking --socks5-server=localhost:1055 --outbound-http-proxy-listen=localhost:1055 &

if [ -n "$TS_AUTHKEY" ]; then
    echo "Connecting to Tailscale..."
    sudo tailscale up --authkey="${TS_AUTHKEY}" --hostname="${RUNNER_NAME}" --accept-routes
else
    echo "TS_AUTHKEY not provided. Tailscale will not connect automatically."
fi

# --- VNC Setup ---
mkdir -p /home/devuser/.vnc
echo "$VNC_PASSWORD" | vncpasswd -f > /home/devuser/.vnc/passwd
chmod 600 /home/devuser/.vnc/passwd

# Start VNC server
vncserver :1 -geometry 1280x800 -depth 24

# Start noVNC
/usr/share/novnc/utils/launch.sh --vnc localhost:5901 --listen 6080 &

# --- GitHub Runner Setup ---
cd /home/devuser/actions-runner

if [ -n "$RUNNER_TOKEN" ]; then
    echo "Configuring GitHub Runner..."
    # Remove existing config if any
    ./config.sh remove --token "${RUNNER_TOKEN}" || true
    
    ./config.sh --url "${REPO_URL}" \
                --token "${RUNNER_TOKEN}" \
                --name "${RUNNER_NAME}" \
                --labels "${RUNNER_LABELS}" \
                --unattended \
                --replace
else
    echo "RUNNER_TOKEN not provided. Skipping runner configuration."
fi

# --- Repository Setup (Dynamic Clone) ---
WORKSPACE_DIR="/home/devuser/workspace"
mkdir -p "$WORKSPACE_DIR"
cd "$WORKSPACE_DIR"

# TOOL_REPO_URL が指定されていない場合は REPO_URL を使用（後方互換性）
CLONE_URL=${TOOL_REPO_URL:-$REPO_URL}

if [ ! -d "my-apps" ]; then
    echo "Cloning repository ${CLONE_URL}..."
    git clone "${CLONE_URL}" my-apps
fi

cd my-apps
echo "Installing dependencies..."
pnpm install

# --- Start Runner ---
echo "Starting GitHub Runner Agent..."
cd /home/devuser/actions-runner
./run.sh
