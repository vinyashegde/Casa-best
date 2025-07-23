const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Initialize Twilio (if credentials are provided)
let twilioClient = null;

// Check for main Account SID + Auth Token (traditional method)
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    const twilio = require('twilio');
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio initialized with Account SID');
  } catch (error) {
    console.log('⚠️  Twilio initialization failed:', error.message);
  }
}
// Check for API Key credentials
else if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_API_KEY_SID && process.env.TWILIO_API_KEY_SECRET) {
  try {
    const twilio = require('twilio');
    twilioClient = twilio(
      process.env.TWILIO_API_KEY_SID,
      process.env.TWILIO_API_KEY_SECRET,
      { accountSid: process.env.TWILIO_ACCOUNT_SID }
    );
    console.log('✅ Twilio initialized with API Key');
  } catch (error) {
    console.log('⚠️  Twilio API Key initialization failed:', error.message);
  }
}
else {
  console.log('⚠️  Twilio credentials not found - using console logging for verification codes');
  console.log('   To enable SMS: Add TWILIO_ACCOUNT_SID and either TWILIO_AUTH_TOKEN or API Key credentials');
}

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Database connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ Connected to MongoDB'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Simple User Schema
const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  phoneVerified: { type: Boolean, default: false },
  verificationCode: { type: String, select: false },
  verificationCodeExpires: { type: Date, select: false },
  age: Number,
  location: String,
  interests: [String],
  fits: [String],
  onboardingComplete: { type: Boolean, default: false },
  profileComplete: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Hash verification code before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('verificationCode') || !this.verificationCode) {
    return next();
  }
  this.verificationCode = await bcrypt.hash(this.verificationCode, 12);
  next();
});

// Check verification code
userSchema.methods.checkVerificationCode = async function(candidateCode) {
  if (!this.verificationCode) return false;
  return await bcrypt.compare(candidateCode, this.verificationCode);
};

// Check if verification code is expired
userSchema.methods.isVerificationCodeExpired = function() {
  return Date.now() > this.verificationCodeExpires;
};

const User = mongoose.model('User', userSchema);

// Wishlist Schema
const wishlistItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  notes: {
    type: String,
    maxlength: 500,
    trim: true
  },
  priceWhenAdded: {
    type: Number,
    min: 0
  }
});

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [wishlistItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Wishlist methods
wishlistSchema.methods.addItem = function(productId, options = {}) {
  const existingItem = this.items.find(item =>
    item.product.toString() === productId.toString()
  );

  if (existingItem) {
    return this.save();
  }

  this.items.push({
    product: productId,
    priority: options.priority || 0,
    notes: options.notes || '',
    priceWhenAdded: options.priceWhenAdded
  });

  this.updatedAt = new Date();
  return this.save();
};

wishlistSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(item =>
    item.product.toString() !== productId.toString()
  );
  this.updatedAt = new Date();
  return this.save();
};

wishlistSchema.methods.hasProduct = function(productId) {
  return this.items.some(item =>
    item.product.toString() === productId.toString()
  );
};

wishlistSchema.statics.findOrCreateForUser = async function(userId) {
  let wishlist = await this.findOne({ user: userId });

  if (!wishlist) {
    wishlist = new this({ user: userId });
    await wishlist.save();
  }

  return wishlist;
};

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

// SMS sending function
async function sendSMS(to, message) {
  if (!twilioClient) {
    console.log(`📱 SMS would be sent to ${to}: ${message}`);
    return { success: true, method: 'console' };
  }

  try {
    if (!process.env.TWILIO_PHONE_NUMBER) {
      throw new Error('TWILIO_PHONE_NUMBER not configured');
    }

    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to.startsWith('+') ? to : `+91${to}` // Add India country code if not present
    });

    console.log(`✅ SMS sent to ${to} - SID: ${result.sid}`);
    return { success: true, method: 'twilio', sid: result.sid };
  } catch (error) {
    console.error(`❌ SMS failed to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Simple Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  brand: String,
  images: [{ url: String, filename: String, isPrimary: Boolean }],
  price: {
    original: Number,
    current: Number,
    currency: { type: String, default: 'INR' }
  },
  category: String,
  gender: String,
  sizes: [{ size: String, inStock: Boolean }],
  colors: [String],
  isActive: { type: Boolean, default: true },
  inStock: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'CASA Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve test upload page
app.get('/test-upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-upload.html'));
});

// ===== AUTHENTICATION ROUTES =====

// Send verification code
app.post('/api/auth/send-code', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }
    
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Find or create user
    let user = await User.findOne({ phone });
    
    if (!user) {
      user = new User({
        phone,
        verificationCode: code,
        verificationCodeExpires: codeExpires
      });
    } else {
      user.verificationCode = code;
      user.verificationCodeExpires = codeExpires;
    }
    
    await user.save();

    // Send SMS with verification code
    const smsMessage = `Your CASA verification code is: ${code}. Valid for 10 minutes.`;
    const smsResult = await sendSMS(phone, smsMessage);

    // Always log the code for development/debugging
    console.log(`📱 Verification code for ${phone}: ${code}`);

    res.status(200).json({
      success: true,
      message: smsResult.method === 'twilio'
        ? 'Verification code sent via SMS'
        : 'Verification code sent successfully',
      data: {
        phone,
        expiresIn: 600,
        smsMethod: smsResult.method,
        // In development, include the code for testing
        ...(process.env.NODE_ENV === 'development' && { code })
      }
    });
    
  } catch (error) {
    console.error('Send verification code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification code'
    });
  }
});

// Verify phone and login
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { phone, code } = req.body;
    
    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and verification code are required'
      });
    }
    
    // Find user
    const user = await User.findOne({ phone }).select('+verificationCode +verificationCodeExpires');
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number or verification code'
      });
    }
    
    // Check if code is expired
    if (user.isVerificationCodeExpired()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      });
    }
    
    // Verify code
    const isValidCode = await user.checkVerificationCode(code);
    
    if (!isValidCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }
    
    // Mark phone as verified
    user.phoneVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    
    const isNewUser = !user.onboardingComplete;
    await user.save();
    
    // Generate simple token (in production, use proper JWT)
    const token = `token_${user._id}_${Date.now()}`;
    
    res.status(200).json({
      success: true,
      message: isNewUser ? 'Phone verified successfully. Welcome to CASA!' : 'Login successful',
      data: {
        user: {
          id: user._id,
          phone: user.phone,
          phoneVerified: user.phoneVerified,
          onboardingComplete: user.onboardingComplete,
          profileComplete: user.profileComplete,
          age: user.age,
          location: user.location,
          interests: user.interests,
          fits: user.fits
        },
        token,
        isNewUser
      }
    });
    
  } catch (error) {
    console.error('Verify phone error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed'
    });
  }
});

// Complete onboarding
app.post('/api/auth/onboarding', async (req, res) => {
  try {
    const { age, interests, fits, location, userId } = req.body;
    
    if (!userId || !age || !interests || !fits || !location) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update user profile
    user.age = age;
    user.interests = interests;
    user.fits = fits;
    user.location = location;
    user.onboardingComplete = true;
    user.profileComplete = true;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        user: {
          id: user._id,
          phone: user.phone,
          age: user.age,
          interests: user.interests,
          fits: user.fits,
          location: user.location,
          onboardingComplete: user.onboardingComplete,
          profileComplete: user.profileComplete
        }
      }
    });
    
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete onboarding'
    });
  }
});

// ===== IMAGE UPLOAD ROUTES =====

// Upload single image
app.post('/api/upload/image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: imageUrl
      }
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image'
    });
  }
});

// Upload multiple images
app.post('/api/upload/images', upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }

    const uploadedImages = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
    }));

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        images: uploadedImages,
        count: uploadedImages.length
      }
    });

  } catch (error) {
    console.error('Images upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images'
    });
  }
});

// Delete image
app.delete('/api/upload/image/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    fs.unlinkSync(filePath);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Image delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image'
    });
  }
});

// ===== PRODUCT ROUTES =====

// Get sample products for testing
app.get('/api/products/sample', async (req, res) => {
  try {
    // Create sample products if none exist
    const productCount = await Product.countDocuments();
    
    if (productCount === 0) {
      const sampleProducts = [
        {
          name: "Stylish Summer Dress",
          description: "Perfect for casual outings and summer parties",
          brand: "Fashion Co",
          images: [{ url: "https://via.placeholder.com/400x600/FF6B6B/FFFFFF?text=Summer+Dress", isPrimary: true }],
          price: { original: 2999, current: 1999, currency: "INR" },
          category: "dresses",
          gender: "women",
          sizes: [{ size: "S", inStock: true }, { size: "M", inStock: true }, { size: "L", inStock: true }],
          colors: ["red", "blue", "white"]
        },
        {
          name: "Classic White Sneakers",
          description: "Comfortable and versatile sneakers for everyday wear",
          brand: "SportStyle",
          images: [{ url: "https://via.placeholder.com/400x600/4ECDC4/FFFFFF?text=White+Sneakers", isPrimary: true }],
          price: { original: 4999, current: 3499, currency: "INR" },
          category: "footwear",
          gender: "unisex",
          sizes: [{ size: "7", inStock: true }, { size: "8", inStock: true }, { size: "9", inStock: true }],
          colors: ["white", "black"]
        },
        {
          name: "Denim Jacket",
          description: "Classic denim jacket perfect for layering",
          brand: "Urban Style",
          images: [{ url: "https://via.placeholder.com/400x600/45B7D1/FFFFFF?text=Denim+Jacket", isPrimary: true }],
          price: { original: 3999, current: 2999, currency: "INR" },
          category: "outerwear",
          gender: "unisex",
          sizes: [{ size: "S", inStock: true }, { size: "M", inStock: true }, { size: "L", inStock: true }],
          colors: ["blue", "black"]
        },
        {
          name: "Floral Print Top",
          description: "Trendy floral print top for everyday wear",
          brand: "Style Hub",
          images: [{ url: "https://via.placeholder.com/400x600/F39C12/FFFFFF?text=Floral+Top", isPrimary: true }],
          price: { original: 1999, current: 1499, currency: "INR" },
          category: "tops",
          gender: "women",
          sizes: [{ size: "XS", inStock: true }, { size: "S", inStock: true }, { size: "M", inStock: true }],
          colors: ["pink", "yellow", "green"]
        },
        {
          name: "Casual Chinos",
          description: "Comfortable chinos perfect for casual and semi-formal occasions",
          brand: "Comfort Wear",
          images: [{ url: "https://via.placeholder.com/400x600/8E44AD/FFFFFF?text=Chinos", isPrimary: true }],
          price: { original: 2499, current: 1999, currency: "INR" },
          category: "bottoms",
          gender: "men",
          sizes: [{ size: "30", inStock: true }, { size: "32", inStock: true }, { size: "34", inStock: true }],
          colors: ["khaki", "navy", "black"]
        }
      ];
      
      await Product.insertMany(sampleProducts);
      console.log('✅ Sample products created');
    }
    
    const products = await Product.find({ isActive: true }).limit(20);
    
    res.status(200).json({
      success: true,
      data: {
        products,
        count: products.length
      }
    });
    
  } catch (error) {
    console.error('Get sample products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get products'
    });
  }
});

// Create new product with images
app.post('/api/products', upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, brand, price, category, gender, sizes, colors } = req.body;

    if (!name || !description || !brand || !price || !category || !gender) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: name, description, brand, price, category, gender'
      });
    }

    // Process uploaded images
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        images.push({
          url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
          filename: file.filename,
          isPrimary: index === 0 // First image is primary
        });
      });
    }

    // Parse JSON fields if they're strings
    const parsedPrice = typeof price === 'string' ? JSON.parse(price) : price;
    const parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
    const parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;

    const product = new Product({
      name,
      description,
      brand,
      images,
      price: parsedPrice,
      category,
      gender,
      sizes: parsedSizes || [],
      colors: parsedColors || []
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        product
      }
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, gender } = req.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true };
    if (category) query.category = category;
    if (gender) query.gender = gender;

    const products = await Product.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get products'
    });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        product
      }
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product'
    });
  }
});

// ===== WISHLIST ROUTES =====

// Get user's wishlist
app.get('/api/wishlist', async (req, res) => {
  try {
    const userId = req.user._id;

    const wishlist = await Wishlist.findOrCreateForUser(userId);
    await wishlist.populate('items.product');

    res.status(200).json({
      success: true,
      data: {
        wishlist: {
          items: wishlist.items,
          totalItems: wishlist.items.length,
          createdAt: wishlist.createdAt,
          updatedAt: wishlist.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wishlist'
    });
  }
});

// Add item to wishlist
app.post('/api/wishlist', async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, priority, notes } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const wishlist = await Wishlist.findOrCreateForUser(userId);

    // Check if already in wishlist
    if (wishlist.hasProduct(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Product already in wishlist'
      });
    }

    await wishlist.addItem(productId, {
      priority,
      notes,
      priceWhenAdded: product.price.current
    });

    await wishlist.populate('items.product');

    res.status(200).json({
      success: true,
      message: 'Item added to wishlist successfully',
      data: {
        wishlist: {
          items: wishlist.items,
          totalItems: wishlist.items.length
        }
      }
    });

  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to wishlist'
    });
  }
});

// Remove item from wishlist
app.delete('/api/wishlist/:productId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    if (!wishlist.hasProduct(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Product not in wishlist'
      });
    }

    await wishlist.removeItem(productId);
    await wishlist.populate('items.product');

    res.status(200).json({
      success: true,
      message: 'Item removed from wishlist successfully',
      data: {
        wishlist: {
          items: wishlist.items,
          totalItems: wishlist.items.length
        }
      }
    });

  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from wishlist'
    });
  }
});

// Check if product is in wishlist
app.get('/api/wishlist/check/:productId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: userId });
    const inWishlist = wishlist ? wishlist.hasProduct(productId) : false;

    res.status(200).json({
      success: true,
      data: {
        inWishlist,
        productId
      }
    });

  } catch (error) {
    console.error('Check wishlist status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check wishlist status'
    });
  }
});

// Update product
app.put('/api/products/:id', upload.array('images', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, brand, price, category, gender, sizes, colors } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update basic fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (brand) product.brand = brand;
    if (category) product.category = category;
    if (gender) product.gender = gender;

    if (price) {
      product.price = typeof price === 'string' ? JSON.parse(price) : price;
    }
    if (sizes) {
      product.sizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
    }
    if (colors) {
      product.colors = typeof colors === 'string' ? JSON.parse(colors) : colors;
    }

    // Add new images if uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, index) => ({
        url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
        filename: file.filename,
        isPrimary: product.images.length === 0 && index === 0 // First image is primary if no existing images
      }));
      product.images.push(...newImages);
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: {
        product
      }
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete associated image files
    product.images.forEach(image => {
      if (image.filename) {
        const filePath = path.join(uploadsDir, image.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });

    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 CASA Backend API running on port ${PORT}`);
});

module.exports = app;
