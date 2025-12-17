#!/bin/bash
set -e

echo "🚀 Deploying imalink-web..."

# Build and commit locally
echo "📦 Building locally..."
npm run build

echo "💾 Committing changes..."
git add -A
git commit -m "Deploy: $(date +'%Y-%m-%d %H:%M')" || echo "No changes to commit"

echo "⬆️  Pushing to GitHub..."
git push

# Deploy to server
echo "🌐 Deploying to trollfjell.com..."
ssh kjell@trollfjell.com "cd /home/kjell/imalink-web && source ~/.nvm/nvm.sh && nvm use 20 && git pull && npm run build && pm2 restart imalink-web"

echo "✅ Deployment complete!"
