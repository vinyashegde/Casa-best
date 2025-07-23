# 🖥️ CASA Project Setup Guide for New PC

## Prerequisites (Install First)

### 1. Node.js (Required)
- Download from: https://nodejs.org/
- Install version 18 or higher
- Verify: `node --version` and `npm --version`

### 2. Git (Required)
- Download from: https://git-scm.com/
- Verify: `git --version`

### 3. MongoDB (Choose One Option)

#### Option A: MongoDB Atlas (Cloud - Recommended)
1. Go to https://www.mongodb.com/atlas
2. Create free account
3. Create a cluster
4. Get connection string

#### Option B: Local MongoDB
1. Download MongoDB Community Server
2. Install and start MongoDB service
3. Use default connection: `mongodb://localhost:27017/casa-fashion`

## 🚀 Step-by-Step Setup

### 1. Clone Repository
```bash
git clone <your-repository-url>
cd Casa-best
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Fix path-to-regexp version (IMPORTANT!)
npm install path-to-regexp@6.2.1 --save

# Install Twilio for SMS
npm install twilio

# Create environment file
copy .env.example .env
# OR on Mac/Linux: cp .env.example .env
```

### 3. Configure Backend Environment
Edit `backend/.env` file:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/casa-fashion
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/casa-fashion

# JWT Configuration
JWT_SECRET=casa-super-secret-jwt-key-2024-development-only
JWT_EXPIRE=7d

# Twilio Configuration (for SMS)
TWILIO_API_KEY_SID=SK921b28e22dfaa27ca905b7c27b4abfca
TWILIO_API_KEY_SECRET=rkO6cBUXSRIXs786Ir3Vefr13J1QqvIj
# TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (get from Twilio Console)
# TWILIO_PHONE_NUMBER=+1234567890 (get from Twilio Console)

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Frontend Setup
```bash
# Navigate to frontend (from project root)
cd frontend

# Install dependencies
npm install

# Create environment file
echo NEXT_PUBLIC_API_URL=http://localhost:5000 > .env.local
# OR on Windows: echo NEXT_PUBLIC_API_URL=http://localhost:5000 > .env.local
```

### 5. Start the Servers

#### Terminal 1 - Backend:
```bash
cd backend
node simple-working-server.js
```
**Expected output:**
```
⚠️  Twilio credentials not found - using console logging for verification codes
🚀 CASA Backend API running on port 5000
✅ Connected to MongoDB
```

#### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```
**Expected output:**
```
▲ Next.js 13.5.1
- Local:        http://localhost:3000
✅ Ready in 3.5s
```

## 🧪 Testing the Setup

### 1. Backend Health Check
Visit: http://localhost:5000/health
Should show: `{"status":"OK","message":"CASA Backend API is running"}`

### 2. Frontend
Visit: http://localhost:3000
Should show the CASA welcome screen

### 3. Sample Products
Visit: http://localhost:5000/api/products/sample
Should create and show sample products

### 4. Authentication Test
1. Go to http://localhost:3000
2. Enter phone: `9930990417`
3. Click "Send OTP"
4. Check backend console for verification code
5. Enter the code and test login

## 🔧 Common Issues & Solutions

### Issue 1: path-to-regexp Error
```bash
cd backend
npm install path-to-regexp@6.2.1 --save
```

### Issue 2: MongoDB Connection Failed
- Check MongoDB is running (local) or connection string (Atlas)
- Verify network access in MongoDB Atlas

### Issue 3: Port Already in Use
```bash
# Kill processes on ports
npx kill-port 3000
npx kill-port 5000
```

### Issue 4: Module Not Found
```bash
# Reinstall dependencies
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

### Issue 5: CORS Errors
- Ensure `.env.local` has: `NEXT_PUBLIC_API_URL=http://localhost:5000`
- Restart both servers

## 📱 SMS Configuration (Optional)

To enable real SMS:
1. Get your main Account SID from Twilio Console (starts with "AC")
2. Get a Twilio phone number
3. Update `.env` file:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```
4. Restart backend

## 🎯 Quick Start Commands

```bash
# 1. Clone and setup
git clone <repo-url>
cd Casa-best

# 2. Backend
cd backend
npm install
npm install path-to-regexp@6.2.1 twilio
# Edit .env file
node simple-working-server.js

# 3. Frontend (new terminal)
cd frontend
npm install
echo NEXT_PUBLIC_API_URL=http://localhost:5000 > .env.local
npm run dev
```

## ✅ Success Checklist

- [ ] Node.js installed (v18+)
- [ ] Repository cloned
- [ ] Backend dependencies installed
- [ ] Backend .env configured
- [ ] Frontend dependencies installed
- [ ] Frontend .env.local created
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Health check passes
- [ ] Authentication works
- [ ] Sample products load

**Your CASA project should now be fully functional!** 🎉
