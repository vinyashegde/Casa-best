# 👗 CASA - Swipe Your Style

A modern fashion discovery app built with Next.js and Node.js, featuring Tinder-like swiping for fashion items.

## ✨ Features

- 📱 **Phone Authentication** with SMS verification
- 👆 **Swipe Interface** for discovering fashion items
- 🎯 **Personalized Recommendations** based on user preferences
- 📸 **Image Upload** for products
- 👤 **User Profiles** with style preferences
- 🔐 **JWT Authentication** with secure sessions
- 📊 **Admin Dashboard** for product management

## 🛠️ Tech Stack

### Frontend
- **Next.js 13** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Component library

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Twilio** - SMS verification
- **Multer** - File uploads

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Git

### Automated Setup

#### Windows:
```bash
git clone <your-repo-url>
cd Casa-best
setup.bat
```

#### Mac/Linux:
```bash
git clone <your-repo-url>
cd Casa-best
chmod +x setup.sh
./setup.sh
```

### Manual Setup

1. **Clone Repository**
```bash
git clone <your-repo-url>
cd Casa-best
```

2. **Backend Setup**
```bash
cd backend
npm install
npm install path-to-regexp@6.2.1 twilio
# Edit .env file (see setup-new-pc.md)
npm start
```

3. **Frontend Setup**
```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
npm run dev
```

## 🌐 URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health
- **Test Upload**: http://localhost:5000/test-upload

## 📱 Authentication

The app uses phone number authentication:
1. Enter your phone number
2. Receive SMS verification code (or check console in development)
3. Enter code to login
4. Complete onboarding (first-time users only)

### Test Numbers
- `9930990417` - Existing user (skips onboarding)
- `9876543210` - New user (shows onboarding)

## 🔧 Configuration

### Backend Environment (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/casa-fashion
JWT_SECRET=your-secret-key
TWILIO_API_KEY_SID=your-twilio-key
TWILIO_API_KEY_SECRET=your-twilio-secret
```

### Frontend Environment (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/send-code` - Send verification code
- `POST /api/auth/verify` - Verify code and login
- `POST /api/auth/logout` - Logout user

### Products
- `GET /api/products/sample` - Get sample products
- `POST /api/products` - Create product (with image)
- `GET /api/products` - Get all products

### User
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/profile` - Get user profile

## 🐛 Troubleshooting

### Common Issues

1. **path-to-regexp Error**
   ```bash
   npm install path-to-regexp@6.2.1 --save
   ```

2. **MongoDB Connection Failed**
   - Check MongoDB is running
   - Verify connection string

3. **Port Already in Use**
   ```bash
   npx kill-port 3000
   npx kill-port 5000
   ```

4. **Module Not Found**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📖 Documentation

- [Setup Guide](setup-new-pc.md) - Detailed setup instructions
- [API Documentation](docs/api.md) - API reference (coming soon)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

If you encounter any issues:
1. Check the [Setup Guide](setup-new-pc.md)
2. Review the troubleshooting section
3. Check console logs for errors
4. Ensure all dependencies are installed

---

**Happy Coding!** 🎉✨
