#!/bin/bash

# Deployment script for Excalidraw app
set -e

echo "🚀 Starting deployment process..."

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is required"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET environment variable is required"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
cd packages/db && pnpm prisma generate && cd ../..

# Run database migrations
echo "🗄️ Running database migrations..."
cd packages/db && pnpm prisma migrate deploy && cd ../..

# Build all applications
echo "🔨 Building applications..."
pnpm turbo build

echo "✅ Deployment completed successfully!"
echo "🌐 Services available at:"
echo "  - Frontend: http://localhost:3000"
echo "  - HTTP API: http://localhost:5050"
echo "  - WebSocket: ws://localhost:8081"
echo "  - Health checks:"
echo "    - Frontend: http://localhost:3000/api/health"
echo "    - HTTP API: http://localhost:5050/health"
echo "    - WebSocket: http://localhost:8081/health"
