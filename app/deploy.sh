#!/bin/bash
# ACO Dashboard - Local Build + Prebuilt Deploy
# This script follows the SSG pattern: build locally, deploy prebuilt to Vercel

set -e  # Exit on error

echo "===== ACO Dashboard Deployment ====="
echo ""

# Check for required files
if [ ! -f "rsa_key.p8" ]; then
    echo "❌ ERROR: rsa_key.p8 not found"
    echo "Please ensure the Snowflake private key file exists in the project root"
    exit 1
fi

echo "Step 1: Building locally (queries Snowflake)..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "Step 2: Packaging for Vercel..."
npx vercel build --prod

if [ $? -ne 0 ]; then
    echo "❌ Vercel build failed"
    exit 1
fi

echo ""
echo "Step 3: Deploying prebuilt static files to Vercel CDN..."
npx vercel deploy --prebuilt --prod

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Dashboard is now live on Vercel CDN"
echo "Data was fetched from Snowflake at build time: $(date)"
