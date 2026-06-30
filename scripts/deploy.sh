#!/bin/bash

# DigitalOcean Deployment Script for DataChart App
# Server IP: 206.189.178.211

SERVER_IP="206.189.178.211"
APP_NAME="datachart"
PROJECT_DIR="/home/mookyjooky/Dropbox/GITHUB/SAAS-datachart"

echo "🚀 Starting deployment to DigitalOcean..."

# Step 1: Create tarball of the project
echo "📦 Creating deployment package..."
cd $PROJECT_DIR
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='frontend/node_modules' \
    --exclude='backend/__pycache__' \
    --exclude='.env' \
    -czf /tmp/${APP_NAME}-deploy.tar.gz .

# Step 2: Copy files to server
echo "📤 Uploading to server..."
scp /tmp/${APP_NAME}-deploy.tar.gz root@${SERVER_IP}:/tmp/

# Step 3: Deploy on server
echo "🔧 Deploying application..."
ssh root@${SERVER_IP} << 'ENDSSH'
# Create app directory
mkdir -p /opt/datachart
cd /opt/datachart

# Extract files
tar -xzf /tmp/datachart-deploy.tar.gz

# Create environment file
cat > .env << 'EOF'
APP_ENV=production
REDIS_URL=redis://localhost:6379/0
DATABASE_URL=sqlite:///./app.db
SECRET_KEY=$(openssl rand -hex 32)
EOF

# Build and run with Docker Compose
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check status
sleep 5
docker-compose ps

# Setup firewall
ufw allow 80
ufw allow 443
ufw allow 22
ufw --force enable

echo "✅ Deployment complete!"
ENDSSH

# Step 4: Cleanup
rm /tmp/${APP_NAME}-deploy.tar.gz

echo "🎉 Deployment successful!"
echo "🌐 Application is available at: http://${SERVER_IP}"
echo "📊 DigitalOcean Project: datachart"