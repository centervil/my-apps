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

# Start tailscaled in the background
echo "Starting tailscaled in background..."
/usr/sbin/tailscaled --state=/var/lib/tailscale/tailscaled.state --socket=/var/run/tailscale/tailscaled.sock &
echo "tailscaled started (PID: $!)"

# Connect to tailnet
echo "Bringing Tailscale up..."
echo "If you are running this for the first time, please open the URL that appears in the logs to authenticate."
( sleep 5 && /usr/bin/tailscale up --hostname="vnc-docker-container" --advertise-tags="tag:vnc-container" --accept-routes --accept-dns --advertise-exit-node --netfilter-mode=off --ssh ) &
echo "tailscale up initiated in background"

# Change ownership of .vnc directory for devuser
echo "Setting .vnc ownership..."
mkdir -p /home/devuser/.vnc
chown -R devuser:devuser /home/devuser/.vnc
echo "Ownership set."

# Fix permissions for GitHub CLI config
echo "Fixing GitHub CLI config permissions..."
mkdir -p /home/devuser/.config/gh
chown -R devuser:devuser /home/devuser/.config/gh
echo "GitHub CLI config permissions fixed."

# Fix workspace permissions
echo "Fixing workspace permissions..."
chown -R devuser:devuser /home/devuser/workspace || echo "Warning: chown failed for some files (likely read-only mounts)"
chown -R devuser:devuser /home/devuser/.local /home/devuser/.cache || true
echo "Workspace permissions fixed."

# Clean up stale VNC locks (Force remove all X locks)
echo "Cleaning up VNC locks..."
rm -rf /tmp/.X1-lock /tmp/.X11-unix /tmp/.X* || true
mkdir -p /tmp/.X11-unix
chown root:root /tmp/.X11-unix
chmod 1777 /tmp/.X11-unix

# Setup GitHub CLI and Git user info synchronously
echo "Configuring Git credentials and user info..."
sudo -u devuser /bin/bash -c "
    # Ensure .gitconfig exists
    touch /home/devuser/.gitconfig

    # Setup GitHub CLI as git credential helper
    gh auth setup-git

    # Set default git user info if not already set
    if ! git config --global user.name > /dev/null; then
        git config --global user.name \"devuser\"
    fi
    if ! git config --global user.email > /dev/null; then
        git config --global user.email \"devuser@example.com\"
    fi
"
echo "Git configuration complete."

# Set up the development environment for devuser in background
echo "Starting Node.js environment setup in background..."
sudo -u devuser /bin/bash -c "
    export DEBIAN_FRONTEND=noninteractive
    # Add node_modules/.bin to PATH in .bashrc if it's not already there
    if ! grep -q 'node_modules/.bin' /home/devuser/.bashrc; then
        echo 'export PATH=\"\$PATH:/home/devuser/workspace/node_modules/.bin\"' >> /home/devuser/.bashrc
    fi

    # Navigate to workspace and install dependencies and Playwright browsers
    cd /home/devuser/workspace
    pnpm install || echo 'Warning: pnpm install failed'
    pnpm exec playwright install --with-deps || echo 'Warning: playwright install failed'
" &
echo "Node.js environment setup initiated."

# Prepare xstartup
cp /home/devuser/workspace/.devcontainer/xstartup /home/devuser/.vnc/xstartup
chmod +x /home/devuser/.vnc/xstartup
chown devuser:devuser /home/devuser/.vnc/xstartup

# Set VNC password
echo "Setting VNC password..."
sudo -u devuser /bin/bash -c "
    mkdir -p /home/devuser/.vnc
    echo \"\${VNC_PASSWORD:-password}\" | vncpasswd -f > /home/devuser/.vnc/passwd
    chmod 600 /home/devuser/.vnc/passwd
"
echo "VNC password set."

# Start VNC server if requested
if [ "${START_VNC_SERVER}" = "true" ]; then
  echo "Starting VNC server in background..."
  sudo -u devuser vncserver :1 -localhost no -geometry 1280x800 -depth 24
  echo "VNC server initiated in background"
else
  echo "VNC server will not be started. To start it, set START_VNC_SERVER=true"
fi

# Keep the container alive and wait for background processes
exec sleep infinity