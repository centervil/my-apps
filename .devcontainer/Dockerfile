# Base Image
FROM ubuntu:20.04

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# ==> 1. Install prerequisites for adding external repositories
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    software-properties-common \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ==> 2. Add Tailscale, GitHub CLI, and Node.js repositories
RUN curl -fsSL https://pkgs.tailscale.com/stable/ubuntu/focal.gpg | gpg --dearmor -o /usr/share/keyrings/tailscale-archive-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/tailscale-archive-keyring.gpg] https://pkgs.tailscale.com/stable/ubuntu focal main" > /etc/apt/sources.list.d/tailscale.list \
    && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | gpg --dearmor -o /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && add-apt-repository ppa:deadsnakes/ppa \
    && apt-get update

# ==> 3. Install all required packages in separate layers to avoid timeout
RUN apt-get install -y --no-install-recommends \
    sudo \
    git \
    git-secret \
    build-essential \
    gh \
    tmux \
    jq \
    nano

RUN apt-get install -y --no-install-recommends \
    python3.9 \
    python3.9-dev \
    python3.9-venv \
    python3-pip

RUN apt-get install -y --no-install-recommends \
    nodejs \
    tailscale

# Install desktop environment (Fluxbox) and VNC
RUN apt-get install -y --no-install-recommends \
    tigervnc-standalone-server \
    tigervnc-common \
    fluxbox \
    xvfb \
    dbus-x11 \
    x11-utils \
    x11-xserver-utils \
    xdg-utils \
    xterm \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Playwright system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgstreamer-gl1.0-0 \
    libgstreamer-plugins-bad1.0-0 \
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good \
    gstreamer1.0-plugins-bad \
    gstreamer1.0-plugins-ugly \
    gstreamer1.0-libav \
    gstreamer1.0-doc \
    gstreamer1.0-tools \
    gstreamer1.0-x \
    gstreamer1.0-alsa \
    gstreamer1.0-gl \
    gstreamer1.0-gtk3 \
    gstreamer1.0-qt5 \
    gstreamer1.0-pulseaudio \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    libxslt1.1 \
    libwoff1 \
    libwebpdemux2 \
    libharfbuzz-icu0 \
    libenchant-2-2 \
    libsecret-1-0 \
    libhyphen0 \
    libgles2 \
    fonts-liberation \
    fonts-noto-color-emoji \
    fonts-ubuntu \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ==> 4. Install gemini-cli globally via npm, pnpm and upgrade pip for python3.9
RUN npm install -g @google/gemini-cli pnpm \
    && python3.9 -m pip install --upgrade pip

# ==> 5. Create a non-root user
ARG USER_UID=1000
ARG USER_GID=1000
RUN if [ "$USER_UID" -eq 0 ]; then \
        echo "Host user UID is 0. Creating a standard 'devuser' for compatibility, but workspace files will be owned by root."; \
        useradd -m -s /bin/bash devuser; \
        echo "devuser:devuser" | chpasswd; \
        adduser devuser sudo; \
    else \
        echo "Creating user 'devuser' with UID=${USER_UID} and GID=${USER_GID}"; \
        if ! getent group "${USER_GID}" >/dev/null; then \
            groupadd --gid "${USER_GID}" devuser; \
        else \
            echo "Group with GID ${USER_GID} already exists. Using existing group."; \
        fi; \
        useradd --uid "${USER_UID}" --gid "${USER_GID}" -m -s /bin/bash devuser; \
        echo "devuser:devuser" | chpasswd; \
        adduser devuser sudo; \
    fi

# ==> 6. Install Poetry for devuser
USER devuser
RUN curl -sSL https://install.python-poetry.org | python3.9 -
ENV PATH="/home/devuser/.local/bin:${PATH}"
USER root

# ==> 7. Install git-secrets from source
RUN git clone https://github.com/awslabs/git-secrets.git /tmp/git-secrets \
    && cd /tmp/git-secrets \
    && make install \
    && cd / \
    && rm -rf /tmp/git-secrets

# ==> 8. Copy and prepare entrypoint and VNC startup scripts
COPY .devcontainer/entrypoint.sh /home/devuser/entrypoint.sh
COPY .devcontainer/xstartup /home/devuser/.vnc/xstartup
COPY .devcontainer/.tmux.conf /home/devuser/.tmux.conf
RUN chmod +x /home/devuser/entrypoint.sh /home/devuser/.vnc/xstartup \
    && chown devuser:devuser /home/devuser/entrypoint.sh /home/devuser/.vnc/xstartup /home/devuser/.tmux.conf

# Set USER to root so entrypoint.sh can run privileged commands
USER root

# Set VNC password environment variable
ENV VNC_PASSWORD=password

# Expose VNC port
EXPOSE 5901

# Set entrypoint
ENTRYPOINT ["/home/devuser/entrypoint.sh"]
