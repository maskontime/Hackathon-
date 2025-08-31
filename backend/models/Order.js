const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  meal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meal',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  specialInstructions: String
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'KES'
  },
  deliveryAddress: {
    street: {
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
    postalCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    instructions: String
  },
  contactInfo: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: String
  },
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'cash_on_delivery', 'bank_transfer', 'credit_card'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentDetails: {
    transactionId: String,
    paymentDate: Date,
    mpesaCode: String
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  deliveryTime: {
    estimated: Date,
    actual: Date
  },
  deliveryPerson: {
    name: String,
    phone: String,
    id: String
  },
  specialInstructions: String,
  allergies: [String],
  dietaryRestrictions: [String],
  isUrgent: {
    type: Boolean,
    default: false
  },
  cancellationReason: String,
  refundAmount: Number,
  refundReason: String,
  rating: {
    food: {
      type: Number,
      min: 1,
      max: 5
    },
    delivery: {
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
      enum: ['order_confirmed', 'preparing', 'out_for_delivery', 'delivered', 'payment_received']
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
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ 'deliveryAddress.county': 1 });

// Generate order number
orderSchema.pre('save', function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `MH${year}${month}${day}${random}`;
  }
  next();
});

// Calculate totals
orderSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.total = this.subtotal + this.deliveryFee + this.tax;
  return this.save();
};

// Update order status
orderSchema.methods.updateStatus = function(newStatus, notificationMessage) {
  this.orderStatus = newStatus;
  
  if (notificationMessage) {
    this.notifications.push({
      type: newStatus,
      message: notificationMessage
    });
  }
  
  return this.save();
};

// Add rating
orderSchema.methods.addRating = function(foodRating, deliveryRating, overallRating, comment) {
  this.rating = {
    food: foodRating,
    delivery: deliveryRating,
    overall: overallRating,
    comment: comment,
    date: new Date()
  };
  return this.save();
};

// Get order summary
orderSchema.methods.getSummary = function() {
  return {
    id: this._id,
    orderNumber: this.orderNumber,
    total: this.total,
    currency: this.currency,
    orderStatus: this.orderStatus,
    paymentStatus: this.paymentStatus,
    deliveryAddress: this.deliveryAddress,
    createdAt: this.createdAt,
    deliveryTime: this.deliveryTime
  };
};

// Check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
  const cancellableStatuses = ['pending', 'confirmed'];
  return cancellableStatuses.includes(this.orderStatus);
};

// Calculate delivery time
orderSchema.methods.calculateDeliveryTime = function() {
  const now = new Date();
  const estimatedDelivery = new Date(now.getTime() + (45 * 60 * 1000)); // 45 minutes
  this.deliveryTime.estimated = estimatedDelivery;
  return this.save();
};

module.exports = mongoose.model('Order', orderSchema);
