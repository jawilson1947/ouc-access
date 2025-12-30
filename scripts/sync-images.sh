#!/bin/bash

# Image synchronization script for OUC Access Control System
# This script syncs images from local development to production

echo "🔄 Syncing images to production server..."

# Configuration
LOCAL_IMAGES_DIR="/Users/jimwilson/oucaccess/public/images"
REMOTE_HOST="jawilson@192.168.72.250"
REMOTE_IMAGES_DIR="/home/jawilson/fullstack-app/public/images"

echo "📁 Local images directory: $LOCAL_IMAGES_DIR"
echo "🌐 Remote host: $REMOTE_HOST"
echo "📁 Remote images directory: $REMOTE_IMAGES_DIR"

# Check if local images directory exists
if [ ! -d "$LOCAL_IMAGES_DIR" ]; then
    echo "❌ Local images directory not found: $LOCAL_IMAGES_DIR"
    exit 1
fi

# List local images
echo "📸 Local images found:"
ls -la "$LOCAL_IMAGES_DIR"/*.jpeg 2>/dev/null || echo "   No .jpeg files found"
ls -la "$LOCAL_IMAGES_DIR"/*.jpg 2>/dev/null || echo "   No .jpg files found"
ls -la "$LOCAL_IMAGES_DIR"/*.png 2>/dev/null || echo "   No .png files found"

# Sync images to production
echo "🚀 Syncing images to production..."
rsync -avz --progress "$LOCAL_IMAGES_DIR/" "$REMOTE_HOST:$REMOTE_IMAGES_DIR/"

if [ $? -eq 0 ]; then
    echo "✅ Images synced successfully!"
    
    # Set permissions on remote server
    echo "🔐 Setting permissions on production server..."
    ssh "$REMOTE_HOST" "chmod 644 $REMOTE_IMAGES_DIR/*.jpeg 2>/dev/null || true"
    ssh "$REMOTE_HOST" "chmod 644 $REMOTE_IMAGES_DIR/*.jpg 2>/dev/null || true"
    ssh "$REMOTE_HOST" "chmod 644 $REMOTE_IMAGES_DIR/*.png 2>/dev/null || true"
    ssh "$REMOTE_HOST" "chown jawilson:jawilson $REMOTE_IMAGES_DIR/*.jpeg 2>/dev/null || true"
    ssh "$REMOTE_HOST" "chown jawilson:jawilson $REMOTE_IMAGES_DIR/*.jpg 2>/dev/null || true"
    ssh "$REMOTE_HOST" "chown jawilson:jawilson $REMOTE_IMAGES_DIR/*.png 2>/dev/null || true"
    
    echo "✅ Permissions set successfully!"
    
    # List remote images
    echo "📸 Remote images after sync:"
    ssh "$REMOTE_HOST" "ls -la $REMOTE_IMAGES_DIR/"
    
    echo "🎉 Image synchronization completed!"
    echo "🔗 Test URLs:"
    echo "   - https://access.oucsda.org/images/PhotoID.jpeg"
    echo "   - https://access.oucsda.org/images/WilsonPaula0850.jpeg"
    echo "   - https://access.oucsda.org/images/WilsonJames0350.jpeg"
    echo "   - https://access.oucsda.org/images/WilsonJustin2648.jpeg"
    echo "   - https://access.oucsda.org/images/WilsonShia2648.jpeg"
else
    echo "❌ Failed to sync images to production"
    exit 1
fi 