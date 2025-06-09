#!/bin/bash

echo "Adding all changes to staging..."
git add .

echo "Committing changes..."
read -p "Enter commit message (or press Enter for default): " message
if [ -z "$message" ]; then
    message="Update project build"
fi

git commit -m "$message"

echo "Pushing to GitHub..."
git push origin main

echo "Done!" 