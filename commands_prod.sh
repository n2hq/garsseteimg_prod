#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e


echo "🔁 Setting remote to PROD repo..."
#git remote add origin https://github.com/n2hq/garsseteimg_prod.git

echo "🌿  Renaming branch to main..."
git branch -M main

git remote set-url origin https://github.com/n2hq/garsseteimg_prod.git


echo "🧪 Switching to 'main' branch..."
git checkout main || git checkout -b main


echo "🔄 Pulling latest changes..."
#git pull origin main


echo "🛠  Building PROD..."
#npm run build:prod


echo "📦  Staging changes..."
git add .


echo "✅  Committing changes..."
git commit -m "Prod: update commit" || echo "⚠️ No changes to commit."

echo "🌿  Renaming branch to main..."
git branch -M main

echo "🚀  Pushing to origin/main..."
git push -u origin main

echo "🎉  Done!"


