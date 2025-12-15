#!/bin/bash
set -e

# Configuration - UPDATE THIS WITH YOUR DOCKER HUB USERNAME
DOCKERHUB_USER="YOUR_DOCKERHUB_USERNAME"
IMAGE_NAME="imalink-web"
TAG="latest"

echo "🔨 Building Docker image for imalink-web..."
docker build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_API_URL=https://api.trollfjell.com/api/v1 \
  -t $DOCKERHUB_USER/$IMAGE_NAME:$TAG \
  .

echo ""
echo "📤 Pushing to Docker Hub..."
docker push $DOCKERHUB_USER/$IMAGE_NAME:$TAG

echo ""
echo "✅ Image pushed successfully to $DOCKERHUB_USER/$IMAGE_NAME:$TAG"
echo ""
echo "🚀 Next steps on server:"
echo "   ssh kjell@trollfjell.com"
echo "   cd ~/imalink-web"
echo "   sudo docker compose -f docker-compose.prod.yml pull"
echo "   sudo docker compose -f docker-compose.prod.yml up -d"
