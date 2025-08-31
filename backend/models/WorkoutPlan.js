const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in seconds
    required: true
  },
  sets: {
    type: Number,
    default: 1
  },
  reps: {
    type: Number,
    default: 1
  },
  restTime: {
    type: Number, // in seconds
    default: 30
  },
  equipment: [String],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  muscleGroups: [String],
  videoUrl: String,
  imageUrl: String,
  instructions: [String]
});

const workoutPlanSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a workout plan title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  category: {
    type: String,
    enum: ['cardio', 'strength', 'flexibility', 'yoga', 'dance', 'hiit', 'core', 'full_body'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  exercises: [exerciseSchema],
  totalExercises: {
    type: Number,
    default: 0
  },
  caloriesBurn: {
    type: Number, // estimated calories burned
    default: 0
  },
  targetMuscleGroups: [String],
  equipment: [String],
  image: {
    type: String,
    required: true
  },
  video: String,
  instructor: {
    name: String,
    bio: String,
    image: String
  },
  tags: [String],
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
  participants: {
    type: Number,
    default: 0
  },
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
workoutPlanSchema.index({ category: 1, difficulty: 1 });
workoutPlanSchema.index({ isFeatured: 1 });
workoutPlanSchema.index({ rating: -1 });
workoutPlanSchema.index({ participants: -1 });

// Calculate total exercises before saving
workoutPlanSchema.pre('save', function(next) {
  this.totalExercises = this.exercises.length;
  next();
});

// Calculate average rating
workoutPlanSchema.methods.updateRating = function(newRating) {
  const totalRating = this.rating.average * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Get workout summary
workoutPlanSchema.methods.getSummary = function() {
  return {
    id: this._id,
    title: this.title,
    description: this.description,
    category: this.category,
    difficulty: this.difficulty,
    duration: this.duration,
    totalExercises: this.totalExercises,
    caloriesBurn: this.caloriesBurn,
    image: this.image,
    rating: this.rating,
    participants: this.participants
  };
};

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
