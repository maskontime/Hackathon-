const express = require('express');
const { query, param, body, validationResult } = require('express-validator');
const Meal = require('../models/Meal');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/nutrition/meals
// @desc    Get all meals with filtering
// @access  Public
router.get('/meals', [
  query('category').optional().isIn(['main_course', 'snack', 'beverage', 'traditional_medicine', 'natural_supplements', 'breakfast', 'lunch', 'dinner']),
  query('subcategory').optional().isIn(['ugali', 'nyama_choma', 'githeri', 'mukimo', 'mandazi', 'chai', 'herbal_tea', 'honey', 'moringa', 'neem', 'aloe_vera', 'bitter_leaf', 'sweet_wormwood']),
  query('language').optional().isIn(['english', 'swahili', 'luo', 'kikuyu']),
  query('featured').optional().isBoolean(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
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
      subcategory,
      language,
      featured,
      minPrice,
      maxPrice,
      limit = 10,
      page = 1,
      search
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (language) filter.language = language;
    if (featured === 'true') filter.isFeatured = true;

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Add search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'ingredients.name': { $regex: search, $options: 'i' } },
        { healthBenefits: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await Meal.countDocuments(filter);

    // Get meals
    const meals = await Meal.find(filter)
      .populate('createdBy', 'name')
      .sort({ isFeatured: -1, rating: -1, price: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Transform data for frontend
    const transformedMeals = meals.map(meal => ({
      id: meal._id,
      name: meal.name,
      description: meal.description,
      category: meal.category,
      subcategory: meal.subcategory,
      price: meal.price,
      currency: meal.currency,
      prepTime: meal.prepTime,
      servingSize: meal.servingSize,
      ingredients: meal.ingredients,
      nutrition: meal.nutrition,
      healthBenefits: meal.healthBenefits,
      traditionalUses: meal.traditionalUses,
      image: meal.image,
      images: meal.images,
      recipe: meal.recipe,
      allergens: meal.allergens,
      dietaryTags: meal.dietaryTags,
      origin: meal.origin,
      availability: meal.availability,
      supplier: meal.supplier,
      rating: meal.rating,
      isFeatured: meal.isFeatured,
      language: meal.language
    }));

    res.json({
      success: true,
      data: {
        meals: transformedMeals,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get meals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/nutrition/meals/:id
// @desc    Get single meal by ID
// @access  Public
router.get('/meals/:id', [
  param('id').isMongoId().withMessage('Invalid meal ID')
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

    const meal = await Meal.findById(id)
      .populate('createdBy', 'name')
      .populate('reviews.user', 'name')
      .lean();

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found'
      });
    }

    if (!meal.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Meal is not available'
      });
    }

    res.json({
      success: true,
      data: {
        meal: {
          id: meal._id,
          name: meal.name,
          description: meal.description,
          category: meal.category,
          subcategory: meal.subcategory,
          price: meal.price,
          currency: meal.currency,
          prepTime: meal.prepTime,
          servingSize: meal.servingSize,
          ingredients: meal.ingredients,
          nutrition: meal.nutrition,
          healthBenefits: meal.healthBenefits,
          traditionalUses: meal.traditionalUses,
          image: meal.image,
          images: meal.images,
          recipe: meal.recipe,
          allergens: meal.allergens,
          dietaryTags: meal.dietaryTags,
          origin: meal.origin,
          availability: meal.availability,
          supplier: meal.supplier,
          rating: meal.rating,
          reviews: meal.reviews,
          isFeatured: meal.isFeatured,
          language: meal.language,
          createdBy: meal.createdBy
        }
      }
    });
  } catch (error) {
    console.error('Get meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/nutrition/meals/:id/rate
// @desc    Rate a meal
// @access  Private
router.post('/meals/:id/rate', [
  optionalAuth,
  param('id').isMongoId().withMessage('Invalid meal ID'),
  body('rating')
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isString().trim()
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
    const { rating, comment } = req.body;

    const meal = await Meal.findById(id);
    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found'
      });
    }

    // Update rating
    await meal.updateRating(rating, req.user?.id, comment);

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        rating: meal.rating
      }
    });
  } catch (error) {
    console.error('Rate meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/nutrition/categories
// @desc    Get all meal categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      { id: 'main_course', name: 'Main Course', description: 'Traditional main dishes' },
      { id: 'snack', name: 'Snacks', description: 'Light snacks and treats' },
      { id: 'beverage', name: 'Beverages', description: 'Drinks and teas' },
      { id: 'traditional_medicine', name: 'Traditional Medicine', description: 'Herbal remedies' },
      { id: 'natural_supplements', name: 'Natural Supplements', description: 'Health supplements' },
      { id: 'breakfast', name: 'Breakfast', description: 'Morning meals' },
      { id: 'lunch', name: 'Lunch', description: 'Midday meals' },
      { id: 'dinner', name: 'Dinner', description: 'Evening meals' }
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

// @route   GET /api/nutrition/subcategories
// @desc    Get all meal subcategories
// @access  Public
router.get('/subcategories', async (req, res) => {
  try {
    const subcategories = [
      { id: 'ugali', name: 'Ugali', category: 'main_course' },
      { id: 'nyama_choma', name: 'Nyama Choma', category: 'main_course' },
      { id: 'githeri', name: 'Githeri', category: 'main_course' },
      { id: 'mukimo', name: 'Mukimo', category: 'main_course' },
      { id: 'mandazi', name: 'Mandazi', category: 'snack' },
      { id: 'chai', name: 'Chai', category: 'beverage' },
      { id: 'herbal_tea', name: 'Herbal Tea', category: 'beverage' },
      { id: 'honey', name: 'Honey', category: 'natural_supplements' },
      { id: 'moringa', name: 'Moringa', category: 'traditional_medicine' },
      { id: 'neem', name: 'Neem', category: 'traditional_medicine' },
      { id: 'aloe_vera', name: 'Aloe Vera', category: 'traditional_medicine' },
      { id: 'bitter_leaf', name: 'Bitter Leaf', category: 'traditional_medicine' },
      { id: 'sweet_wormwood', name: 'Sweet Wormwood', category: 'traditional_medicine' }
    ];

    res.json({
      success: true,
      data: {
        subcategories
      }
    });
  } catch (error) {
    console.error('Get subcategories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/nutrition/featured
// @desc    Get featured meals
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const featuredMeals = await Meal.find({ 
      isFeatured: true, 
      isActive: true 
    })
      .populate('createdBy', 'name')
      .sort({ rating: -1, price: 1 })
      .limit(8)
      .lean();

    const transformedMeals = featuredMeals.map(meal => ({
      id: meal._id,
      name: meal.name,
      description: meal.description,
      category: meal.category,
      subcategory: meal.subcategory,
      price: meal.price,
      currency: meal.currency,
      prepTime: meal.prepTime,
      image: meal.image,
      rating: meal.rating,
      availability: meal.availability
    }));

    res.json({
      success: true,
      data: {
        meals: transformedMeals
      }
    });
  } catch (error) {
    console.error('Get featured meals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/nutrition/traditional-medicine
// @desc    Get traditional medicine items
// @access  Public
router.get('/traditional-medicine', async (req, res) => {
  try {
    const traditionalMedicine = await Meal.find({ 
      category: 'traditional_medicine',
      isActive: true 
    })
      .populate('createdBy', 'name')
      .sort({ rating: -1, price: 1 })
      .lean();

    const transformedItems = traditionalMedicine.map(item => ({
      id: item._id,
      name: item.name,
      description: item.description,
      subcategory: item.subcategory,
      price: item.price,
      currency: item.currency,
      prepTime: item.prepTime,
      image: item.image,
      healthBenefits: item.healthBenefits,
      traditionalUses: item.traditionalUses,
      rating: item.rating,
      availability: item.availability
    }));

    res.json({
      success: true,
      data: {
        items: transformedItems
      }
    });
  } catch (error) {
    console.error('Get traditional medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/nutrition/stats
// @desc    Get nutrition platform statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const totalMeals = await Meal.countDocuments({ isActive: true });
    const totalReviews = await Meal.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$rating.count' } } }
    ]);

    const categoryStats = await Meal.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const subcategoryStats = await Meal.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$subcategory', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalMeals,
        totalReviews: totalReviews[0]?.total || 0,
        categoryStats,
        subcategoryStats
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
