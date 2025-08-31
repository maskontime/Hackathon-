const mongoose = require('mongoose');

const qualificationSchema = new mongoose.Schema({
  degree: {
    type: String,
    required: true
  },
  institution: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  certificateUrl: String
});

const availabilitySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
});

const healthProfessionalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  specialty: {
    type: String,
    required: [true, 'Please provide a specialty'],
    enum: ['general_practitioner', 'clinical_nutritionist', 'physical_therapist', 'pediatrician', 'mental_health_counselor', 'personal_trainer', 'dermatologist', 'cardiologist', 'orthopedic', 'dentist', 'pharmacist', 'traditional_healer']
  },
  subSpecialty: [String],
  experience: {
    years: {
      type: Number,
      required: true,
      min: 0
    },
    description: String
  },
  qualifications: [qualificationSchema],
  licenses: [{
    number: String,
    issuingAuthority: String,
    expiryDate: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  bio: {
    type: String,
    required: [true, 'Please provide a bio'],
    maxlength: [1000, 'Bio cannot be more than 1000 characters']
  },
  services: [{
    name: String,
    description: String,
    duration: Number, // in minutes
    price: Number,
    currency: {
      type: String,
      default: 'KES'
    }
  }],
  consultationFee: {
    type: Number,
    required: [true, 'Please provide consultation fee'],
    min: [0, 'Fee cannot be negative']
  },
  availability: [availabilitySchema],
  languages: [{
    type: String,
    enum: ['english', 'swahili', 'luo', 'kikuyu', 'kamba', 'kisii', 'other']
  }],
  location: {
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    county: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  contact: {
    phone: {
      type: String,
      required: true
    },
    email: String,
    whatsapp: String,
    emergencyContact: String
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  profileImage: {
    type: String,
    required: true
  },
  gallery: [String],
  certifications: [{
    name: String,
    issuingOrganization: String,
    date: Date,
    expiryDate: Date,
    imageUrl: String
  }],
  specializations: [String],
  insuranceAccepted: [String],
  paymentMethods: [{
    type: String,
    enum: ['cash', 'mpesa', 'bank_transfer', 'insurance', 'credit_card']
  }],
  emergencyServices: {
    type: Boolean,
    default: false
  },
  homeVisits: {
    type: Boolean,
    default: false
  },
  onlineConsultation: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationDocuments: [{
    type: String,
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  languages: [{
    type: String,
    enum: ['english', 'swahili', 'luo', 'kikuyu', 'kamba', 'kisii', 'other']
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
healthProfessionalSchema.index({ specialty: 1 });
healthProfessionalSchema.index({ 'location.county': 1 });
healthProfessionalSchema.index({ rating: -1 });
healthProfessionalSchema.index({ isVerified: 1 });
healthProfessionalSchema.index({ isActive: 1 });

// Calculate average rating
healthProfessionalSchema.methods.updateRating = function(newRating, userId, comment) {
  const totalRating = this.rating.average * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  
  // Add review
  this.reviews.push({
    user: userId,
    rating: newRating,
    comment: comment
  });
  
  return this.save();
};

// Get professional summary
healthProfessionalSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.user.name,
    specialty: this.specialty,
    experience: this.experience.years,
    location: this.location,
    consultationFee: this.consultationFee,
    rating: this.rating,
    profileImage: this.profileImage,
    isVerified: this.isVerified,
    isActive: this.isActive
  };
};

// Check if professional is available on specific day and time
healthProfessionalSchema.methods.isAvailable = function(day, time) {
  const availability = this.availability.find(a => a.day === day && a.isAvailable);
  if (!availability) return false;
  
  const requestedTime = new Date(`2000-01-01 ${time}`);
  const startTime = new Date(`2000-01-01 ${availability.startTime}`);
  const endTime = new Date(`2000-01-01 ${availability.endTime}`);
  
  return requestedTime >= startTime && requestedTime <= endTime;
};

// Get next available slot
healthProfessionalSchema.methods.getNextAvailableSlot = function() {
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const currentTime = now.toLocaleTimeString('en-US', { hour12: false });
  
  // Find today's availability
  let todayAvailability = this.availability.find(a => a.day === currentDay && a.isAvailable);
  
  if (todayAvailability && currentTime < todayAvailability.endTime) {
    return {
      day: currentDay,
      time: currentTime < todayAvailability.startTime ? todayAvailability.startTime : currentTime
    };
  }
  
  // Find next available day
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const currentDayIndex = days.indexOf(currentDay);
  
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7;
    const nextDay = days[nextDayIndex];
    const nextDayAvailability = this.availability.find(a => a.day === nextDay && a.isAvailable);
    
    if (nextDayAvailability) {
      return {
        day: nextDay,
        time: nextDayAvailability.startTime
      };
    }
  }
  
  return null;
};

module.exports = mongoose.model('HealthProfessional', healthProfessionalSchema);
