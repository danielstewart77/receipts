#!/bin/bash

echo "🧹 Cleaning up duplicate containers..."

# Stop and remove old containers
echo "Stopping old containers..."
docker stop receipts-backend receipts-frontend receipts deploy-backend deploy-frontend deploy-receipts 2>/dev/null || true

echo "Removing old containers..."
docker rm receipts-backend receipts-frontend receipts deploy-backend deploy-frontend deploy-receipts 2>/dev/null || true

# Remove old images
echo "Removing old images..."
docker rmi deploy-backend deploy-frontend deploy-receipts 2>/dev/null || true

# Stop current compose services
echo "Stopping current docker-compose services..."
docker compose down 2>/dev/null || true

echo "✅ Cleanup complete!"
echo ""
echo "Now you can run: docker compose up -d --build"
echo "This will create only these containers:"
echo "  - receipts-api (FastAPI backend on port 8001)"
echo "  - receipts (Angular frontend on port 4400)"
