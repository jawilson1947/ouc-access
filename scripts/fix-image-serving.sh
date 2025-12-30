#!/bin/bash

# Fix Image Serving Issues
# This script checks and fixes image serving problems on the production server

echo "🔧 Fixing image serving issues..."

# Configuration
REMOTE_HOST="jawilson@192.168.72.250"
REMOTE_IMAGES_DIR="/home/jawilson/fullstack-app/public/images"
PROBLEMATIC_FILE="MannKimberly4331.jpeg"

echo "📁 Remote images directory: $REMOTE_IMAGES_DIR"
echo "❌ Problematic file: $PROBLEMATIC_FILE"

# Function to run SSH command
run_ssh_command() {
    local command="$1"
    echo "🔧 Running: $command"
    ssh "$REMOTE_HOST" "$command"
    return $?
}

# Check if the problematic file exists
echo "🔍 Checking if file exists..."
if run_ssh_command "ls -la \"$REMOTE_IMAGES_DIR/$PROBLEMATIC_FILE\""; then
    echo "✅ File exists on production server"
else
    echo "❌ File does not exist on production server"
    echo "🔄 Syncing images from development..."
    
    # Sync images from development
    LOCAL_IMAGES_DIR="/Users/jimwilson/oucaccess/public/images"
    echo "📁 Syncing from: $LOCAL_IMAGES_DIR"
    
    if rsync -avz --progress "$LOCAL_IMAGES_DIR/" "$REMOTE_HOST:$REMOTE_IMAGES_DIR/"; then
        echo "✅ Images synced successfully"
    else
        echo "❌ Failed to sync images"
        exit 1
    fi
fi

# Check file permissions and ownership
echo "🔐 Checking file permissions..."
run_ssh_command "stat -c \"%a %U:%G %n\" \"$REMOTE_IMAGES_DIR/$PROBLEMATIC_FILE\""

# Fix permissions if needed
echo "🔧 Fixing file permissions..."
run_ssh_command "chmod 644 \"$REMOTE_IMAGES_DIR/$PROBLEMATIC_FILE\""
run_ssh_command "chown jawilson:jawilson \"$REMOTE_IMAGES_DIR/$PROBLEMATIC_FILE\""

# Check Apache configuration
echo "🌐 Checking Apache configuration..."
run_ssh_command "sudo apachectl -t"
run_ssh_command "sudo systemctl status httpd"

# Test file accessibility
echo "🧪 Testing file accessibility..."
run_ssh_command "curl -I \"https://access.oucsda.org/images/$PROBLEMATIC_FILE\""

# List all files in images directory for comparison
echo "📁 Listing all files in images directory..."
run_ssh_command "ls -la \"$REMOTE_IMAGES_DIR/\" | head -20"

# Check for case sensitivity issues
echo "🔍 Checking for case sensitivity issues..."
run_ssh_command "find \"$REMOTE_IMAGES_DIR\" -iname \"*mannkimberly*\" -o -iname \"*4331*\""

# Check file system space
echo "💾 Checking file system space..."
run_ssh_command "df -h \"$REMOTE_IMAGES_DIR\""

echo "✅ Image serving fix completed!"
echo "🔗 Test URL: https://access.oucsda.org/images/$PROBLEMATIC_FILE" 