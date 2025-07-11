#!/bin/bash

# Test Docker Build Script
set -e

echo "🧇 Testing Waffle Payments Docker Build..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  Warning: .env.local file not found!"
    echo "Creating minimal .env.local for testing..."
    cat > .env.local << EOF
# Minimal configuration for testing
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
SUPABASE_SERVICE_ROLE_KEY=test-service-role-key
STRIPE_SECRET_KEY=sk_test_dummy
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_dummy
STRIPE_WEBHOOK_SECRET=whsec_dummy
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=test-secret-key-for-development
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=test-project-id
DB_PASSWORD=testpassword
EOF
fi

# Test production build
echo "🔧 Testing production build..."
docker build -f Dockerfile -t wafflepayment:test .

echo "✅ Production build successful!"

# Test development build
echo "🔧 Testing development build..."
docker build -f Dockerfile.dev -t wafflepayment:dev .

echo "✅ Development build successful!"

# Test running the production container
echo "🚀 Testing production container..."
docker run -d --name wafflepayment-test -p 3001:3000 --env-file .env.local wafflepayment:test

# Wait for container to start
sleep 5

# Check if container is running
if docker ps | grep -q "wafflepayment-test"; then
    echo "✅ Production container is running!"
    echo "🌐 Test at: http://localhost:3001"
    echo "🛑 Stopping test container..."
    docker stop wafflepayment-test
    docker rm wafflepayment-test
else
    echo "❌ Production container failed to start!"
    docker logs wafflepayment-test
    docker rm wafflepayment-test
    exit 1
fi

echo "🎉 Docker build tests completed successfully!"
echo "Your app is ready for production deployment!" 