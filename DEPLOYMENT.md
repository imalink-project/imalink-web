# ImaLink Web Deployment Guide

Production deployment using PM2 process manager (no Docker needed).

## Quick Deploy (For Updates)

```bash
# On local machine:
git add -A && git commit -m "Your changes" && git push

# On server (one command):
ssh kjell@trollfjell.com "cd ~/imalink-web && git pull && npm run build && pm2 restart imalink-web"
```

## Prerequisites on Server

- Node.js 20.x
- npm
- nginx (already installed)
- Git

## Install Node.js (if not installed)

```bash
# On server (kjell@trollfjell):
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version
npm --version
```

## Initial Deployment

```bash
# SSH to server
ssh kjell@trollfjell.com

# Clone repo (if not already done)
cd ~
git clone https://github.com/kjelkols/imalink-web.git
cd imalink-web

# Install dependencies
npm ci

# Build for production
npm run build

# Start the server (foreground for testing)
npm run start
```

The app will run on http://localhost:3000

## Run as Background Service with PM2

PM2 keeps the app running and auto-restarts on crashes.

```bash
# Install PM2 globally
npm install -g pm2

# Start the app with PM2
pm2 start npm --name "imalink-web" -- start

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs (will use sudo)

# Check status
pm2 status

# View logs
pm2 logs imalink-web

# Monitor
pm2 monit
```

## Nginx Configuration

Same as before - the nginx.conf already points to localhost:3000.

```bash
# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/imalink.trollfjell.com

# Enable site
sudo ln -s /etc/nginx/sites-available/imalink.trollfjell.com /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Setup SSL
sudo certbot --nginx -d imalink.trollfjell.com

# Restart nginx
sudo systemctl restart nginx
```

## Update/Redeploy

When you make changes:

```bash
# On local machine:
git add .
git commit -m "Your changes"
git push

# On server:
cd ~/imalink-web
git pull
npm ci                    # Only if dependencies changed
npm run build
pm2 restart imalink-web
```

## PM2 Useful Commands

```bash
# Restart app
pm2 restart imalink-web

# Stop app
pm2 stop imalink-web

# Delete app from PM2
pm2 delete imalink-web

# View logs (live)
pm2 logs imalink-web --lines 100

# Monitor CPU/memory
pm2 monit

# List all apps
pm2 list
```

## Environment Variables

If you need different API URL or other env vars:

```bash
# Create .env.production.local on server
cd ~/imalink-web
cat > .env.production.local << 'EOF'
NEXT_PUBLIC_API_URL=https://api.trollfjell.com/api/v1
EOF

# Restart
pm2 restart imalink-web
```

## Troubleshooting

### Port 3000 already in use
```bash
# Find what's using it
sudo lsof -i :3000

# Kill it
pm2 delete imalink-web
# or
sudo kill -9 <PID>
```

### App not starting
```bash
# Check logs
pm2 logs imalink-web --err

# Try running manually to see errors
cd ~/imalink-web
npm run start
```

### Build fails (memory)
```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=1536"
npm run build
```

## Benefits of this approach

✅ Fast iterations - just git pull, build, restart
✅ No Docker build time
✅ Easy to debug - direct access to logs
✅ Works well with 1GB RAM
✅ Can switch to Docker later when stable
