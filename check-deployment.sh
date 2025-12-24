#!/bin/bash

echo "=== Checking Deployment Status ==="
echo ""

echo "1. Checking running containers..."
docker-compose -f docker-compose.prod.yml ps
echo ""

echo "2. Checking backend logs (last 20 lines)..."
docker-compose -f docker-compose.prod.yml logs --tail=20 backend
echo ""

echo "3. Checking frontend logs (last 20 lines)..."
docker-compose -f docker-compose.prod.yml logs --tail=20 frontend
echo ""

echo "4. Checking postgres logs (last 20 lines)..."
docker-compose -f docker-compose.prod.yml logs --tail=20 postgres
echo ""

echo "5. Testing backend API..."
curl -s http://localhost:5000/api/products | head -c 200
echo ""
echo ""

echo "6. Testing database connection from backend container..."
docker exec inventory_backend_prod node -e "
const { sequelize } = require('./server/models');
sequelize.authenticate()
  .then(() => console.log('✓ Database connection: OK'))
  .catch(err => console.error('✗ Database connection: FAILED -', err.message))
  .finally(() => process.exit());
" 2>&1
echo ""

echo "7. Checking environment variables in frontend container..."
docker exec inventory_frontend_prod printenv | grep REACT_APP || echo "No REACT_APP vars found (they're embedded at build time)"
echo ""

echo "8. Testing API from frontend container..."
docker exec inventory_frontend_prod wget -qO- http://backend:5000/api/products 2>&1 | head -c 200 || echo "Failed to connect to backend from frontend container"
echo ""
echo ""

echo "9. Checking if frontend build contains API URL..."
docker exec inventory_frontend_prod grep -r "REACT_APP_API_URL\|188.245.42.114" /usr/share/nginx/html/static/js/*.js 2>/dev/null | head -c 300 || echo "Could not find API URL in build (may need rebuild)"
echo ""
echo ""

echo "10. Frontend container network connectivity..."
docker exec inventory_frontend_prod ping -c 1 backend 2>&1 | head -2 || echo "Cannot ping backend from frontend"
echo ""

echo "=== Done ==="
echo ""
echo "IMPORTANT: If the frontend was rebuilt, check:"
echo "1. Open browser console (F12) and check for errors"
echo "2. Check Network tab to see if API calls are being made"
echo "3. Verify user is logged in (Stack Auth)"
echo "4. Check if API URL in browser matches: http://188.245.42.114:5000"

