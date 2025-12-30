#!/bin/bash

# Deployment script for OUC Access Control System
# This script ensures proper setup for image serving

echo "🚀 Deploying OUC Access Control System..."

# Set the application directory
# Use provided APP_DIR or default to current directory if not set
APP_DIR="${APP_DIR:-$(pwd)}"
# Checks if we are in the root of the project or need to adjust
if [ ! -d "$APP_DIR/public" ]; then
    echo "⚠️  Could not find public directory in $APP_DIR"
    echo "   Assuming script is run from project root..."
    APP_DIR="."
fi

# Allow overriding images directory via env var
IMAGES_DIR="${UPLOAD_DIR:-$APP_DIR/public/images}"

echo "📁 Setting up images directory..."

# Create images directory if it doesn't exist
if [ ! -d "$IMAGES_DIR" ]; then
    echo "   Creating images directory: $IMAGES_DIR"
    mkdir -p "$IMAGES_DIR"
fi

# Set proper permissions for Apache to read images
echo "🔐 Setting permissions for images directory..."
chmod 755 "$IMAGES_DIR"
chmod 644 "$IMAGES_DIR"/*.jpeg 2>/dev/null || true
chmod 644 "$IMAGES_DIR"/*.jpg 2>/dev/null || true
chmod 644 "$IMAGES_DIR"/*.png 2>/dev/null || true

# Ensure Apache can access the directory
echo "👥 Setting ownership for Apache access..."
chown -R jawilson:jawilson "$IMAGES_DIR"

echo "✅ Images directory setup complete!"
echo "📋 Directory: $IMAGES_DIR"
echo "📋 Permissions: $(ls -la $IMAGES_DIR)"

# Test if Apache can read the images
echo "🧪 Testing Apache access to images..."
if [ -d "$IMAGES_DIR" ] && [ -r "$IMAGES_DIR" ]; then
    echo "   ✅ Apache can read images directory"
    
    # Test a specific image file
    TEST_IMAGE=$(find "$IMAGES_DIR" -name "*.jpeg" -o -name "*.jpg" -o -name "*.png" | head -1)
    if [ -n "$TEST_IMAGE" ] && [ -r "$TEST_IMAGE" ]; then
        echo "   ✅ Apache can read image files"
        echo "   📸 Test image: $(basename "$TEST_IMAGE")"
    else
        echo "   ⚠️  No readable image files found"
    fi
else
    echo "   ❌ Apache cannot read images directory"
fi

echo "🎉 Deployment script completed!" 