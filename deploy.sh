#!/bin/bash

# Woodpecker CI Deployment Script for Receipts
set -e

echo "🚀 Deploying Receipts App..."

# Navigate to project directory
cd /workspace/receipts || cd .

# Set environment variables
export DOMAIN=${DOMAIN:-sparktobloom.com}
export ENVIRONMENT=production

# Pull latest images
echo "📦 Pulling latest images..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull

# Deploy with zero-downtime
echo "🔄 Deploying services..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans

# Health check
echo "🏥 Performing health check..."
sleep 10

# Check if container is running
if docker ps | grep -q "receipts-app"; then
    echo "✅ Receipts App deployed successfully!"
else
    echo "❌ Deployment failed!"
    exit 1
fi

# Cleanup old images
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "🎉 Deployment completed successfully!"
