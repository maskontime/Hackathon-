const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  healthProfessional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HealthProfessional',
    required: true
  },
  bookingNumber: {
    type: String,
    unique: true,
    required: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  appointmentTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: 30
  },
  service: {
    name: String,
    description: String,
    price: Number,
    duration: Number
  },
  consultationType: {
    type: String,
    enum: ['in_person', 'online', 'home_visit'],
    default: 'in_person'
  },
  location: {
    type: String,
    enum: ['clinic', 'home', 'online'],
    default: 'clinic'
  },
  address: {
    street: String,
    city: String,
    county: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  symptoms: [String],
  medicalHistory: String,
  currentMedications: [String],
  allergies: [String],
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  specialInstructions: String,
  isUrgent: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'cash', 'bank_transfer', 'insurance'],
    default: 'mpesa'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'KES'
  },
  paymentDetails: {
    transactionId: String,
    paymentDate: Date,
    mpesaCode: String
  },
  cancellationReason: String,
  cancellationDate: Date,
  cancellationBy: {
    type: String,
    enum: ['user', 'professional', 'system'],
    default: 'user'
  },
  notes: {
    professional: String,
    user: String
  },
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    date: Date,
    reason: String
  },
  rating: {
    professional: {
      type: Number,
      min: 1,
      max: 5
    },
    service: {
      type: Number,
      min: 1,
      max: 5
    },
    overall: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    date: Date
  },
  notifications: [{
    type: {
      type: String,
      enum: ['booking_confirmed', 'reminder', 'cancelled', 'completed', 'payment_received']
    },
    message: String,
    sentAt: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
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
bookingSchema.index({ user: 1, appointmentDate: -1 });
bookingSchema.index({ healthProfessional: 1, appointmentDate: 1 });
bookingSchema.index({ bookingNumber: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ appointmentDate: 1, status: 1 });

// Generate booking number
bookingSchema.pre('save', function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.bookingNumber = `BK${year}${month}${day}${random}`;
  }
  next();
});

// Update booking status
bookingSchema.methods.updateStatus = function(newStatus, notificationMessage) {
  this.status = newStatus;
  
  if (notificationMessage) {
    this.notifications.push({
      type: newStatus,
      message: notificationMessage
    });
  }
  
  return this.save();
};

// Cancel booking
bookingSchema.methods.cancelBooking = function(reason, cancelledBy) {
  this.status = 'cancelled';
  this.cancellationReason = reason;
  this.cancellationDate = new Date();
  this.cancellationBy = cancelledBy;
  
  this.notifications.push({
    type: 'cancelled',
    message: `Your appointment has been cancelled. Reason: ${reason}`
  });
  
  return this.save();
};

// Add rating
bookingSchema.methods.addRating = function(professionalRating, serviceRating, overallRating, comment) {
  this.rating = {
    professional: professionalRating,
    service: serviceRating,
    overall: overallRating,
    comment: comment,
    date: new Date()
  };
  return this.save();
};

// Get booking summary
bookingSchema.methods.getSummary = function() {
  return {
    id: this._id,
    bookingNumber: this.bookingNumber,
    appointmentDate: this.appointmentDate,
    appointmentTime: this.appointmentTime,
    status: this.status,
    paymentStatus: this.paymentStatus,
    amount: this.amount,
    currency: this.currency,
    consultationType: this.consultationType
  };
};

// Check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  const cancellableStatuses = ['pending', 'confirmed'];
  const appointmentDateTime = new Date(this.appointmentDate);
  const now = new Date();
  const hoursDifference = (appointmentDateTime - now) / (1000 * 60 * 60);
  
  return cancellableStatuses.includes(this.status) && hoursDifference > 24;
};

// Check if booking is upcoming
bookingSchema.methods.isUpcoming = function() {
  const appointmentDateTime = new Date(this.appointmentDate);
  const now = new Date();
  return appointmentDateTime > now && this.status === 'confirmed';
};

// Get appointment duration in minutes
bookingSchema.methods.getDuration = function() {
  return this.duration || 30;
};

module.exports = mongoose.model('Booking', bookingSchema);
