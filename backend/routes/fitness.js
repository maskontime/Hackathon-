const express = require('express');
const { query, param, body, validationResult } = require('express-validator');
const WorkoutPlan = require('../models/WorkoutPlan');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/fitness/workouts
// @desc    Get all workout plans with filtering
// @access  Public
router.get('/workouts', [
  query('category').optional().isIn(['cardio', 'strength', 'flexibility', 'yoga', 'dance', 'hiit', 'core', 'full_body']),
  query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
  query('language').optional().isIn(['english', 'swahili', 'luo', 'kikuyu']),
  query('featured').optional().isBoolean(),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('page').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      category,
      difficulty,
      language,
      featured,
      limit = 10,
      page = 1,
      search
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (language) filter.language = language;
    if (featured === 'true') filter.isFeatured = true;

    // Add search functionality
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await WorkoutPlan.countDocuments(filter);

    // Get workout plans
    const workouts = await WorkoutPlan.find(filter)
      .populate('createdBy', 'name')
      .sort({ isFeatured: -1, rating: -1, participants: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Transform data for frontend
    const transformedWorkouts = workouts.map(workout => ({
      id: workout._id,
      title: workout.title,
      description: workout.description,
      category: workout.category,
      difficulty: workout.difficulty,
      duration: workout.duration,
      totalExercises: workout.totalExercises,
      caloriesBurn: workout.caloriesBurn,
      image: workout.image,
      video: workout.video,
      instructor: workout.instructor,
      rating: workout.rating,
      participants: workout.participants,
      isFeatured: workout.isFeatured,
      language: workout.language,
      tags: workout.tags,
      targetMuscleGroups: workout.targetMuscleGroups,
      equipment: workout.equipment
    }));

    res.json({
      success: true,
      data: {
        workouts: transformedWorkouts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get workouts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/fitness/workouts/:id
// @desc    Get single workout plan by ID
// @access  Public
router.get('/workouts/:id', [
  param('id').isMongoId().withMessage('Invalid workout ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;

    const workout = await WorkoutPlan.findById(id)
      .populate('createdBy', 'name')
      .lean();

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout plan not found'
      });
    }

    if (!workout.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Workout plan is not available'
      });
    }

    // Increment participants count
    await WorkoutPlan.findByIdAndUpdate(id, { $inc: { participants: 1 } });

    res.json({
      success: true,
      data: {
        workout: {
          id: workout._id,
          title: workout.title,
          description: workout.description,
          category: workout.category,
          difficulty: workout.difficulty,
          duration: workout.duration,
          exercises: workout.exercises,
          totalExercises: workout.totalExercises,
          caloriesBurn: workout.caloriesBurn,
          image: workout.image,
          video: workout.video,
          instructor: workout.instructor,
          rating: workout.rating,
          participants: workout.participants + 1, // Include the current view
          isFeatured: workout.isFeatured,
          language: workout.language,
          tags: workout.tags,
          targetMuscleGroups: workout.targetMuscleGroups,
          equipment: workout.equipment,
          createdBy: workout.createdBy
        }
      }
    });
  } catch (error) {
    console.error('Get workout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/fitness/workouts/:id/rate
// @desc    Rate a workout plan
// @access  Private
router.post('/workouts/:id/rate', [
  optionalAuth,
  param('id').isMongoId().withMessage('Invalid workout ID'),
  body('rating')
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { rating } = req.body;

    const workout = await WorkoutPlan.findById(id);
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout plan not found'
      });
    }

    // Update rating
    await workout.updateRating(rating);

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        rating: workout.rating
      }
    });
  } catch (error) {
    console.error('Rate workout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/fitness/categories
// @desc    Get all workout categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      { id: 'cardio', name: 'Cardio', description: 'Cardiovascular exercises' },
      { id: 'strength', name: 'Strength Training', description: 'Muscle building exercises' },
      { id: 'flexibility', name: 'Flexibility', description: 'Stretching and mobility' },
      { id: 'yoga', name: 'Yoga', description: 'Mind-body exercises' },
      { id: 'dance', name: 'Dance Fitness', description: 'Rhythmic movement workouts' },
      { id: 'hiit', name: 'HIIT', description: 'High-intensity interval training' },
      { id: 'core', name: 'Core Training', description: 'Abdominal and core exercises' },
      { id: 'full_body', name: 'Full Body', description: 'Complete body workouts' }
    ];

    res.json({
      success: true,
      data: {
        categories
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/fitness/difficulties
// @desc    Get all difficulty levels
// @access  Public
router.get('/difficulties', async (req, res) => {
  try {
    const difficulties = [
      { id: 'beginner', name: 'Beginner', description: 'Suitable for beginners' },
      { id: 'intermediate', name: 'Intermediate', description: 'Moderate difficulty' },
      { id: 'advanced', name: 'Advanced', description: 'Challenging workouts' }
    ];

    res.json({
      success: true,
      data: {
        difficulties
      }
    });
  } catch (error) {
    console.error('Get difficulties error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/fitness/featured
// @desc    Get featured workout plans
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const featuredWorkouts = await WorkoutPlan.find({ 
      isFeatured: true, 
      isActive: true 
    })
      .populate('createdBy', 'name')
      .sort({ rating: -1, participants: -1 })
      .limit(6)
      .lean();

    const transformedWorkouts = featuredWorkouts.map(workout => ({
      id: workout._id,
      title: workout.title,
      description: workout.description,
      category: workout.category,
      difficulty: workout.difficulty,
      duration: workout.duration,
      totalExercises: workout.totalExercises,
      caloriesBurn: workout.caloriesBurn,
      image: workout.image,
      rating: workout.rating,
      participants: workout.participants
    }));

    res.json({
      success: true,
      data: {
        workouts: transformedWorkouts
      }
    });
  } catch (error) {
    console.error('Get featured workouts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/fitness/stats
// @desc    Get fitness platform statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const totalWorkouts = await WorkoutPlan.countDocuments({ isActive: true });
    const totalParticipants = await WorkoutPlan.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$participants' } } }
    ]);

    const categoryStats = await WorkoutPlan.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const difficultyStats = await WorkoutPlan.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalWorkouts,
        totalParticipants: totalParticipants[0]?.total || 0,
        categoryStats,
        difficultyStats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
