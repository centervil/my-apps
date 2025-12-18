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
    gh

RUN apt-get install -y --no-install-recommends \
    python3.9 \
    python3.9-dev \
    python3.9-venv \
    python3-pip

RUN apt-get install -y --no-install-recommends \
    nodejs \
    tailscale

# Install desktop environment separately as it's large
RUN apt-get install -y --no-install-recommends \
    tigervnc-standalone-server \
    xfce4 \
    xfce4-goodies \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ==> 4. Install gemini-cli globally via npm, pnpm and upgrade pip for python3.9
RUN npm install -g @google/gemini-cli pnpm \
    && python3.9 -m pip install --upgrade pip

# ==> 5. Create a non-root user
RUN useradd -m -s /bin/bash devuser && \
    echo "devuser:devuser" | chpasswd && \
    adduser devuser sudo

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
RUN chmod +x /home/devuser/entrypoint.sh /home/devuser/.vnc/xstartup \
    && chown devuser:devuser /home/devuser/entrypoint.sh /home/devuser/.vnc/xstartup

# Set USER to root so entrypoint.sh can run privileged commands
USER root

# Expose VNC port
EXPOSE 5901

# Set entrypoint
ENTRYPOINT ["/home/devuser/entrypoint.sh"]
