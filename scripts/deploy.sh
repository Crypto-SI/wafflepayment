#!/bin/bash

# Waffle Payments Production Deployment Script
set -e

echo "🧇 Starting Waffle Payments Production Deployment..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please create .env.local with your production environment variables."
    echo "You can use .env.production.example as a template."
    exit 1
fi

# Validate required environment variables
echo "🔍 Validating environment variables..."
source .env.local

REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "STRIPE_SECRET_KEY"
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    "STRIPE_WEBHOOK_SECRET"
    "NEXTAUTH_URL"
    "NEXTAUTH_SECRET"
    "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set!"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Clean up previous builds
echo "🧹 Cleaning up previous builds..."
docker-compose down || true
docker system prune -f || true

# Build and start production containers
echo "🏗️ Building production images..."
docker-compose build --no-cache

echo "🚀 Starting production services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Production deployment successful!"
    echo "🌐 Application is running at: http://localhost:3000"
    echo "📊 Database is available at: localhost:5432"
    echo "🔧 Redis is available at: localhost:6379"
    echo ""
    echo "To view logs: docker-compose logs -f app"
    echo "To stop: docker-compose down"
else
    echo "❌ Deployment failed! Check logs:"
    docker-compose logs
    exit 1
fi 