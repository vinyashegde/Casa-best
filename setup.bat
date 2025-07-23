@echo off
echo ========================================
echo    CASA Project Setup Script
echo ========================================
echo.

echo [1/6] Setting up Backend...
cd backend

echo Installing backend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Backend npm install failed
    pause
    exit /b 1
)

echo Installing specific versions...
call npm install path-to-regexp@6.2.1 --save
call npm install twilio --save

echo Creating .env file...
if not exist .env (
    echo # Server Configuration > .env
    echo PORT=5000 >> .env
    echo NODE_ENV=development >> .env
    echo. >> .env
    echo # Database Configuration >> .env
    echo MONGODB_URI=mongodb://localhost:27017/casa-fashion >> .env
    echo. >> .env
    echo # JWT Configuration >> .env
    echo JWT_SECRET=casa-super-secret-jwt-key-2024-development-only >> .env
    echo JWT_EXPIRE=7d >> .env
    echo. >> .env
    echo # Twilio Configuration >> .env
    echo TWILIO_API_KEY_SID=SK921b28e22dfaa27ca905b7c27b4abfca >> .env
    echo TWILIO_API_KEY_SECRET=rkO6cBUXSRIXs786Ir3Vefr13J1QqvIj >> .env
    echo # TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx >> .env
    echo # TWILIO_PHONE_NUMBER=+1234567890 >> .env
    echo. >> .env
    echo # Rate Limiting >> .env
    echo RATE_LIMIT_WINDOW_MS=900000 >> .env
    echo RATE_LIMIT_MAX_REQUESTS=100 >> .env
    echo ✅ Created .env file
) else (
    echo ✅ .env file already exists
)

echo [2/6] Setting up Frontend...
cd ..\frontend

echo Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Frontend npm install failed
    pause
    exit /b 1
)

echo Creating .env.local file...
echo NEXT_PUBLIC_API_URL=http://localhost:5000 > .env.local
echo ✅ Created .env.local file

cd ..

echo.
echo ========================================
echo    Setup Complete! 🎉
echo ========================================
echo.
echo To start the project:
echo.
echo 1. Backend (Terminal 1):
echo    cd backend
echo    node simple-working-server.js
echo.
echo 2. Frontend (Terminal 2):
echo    cd frontend
echo    npm run dev
echo.
echo Then visit: http://localhost:3000
echo.
echo ========================================
pause
