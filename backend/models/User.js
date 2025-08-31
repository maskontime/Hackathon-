const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    match: [/^\+254\d{9}$/, 'Please provide a valid Kenyan phone number']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'health_professional', 'admin'],
    default: 'user'
  },
  profileImage: {
    type: String,
    default: ''
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  location: {
    type: String,
    required: [true, 'Please provide your location']
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  healthProfile: {
    height: Number, // in cm
    weight: Number, // in kg
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    allergies: [String],
    medicalConditions: [String],
    medications: [String]
  },
  preferences: {
    fitnessGoals: [String],
    dietaryRestrictions: [String],
    preferredLanguage: {
      type: String,
      enum: ['english', 'swahili', 'luo', 'kikuyu', 'other'],
      default: 'english'
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ location: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateToken = function() {
  return jwt.sign(
    { 
      id: this._id, 
      email: this.email, 
      role: this.role 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE || '7d' 
    }
  );
};

// Calculate BMI
userSchema.methods.calculateBMI = function() {
  if (this.healthProfile.height && this.healthProfile.weight) {
    const heightInMeters = this.healthProfile.height / 100;
    return (this.healthProfile.weight / (heightInMeters * heightInMeters)).toFixed(1);
  }
  return null;
};

// Get user profile without sensitive data
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
