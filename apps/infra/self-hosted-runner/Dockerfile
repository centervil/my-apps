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

# ==> 2. Add GitHub CLI, Tailscale, and Node.js repositories
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | gpg --dearmor -o /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list \
    && curl -fsSL https://pkgs.tailscale.com/stable/ubuntu/focal.gpg | gpg --dearmor -o /usr/share/keyrings/tailscale-archive-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/tailscale-archive-keyring.gpg] https://pkgs.tailscale.com/stable/ubuntu focal main" > /etc/apt/sources.list.d/tailscale.list \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && add-apt-repository ppa:deadsnakes/ppa \
    && apt-get update

# ==> 3. Install required packages
RUN apt-get install -y --no-install-recommends \
    sudo \
    git \
    build-essential \
    gh \
    tmux \
    jq \
    python3.9 \
    python3.9-dev \
    python3.9-venv \
    python3-pip \
    nodejs \
    tailscale \
    net-tools \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install desktop environment (Fluxbox), VNC and noVNC
RUN apt-get update && apt-get install -y --no-install-recommends \
    tigervnc-standalone-server \
    tigervnc-common \
    fluxbox \
    xvfb \
    dbus-x11 \
    x11-utils \
    x11-xserver-utils \
    xdg-utils \
    xterm \
    novnc \
    websockify \
    openssh-server \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir /var/run/sshd

# Install Playwright system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
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

# ==> 4. Install pnpm globally
RUN npm install -g pnpm

# ==> 5. Install Playwright browsers (Firefox) and dependencies
# Use a specific version to match package.json and ensure correct location outside home.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN mkdir -p $PLAYWRIGHT_BROWSERS_PATH \
    && npx playwright@1.54.1 install firefox --with-deps \
    && chmod -R 777 $PLAYWRIGHT_BROWSERS_PATH

# ==> 6. Create a non-root user
ARG USER_UID=1000
ARG USER_GID=1000
RUN groupadd --gid "${USER_GID}" devuser \
    && useradd --uid "${USER_UID}" --gid "${USER_GID}" -m -s /bin/bash devuser \
    && echo "devuser:devuser" | chpasswd \
    && adduser devuser sudo \
    && echo "devuser ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# ==> 6. Install GitHub Runner Agent
ARG RUNNER_VERSION=2.321.0
RUN mkdir /home/devuser/actions-runner && cd /home/devuser/actions-runner \
    && curl -o actions-runner-linux-arm64-${RUNNER_VERSION}.tar.gz -L https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-arm64-${RUNNER_VERSION}.tar.gz \
    && tar xzf ./actions-runner-linux-arm64-${RUNNER_VERSION}.tar.gz \
    && rm actions-runner-linux-arm64-${RUNNER_VERSION}.tar.gz \
    && ./bin/installdependencies.sh \
    && chown -R devuser:devuser /home/devuser/actions-runner

# ==> 7. Prepare scripts
COPY entrypoint.sh /home/devuser/entrypoint.sh
RUN mkdir -p /home/devuser/.vnc
COPY xstartup /home/devuser/.vnc/xstartup
RUN chmod +x /home/devuser/entrypoint.sh /home/devuser/.vnc/xstartup \
    && chown -R devuser:devuser /home/devuser/entrypoint.sh /home/devuser/.vnc

# Expose VNC, noVNC, and SSH ports
EXPOSE 5901 6080 22

USER devuser
WORKDIR /home/devuser

ENTRYPOINT ["/home/devuser/entrypoint.sh"]
