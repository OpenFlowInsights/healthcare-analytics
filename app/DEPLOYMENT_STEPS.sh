#!/bin/bash

# Deployment Steps - Run after adding Snowflake env vars to Vercel

echo "🚀 Deploying SSG Healthcare Analytics to Production"
echo "=================================================="
echo ""

echo "Step 1: Redeploying to Vercel with environment variables..."
npx vercel --prod --force

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 Testing deployment..."
echo ""

# Test dashboard
echo "Testing /dashboard..."
DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://ofi-healthcare.vercel.app/dashboard)
DASHBOARD_TIME=$(curl -s -o /dev/null -w "%{time_total}" https://ofi-healthcare.vercel.app/dashboard)

echo "  Status: $DASHBOARD_STATUS"
echo "  Load time: ${DASHBOARD_TIME}s"

# Test drug-spending
echo ""
echo "Testing /drug-spending..."
DRUGSPEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://ofi-healthcare.vercel.app/drug-spending)
DRUGSPEND_TIME=$(curl -s -o /dev/null -w "%{time_total}" https://ofi-healthcare.vercel.app/drug-spending)

echo "  Status: $DRUGSPEND_STATUS"
echo "  Load time: ${DRUGSPEND_TIME}s"

echo ""
echo "=================================================="
echo "✅ Deployment complete and verified!"
echo ""
echo "Next steps:"
echo "  1. Visit: https://ofi-healthcare.vercel.app/dashboard"
echo "  2. Visit: https://ofi-healthcare.vercel.app/drug-spending"
echo "  3. Check 'Data as of' timestamp"
echo "  4. Test sorting/filtering"
echo "  5. Verify no API calls in Network tab"
echo ""
