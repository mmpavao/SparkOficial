#!/bin/bash

# Production build script for Spark Comex
echo "🚀 Starting production build..."

# Step 1: Clean dist directory
echo "🧹 Cleaning dist directory..."
rm -rf dist/

# Step 2: Build frontend
echo "📦 Building frontend..."
vite build

# Step 3: Build backend
echo "🔧 Building backend..."
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Step 4: Copy template files
echo "📄 Copying template files..."
mkdir -p dist/templates
cp -r server/templates/* dist/templates/

# Step 5: Copy other necessary files
echo "📁 Copying additional files..."
cp -r server/templates templates/ 2>/dev/null || true

# Step 6: Verify build
echo "✅ Build verification..."
if [ -f "dist/index.js" ]; then
    echo "✅ Backend build successful"
else
    echo "❌ Backend build failed"
    exit 1
fi

if [ -f "dist/templates/dossie-template.html" ]; then
    echo "✅ Template files copied successfully"
else
    echo "❌ Template files missing"
    exit 1
fi

echo "🎉 Production build completed successfully!"
echo "💡 Run 'NODE_ENV=production node dist/index.js' to start the production server"