const mongoose = require('mongoose');

const nutritionSchema = new mongoose.Schema({
  calories: {
    type: Number,
    required: true
  },
  protein: {
    type: String,
    required: true
  },
  carbs: {
    type: String,
    required: true
  },
  fat: {
    type: String,
    required: true
  },
  fiber: String,
  sugar: String,
  sodium: String,
  vitamins: [String],
  minerals: [String]
});

const mealSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a meal name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  category: {
    type: String,
    enum: ['main_course', 'snack', 'beverage', 'traditional_medicine', 'natural_supplements', 'breakfast', 'lunch', 'dinner'],
    required: true
  },
  subcategory: {
    type: String,
    enum: ['ugali', 'nyama_choma', 'githeri', 'mukimo', 'mandazi', 'chai', 'herbal_tea', 'honey', 'moringa', 'neem', 'aloe_vera', 'bitter_leaf', 'sweet_wormwood'],
    required: true
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'KES'
  },
  prepTime: {
    type: String,
    required: true
  },
  servingSize: {
    type: String,
    default: '1 serving'
  },
  ingredients: [{
    name: {
      type: String,
      required: true
    },
    quantity: String,
    unit: String,
    isLocal: {
      type: Boolean,
      default: true
    }
  }],
  nutrition: nutritionSchema,
  healthBenefits: [String],
  traditionalUses: [String],
  image: {
    type: String,
    required: true
  },
  images: [String],
  recipe: {
    instructions: [String],
    cookingTime: Number, // in minutes
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    servings: {
      type: Number,
      default: 1
    }
  },
  allergens: [String],
  dietaryTags: [String], // vegetarian, vegan, gluten-free, etc.
  origin: {
    region: String,
    tribe: String,
    culturalSignificance: String
  },
  availability: {
    type: String,
    enum: ['in_stock', 'out_of_stock', 'seasonal', 'pre_order'],
    default: 'in_stock'
  },
  supplier: {
    name: String,
    location: String,
    phone: String,
    isVerified: {
      type: Boolean,
      default: false
    }
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
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  language: {
    type: String,
    enum: ['english', 'swahili', 'luo', 'kikuyu'],
    default: 'english'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
mealSchema.index({ category: 1, subcategory: 1 });
mealSchema.index({ price: 1 });
mealSchema.index({ rating: -1 });
mealSchema.index({ isFeatured: 1 });
mealSchema.index({ availability: 1 });

// Calculate average rating
mealSchema.methods.updateRating = function(newRating, userId, comment) {
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

// Get meal summary
mealSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    category: this.category,
    subcategory: this.subcategory,
    price: this.price,
    currency: this.currency,
    prepTime: this.prepTime,
    image: this.image,
    rating: this.rating,
    availability: this.availability
  };
};

// Check if meal is available
mealSchema.methods.isAvailable = function() {
  return this.availability === 'in_stock' && this.isActive;
};

module.exports = mongoose.model('Meal', mealSchema);
