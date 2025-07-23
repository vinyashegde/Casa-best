# 🔧 CASA Project Troubleshooting Guide

## Common Issues and Solutions

### 1. 🚫 path-to-regexp Error
**Error:** `TypeError: Missing parameter name at 1`

**Solution:**
```bash
cd backend
npm install path-to-regexp@6.2.1 --save
```

### 2. 🔌 MongoDB Connection Failed
**Error:** `MongoNetworkError: failed to connect to server`

**Solutions:**
- **Local MongoDB:** Ensure MongoDB service is running
- **MongoDB Atlas:** Check connection string and network access
- **Firewall:** Ensure ports 27017 (local) or 27015-27017 (Atlas) are open

### 3. 📱 Port Already in Use
**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Kill processes on specific ports
npx kill-port 3000
npx kill-port 5000

# Or find and kill manually
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

### 4. 📦 Module Not Found
**Error:** `Cannot find module 'xyz'`

**Solution:**
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### 5. 🌐 CORS Errors
**Error:** `Access to fetch at 'http://localhost:5000' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Solution:**
- Ensure `frontend/.env.local` contains: `NEXT_PUBLIC_API_URL=http://localhost:5000`
- Restart both servers
- Check backend CORS configuration

### 6. 🔐 Authentication Issues
**Error:** User gets stuck in onboarding loop

**Solution:**
- Check database for user record
- Verify `onboardingComplete` field
- Clear browser localStorage: `localStorage.clear()`

### 7. 📸 Image Upload Fails
**Error:** `MulterError: Unexpected field`

**Solution:**
- Ensure `uploads` directory exists in backend
- Check file permissions
- Verify multer configuration

### 8. 🗄️ Database Issues
**Error:** Various MongoDB errors

**Solutions:**
```bash
# Check MongoDB status (local)
mongosh
show dbs

# Reset database (if needed)
use casa-fashion
db.dropDatabase()
```

### 9. 🔧 Environment Variables Not Loading
**Error:** `undefined` values for environment variables

**Solution:**
- Ensure `.env` file exists in backend root
- Ensure `.env.local` file exists in frontend root
- Check file names (no extra spaces)
- Restart servers after changes

### 10. 📱 SMS/Twilio Issues
**Error:** Twilio initialization failed

**Solution:**
- For development: SMS codes will appear in console
- For production: Add `TWILIO_ACCOUNT_SID` and `TWILIO_PHONE_NUMBER`
- Check Twilio credentials are correct

## 🔍 Debugging Steps

### 1. Check Server Status
```bash
# Backend health check
curl http://localhost:5000/health

# Frontend check
curl http://localhost:3000
```

### 2. Check Logs
- **Backend:** Check terminal running `npm start`
- **Frontend:** Check browser console (F12)
- **Database:** Check MongoDB logs

### 3. Verify Environment
```bash
# Check Node.js version
node --version  # Should be 18+

# Check npm version
npm --version

# Check MongoDB connection
mongosh "mongodb://localhost:27017/casa-fashion"
```

### 4. Reset Everything
```bash
# Kill all processes
npx kill-port 3000
npx kill-port 5000

# Clean install backend
cd backend
rm -rf node_modules package-lock.json
npm install
npm install path-to-regexp@6.2.1 twilio

# Clean install frontend
cd ../frontend
rm -rf node_modules package-lock.json
npm install

# Restart servers
cd ../backend && npm start
cd ../frontend && npm run dev
```

## 🆘 Still Having Issues?

### Check These Files Exist:
- `backend/.env` - Backend environment variables
- `frontend/.env.local` - Frontend environment variables
- `backend/uploads/` - Directory for file uploads
- `backend/node_modules/` - Backend dependencies
- `frontend/node_modules/` - Frontend dependencies

### Verify Package Versions:
- `backend/package.json` - Should have `path-to-regexp@6.2.1`
- Node.js version 18 or higher
- MongoDB running (local or Atlas)

### Test API Endpoints:
- http://localhost:5000/health - Should return OK
- http://localhost:5000/api/products/sample - Should return products
- http://localhost:3000 - Should show CASA app

### Common File Issues:
```bash
# Windows: Check file permissions
icacls backend/.env
icacls frontend/.env.local

# Mac/Linux: Check file permissions
ls -la backend/.env
ls -la frontend/.env.local
```

## 📞 Getting Help

1. **Check Console Logs:** Both browser and terminal
2. **Verify All Steps:** Follow setup guide exactly
3. **Test Incrementally:** Start with backend, then frontend
4. **Check Dependencies:** Ensure all packages installed correctly
5. **Environment:** Verify all environment variables set

**Remember:** Most issues are related to missing dependencies, incorrect environment variables, or port conflicts. Follow the setup guide step by step! 🎯
