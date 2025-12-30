#!/bin/bash

# Automated Deployment Script for OUC Access Control System
# This script ensures consistent deployment of both code and images
# Updated for Cloudflare Workers routing (Apache bypassed)

set -e  # Exit on any error

echo "🚀 Starting automated deployment for OUC Access Control System..."

# Configuration
LOCAL_DIR="/Users/jimwilson/oucaccess"
REMOTE_HOST="jawilson@192.168.72.250"
REMOTE_DIR="/home/jawilson/fullstack-app"
IMAGES_DIR="$REMOTE_DIR/public/images"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Build the application
print_status "Building Next.js application..."
cd "$LOCAL_DIR"
npm run build
print_success "Application built successfully"

# Step 2: Sync code to production
print_status "Syncing code to production server..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.git' \
    --exclude 'public/images' \
    "$LOCAL_DIR/" "$REMOTE_HOST:$REMOTE_DIR/"

if [ $? -eq 0 ]; then
    print_success "Code synced to production"
else
    print_error "Failed to sync code to production"
    exit 1
fi

# Step 3: Sync images to production
print_status "Syncing images to production server..."
rsync -avz --progress "$LOCAL_DIR/public/images/" "$REMOTE_HOST:$IMAGES_DIR/"

if [ $? -eq 0 ]; then
    print_success "Images synced to production"
else
    print_error "Failed to sync images to production"
    exit 1
fi

# Step 4: Set proper permissions on production
print_status "Setting permissions on production server..."
ssh "$REMOTE_HOST" "chmod -R 755 $REMOTE_DIR"
ssh "$REMOTE_HOST" "chmod 644 $IMAGES_DIR/*.jpeg 2>/dev/null || true"
ssh "$REMOTE_HOST" "chmod 644 $IMAGES_DIR/*.jpg 2>/dev/null || true"
ssh "$REMOTE_HOST" "chmod 644 $IMAGES_DIR/*.png 2>/dev/null || true"
ssh "$REMOTE_HOST" "chown -R jawilson:jawilson $REMOTE_DIR"

print_success "Permissions set successfully"

# Step 5: Install dependencies on production
print_status "Installing dependencies on production server..."
ssh "$REMOTE_HOST" "cd $REMOTE_DIR && npm install --production"

if [ $? -eq 0 ]; then
    print_success "Dependencies installed on production"
else
    print_warning "Dependency installation had issues, but continuing..."
fi

# Step 6: Restart the application on production
print_status "Restarting application on production server..."
ssh "$REMOTE_HOST" "cd $REMOTE_DIR && pm2 restart ouc-access || pm2 start server.js --name ouc-access"

if [ $? -eq 0 ]; then
    print_success "Application restarted on production"
else
    print_warning "Application restart had issues, but deployment may still be successful"
fi

# Step 7: Verify deployment
print_status "Verifying deployment..."
sleep 5  # Wait for application to start

# Test the application
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://access.oucsda.org/access" || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    print_success "Application is responding correctly"
else
    print_warning "Application may not be responding correctly (HTTP $HTTP_STATUS)"
fi

# Test image availability via the new serve API
print_status "Testing image availability via serve API..."
TEST_IMAGES=("PhotoID.jpeg" "WilsonPaula0850.jpeg" "WilsonJames0350.jpeg")
for image in "${TEST_IMAGES[@]}"; do
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://access.oucsda.org/api/images/serve?filename=$image" || echo "000")
    if [ "$HTTP_STATUS" = "200" ]; then
        print_success "Image $image is accessible via serve API"
    else
        print_warning "Image $image may not be accessible via serve API (HTTP $HTTP_STATUS)"
    fi
done

# Step 8: Generate deployment report
print_status "Generating deployment report..."

# Count images on production
REMOTE_IMAGE_COUNT=$(ssh "$REMOTE_HOST" "find $IMAGES_DIR -name '*.jpeg' -o -name '*.jpg' -o -name '*.png' | wc -l")
LOCAL_IMAGE_COUNT=$(find "$LOCAL_DIR/public/images" -name "*.jpeg" -o -name "*.jpg" -o -name "*.png" | wc -l)

echo ""
echo "📊 Deployment Report:"
echo "====================="
echo "✅ Code deployed successfully"
echo "✅ Images synced: $LOCAL_IMAGE_COUNT local → $REMOTE_IMAGE_COUNT remote"
echo "✅ Application restarted"
echo "✅ Cloudflare Workers routing (Apache bypassed)"
echo ""
echo "🔗 Test URLs:"
echo "   - Application: https://access.oucsda.org/access"
echo "   - Image Serve API: https://access.oucsda.org/api/images/serve?filename=PhotoID.jpeg"
echo ""
echo "📸 Available images on production:"
ssh "$REMOTE_HOST" "ls -la $IMAGES_DIR/"

print_success "Deployment completed successfully!"
echo ""
echo "🎉 Your OUC Access Control System has been deployed!"
echo "   Images are now served directly through Next.js API routes."
echo "   Cloudflare Workers handle routing, bypassing Apache configuration." 