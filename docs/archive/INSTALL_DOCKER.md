# Docker Installation Guide for Ubuntu/Debian

Quick guide to install Docker and Docker Compose on your server.

## Install Docker

```bash
# Update package index
sudo apt update

# Install prerequisites
sudo apt install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
sudo docker --version
sudo docker compose version
```

## Add your user to docker group (optional, to avoid sudo)

```bash
# Add user to docker group
sudo usermod -aG docker kjell

# Log out and back in for changes to take effect
# Or run:
newgrp docker

# Test without sudo
docker --version
```

## Start Docker service

```bash
# Enable Docker to start on boot
sudo systemctl enable docker

# Start Docker
sudo systemctl start docker

# Check status
sudo systemctl status docker
```

## Test Docker installation

```bash
# Run hello-world container
sudo docker run hello-world

# If successful, you'll see a welcome message
```

## After installation, continue with deployment

Return to `DEPLOYMENT.md` and continue from step 3 (Build and Start Container).
