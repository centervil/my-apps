#!/bin/bash
# Ensure non-zero exit code if any command fails.
set -e

# Default START_VNC_SERVER to false if not set
: "${START_VNC_SERVER:=false}"
# VNC_PASSWORD must be set
if [ -z "${VNC_PASSWORD}" ]; then
  echo "Error: VNC_PASSWORD environment variable is not set." >&2
  exit 1
fi

# Change ownership of .vnc directory for devuser
echo "Setting .vnc ownership..."
chown -R devuser:devuser /home/devuser/.vnc
echo "Ownership set."

# Fix workspace permissions
echo "Fixing workspace permissions..."
chown -R devuser:devuser /home/devuser/workspace || echo "Warning: chown failed for some files (likely read-only mounts)"
echo "Workspace permissions fixed."

# Set up the development environment for devuser
echo "Setting up Node.js environment..."
sudo -u devuser /bin/bash -c "
    # Add node_modules/.bin to PATH in .bashrc if it's not already there
    if ! grep -q 'node_modules/.bin' /home/devuser/.bashrc; then
        echo 'export PATH=\"\$PATH:/home/devuser/workspace/node_modules/.bin\"' >> /home/devuser/.bashrc
    fi

    # Navigate to workspace and install dependencies and Playwright browsers
    cd /home/devuser/workspace
    pnpm install
    pnpm exec playwright install --with-deps
"
echo "Node.js environment setup complete."

# Set VNC password
echo "Setting VNC password..."
sudo -u devuser /bin/bash -c "
    mkdir -p /home/devuser/.vnc
    printf '%s\n' "${VNC_PASSWORD}" | vncpasswd -f > /home/devuser/.vnc/passwd
    chmod 600 /home/devuser/.vnc/passwd
"
echo "VNC password set."

# Start tailscaled in the background
echo "Starting tailscaled in background..."
/usr/sbin/tailscaled --state=/var/lib/tailscale/tailscaled.state --socket=/var/run/tailscale/tailscaled.sock &
echo "tailscaled started (PID: $!)"

# Connect to tailnet
echo "Bringing Tailscale up..."
echo "If you are running this for the first time, please open the URL that appears in the logs to authenticate."
( sleep 5 && /usr/bin/tailscale up --hostname="vnc-docker-container" --advertise-tags="tag:vnc-container" --accept-routes --accept-dns --advertise-exit-node --netfilter-mode=off --ssh ) &
echo "tailscale up initiated in background"

# Start VNC server if requested
if [ "${START_VNC_SERVER}" = "true" ]; then
  echo "Starting VNC server in background..."
  # Start fluxbox window manager
  ( sleep 8 && sudo -u devuser sh -c "export DISPLAY=:1 && fluxbox" ) &
  ( sleep 10 && sudo -u devuser vncserver :1 -localhost no ) &
  echo "VNC server initiated in background"
else
  echo "VNC server will not be started. To start it, set START_VNC_SERVER=true"
fi

# Keep the container alive and wait for background processes
exec sleep infinity