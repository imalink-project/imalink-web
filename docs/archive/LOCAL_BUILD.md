# Local Build Deployment Strategy

For servers with limited RAM (< 2GB), build the Docker image locally and push to Docker Hub.

## Prerequisites

- Docker installed locally
- Docker Hub account (free): https://hub.docker.com/signup

## Setup (One-time)

### 1. Create Docker Hub Repository

1. Go to https://hub.docker.com
2. Click "Create Repository"
3. Name: `imalink-web`
4. Visibility: Public (or Private if you have a paid plan)
5. Click "Create"

### 2. Login to Docker Hub locally

```bash
# On your local machine
docker login
# Enter your Docker Hub username and password
```

## Build and Push (Every deployment)

### On your local machine:

```bash
cd /home/kjell/git_prosjekt/imalink-web

# Pull latest changes
git pull

# Build the image
docker build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_API_URL=https://api.trollfjell.com/api/v1 \
  -t YOUR_DOCKERHUB_USERNAME/imalink-web:latest \
  .

# Push to Docker Hub
docker push YOUR_DOCKERHUB_USERNAME/imalink-web:latest
```

Replace `YOUR_DOCKERHUB_USERNAME` with your actual Docker Hub username.

### On the server (kjell@trollfjell):

```bash
cd ~/imalink-web

# Create a simple docker-compose.prod.yml
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  imalink-web:
    image: YOUR_DOCKERHUB_USERNAME/imalink-web:latest
    container_name: imalink-web
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      - NODE_ENV=production
EOF

# Pull the pre-built image
sudo docker compose -f docker-compose.prod.yml pull

# Start the container
sudo docker compose -f docker-compose.prod.yml up -d

# Check logs
sudo docker compose -f docker-compose.prod.yml logs -f
```

## Quick Update Script (Local)

Save this as `deploy.sh` in your project:

```bash
#!/bin/bash
set -e

DOCKERHUB_USER="YOUR_DOCKERHUB_USERNAME"
IMAGE_NAME="imalink-web"
TAG="latest"

echo "🔨 Building Docker image..."
docker build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_API_URL=https://api.trollfjell.com/api/v1 \
  -t $DOCKERHUB_USER/$IMAGE_NAME:$TAG \
  .

echo "📤 Pushing to Docker Hub..."
docker push $DOCKERHUB_USER/$IMAGE_NAME:$TAG

echo "✅ Image pushed successfully!"
echo "🚀 Now run on server: cd ~/imalink-web && sudo docker compose -f docker-compose.prod.yml pull && sudo docker compose -f docker-compose.prod.yml up -d"
```

Make it executable:
```bash
chmod +x deploy.sh
```

## Workflow

1. **Make changes** to your code
2. **Commit and push** to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```
3. **Build and push** Docker image:
   ```bash
   ./deploy.sh
   ```
4. **Deploy on server**:
   ```bash
   ssh kjell@trollfjell.com
   cd ~/imalink-web
   sudo docker compose -f docker-compose.prod.yml pull
   sudo docker compose -f docker-compose.prod.yml up -d
   ```

## Alternative: GitHub Actions (Advanced)

You can automate this with GitHub Actions to build and push on every commit. Let me know if you want me to set that up!
