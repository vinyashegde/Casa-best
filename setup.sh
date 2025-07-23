#!/bin/bash

echo "========================================"
echo "    CASA Project Setup Script"
echo "========================================"
echo

echo "[1/6] Setting up Backend..."
cd backend

echo "Installing backend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Backend npm install failed"
    exit 1
fi

echo "Installing specific versions..."
npm install path-to-regexp@6.2.1 --save
npm install twilio --save

echo "Creating .env file..."
if [ ! -f .env ]; then
    cat > .env << EOF
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/casa-fashion

# JWT Configuration
JWT_SECRET=casa-super-secret-jwt-key-2024-development-only
JWT_EXPIRE=7d

# Twilio Configuration
TWILIO_API_KEY_SID=SK921b28e22dfaa27ca905b7c27b4abfca
TWILIO_API_KEY_SECRET=rkO6cBUXSRIXs786Ir3Vefr13J1QqvIj
# TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# TWILIO_PHONE_NUMBER=+1234567890

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi

echo "[2/6] Setting up Frontend..."
cd ../frontend

echo "Installing frontend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Frontend npm install failed"
    exit 1
fi

echo "Creating .env.local file..."
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
echo "✅ Created .env.local file"

cd ..

echo
echo "========================================"
echo "    Setup Complete! 🎉"
echo "========================================"
echo
echo "To start the project:"
echo
echo "1. Backend (Terminal 1):"
echo "   cd backend"
echo "   node simple-working-server.js"
echo
echo "2. Frontend (Terminal 2):"
echo "   cd frontend"
echo "   npm run dev"
echo
echo "Then visit: http://localhost:3000"
echo
echo "========================================"
