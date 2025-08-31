const express = require('express');
const { query, param, body, validationResult } = require('express-validator');
const HealthProfessional = require('../models/HealthProfessional');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/personnel/professionals
// @desc    Get all health professionals with filtering
// @access  Public
router.get('/professionals', [
  query('specialty').optional().isIn(['general_practitioner', 'clinical_nutritionist', 'physical_therapist', 'pediatrician', 'mental_health_counselor', 'personal_trainer', 'dermatologist', 'cardiologist', 'orthopedic', 'dentist', 'pharmacist', 'traditional_healer']),
  query('county').optional().isString(),
  query('verified').optional().isBoolean(),
  query('language').optional().isIn(['english', 'swahili', 'luo', 'kikuyu', 'kamba', 'kisii', 'other']),
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
      specialty,
      county,
      verified,
      language,
      limit = 10,
      page = 1,
      search
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (specialty) filter.specialty = specialty;
    if (county) filter['location.county'] = { $regex: county, $options: 'i' };
    if (verified === 'true') filter.isVerified = true;
    if (language) filter.languages = language;

    // Add search functionality
    if (search) {
      filter.$or = [
        { 'user.name': { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { specializations: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await HealthProfessional.countDocuments(filter);

    // Get professionals
    const professionals = await HealthProfessional.find(filter)
      .populate('user', 'name email phone')
      .sort({ isVerified: -1, rating: -1, 'experience.years': -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Transform data for frontend
    const transformedProfessionals = professionals.map(professional => ({
      id: professional._id,
      name: professional.user.name,
      specialty: professional.specialty,
      subSpecialty: professional.subSpecialty,
      experience: professional.experience.years,
      bio: professional.bio,
      consultationFee: professional.consultationFee,
      location: professional.location,
      contact: professional.contact,
      rating: professional.rating,
      profileImage: professional.profileImage,
      isVerified: professional.isVerified,
      availability: professional.availability,
      languages: professional.languages,
      services: professional.services,
      emergencyServices: professional.emergencyServices,
      homeVisits: professional.homeVisits,
      onlineConsultation: professional.onlineConsultation
    }));

    res.json({
      success: true,
      data: {
        professionals: transformedProfessionals,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get professionals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/personnel/professionals/:id
// @desc    Get single health professional by ID
// @access  Public
router.get('/professionals/:id', [
  param('id').isMongoId().withMessage('Invalid professional ID')
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

    const professional = await HealthProfessional.findById(id)
      .populate('user', 'name email phone')
      .populate('reviews.user', 'name')
      .lean();

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Health professional not found'
      });
    }

    if (!professional.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Health professional is not available'
      });
    }

    res.json({
      success: true,
      data: {
        professional: {
          id: professional._id,
          name: professional.user.name,
          specialty: professional.specialty,
          subSpecialty: professional.subSpecialty,
          experience: professional.experience,
          qualifications: professional.qualifications,
          licenses: professional.licenses,
          bio: professional.bio,
          services: professional.services,
          consultationFee: professional.consultationFee,
          availability: professional.availability,
          languages: professional.languages,
          location: professional.location,
          contact: professional.contact,
          rating: professional.rating,
          reviews: professional.reviews,
          profileImage: professional.profileImage,
          gallery: professional.gallery,
          certifications: professional.certifications,
          specializations: professional.specializations,
          insuranceAccepted: professional.insuranceAccepted,
          paymentMethods: professional.paymentMethods,
          emergencyServices: professional.emergencyServices,
          homeVisits: professional.homeVisits,
          onlineConsultation: professional.onlineConsultation,
          isVerified: professional.isVerified,
          verificationStatus: professional.verificationStatus,
          user: professional.user
        }
      }
    });
  } catch (error) {
    console.error('Get professional error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/personnel/professionals/:id/rate
// @desc    Rate a health professional
// @access  Private
router.post('/professionals/:id/rate', [
  optionalAuth,
  param('id').isMongoId().withMessage('Invalid professional ID'),
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

    const professional = await HealthProfessional.findById(id);
    if (!professional) {
      return res.status(404).json({
        success: false,
        message: 'Health professional not found'
      });
    }

    // Update rating
    await professional.updateRating(rating, req.user?.id, comment);

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        rating: professional.rating
      }
    });
  } catch (error) {
    console.error('Rate professional error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/personnel/specialties
// @desc    Get all specialties
// @access  Public
router.get('/specialties', async (req, res) => {
  try {
    const specialties = [
      { id: 'general_practitioner', name: 'General Practitioner', description: 'Primary healthcare provider' },
      { id: 'clinical_nutritionist', name: 'Clinical Nutritionist', description: 'Nutrition and dietary specialist' },
      { id: 'physical_therapist', name: 'Physical Therapist', description: 'Movement and rehabilitation specialist' },
      { id: 'pediatrician', name: 'Pediatrician', description: 'Child healthcare specialist' },
      { id: 'mental_health_counselor', name: 'Mental Health Counselor', description: 'Mental health and wellness' },
      { id: 'personal_trainer', name: 'Personal Trainer', description: 'Fitness and exercise specialist' },
      { id: 'dermatologist', name: 'Dermatologist', description: 'Skin and hair specialist' },
      { id: 'cardiologist', name: 'Cardiologist', description: 'Heart and cardiovascular specialist' },
      { id: 'orthopedic', name: 'Orthopedic', description: 'Bone and joint specialist' },
      { id: 'dentist', name: 'Dentist', description: 'Oral health specialist' },
      { id: 'pharmacist', name: 'Pharmacist', description: 'Medication specialist' },
      { id: 'traditional_healer', name: 'Traditional Healer', description: 'Traditional medicine practitioner' }
    ];

    res.json({
      success: true,
      data: {
        specialties
      }
    });
  } catch (error) {
    console.error('Get specialties error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/personnel/counties
// @desc    Get all counties
// @access  Public
router.get('/counties', async (req, res) => {
  try {
    const counties = [
      'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Nyeri',
      'Kakamega', 'Machakos', 'Kiambu', 'Murang\'a', 'Kirinyaga', 'Embu',
      'Meru', 'Isiolo', 'Marsabit', 'Garissa', 'Wajir', 'Mandera', 'Tana River',
      'Lamu', 'Kilifi', 'Kwale', 'Taita Taveta', 'Kajiado', 'Narok', 'Bomet',
      'Kericho', 'Baringo', 'Laikipia', 'Samburu', 'Turkana', 'West Pokot',
      'Trans Nzoia', 'Uasin Gishu', 'Elgeyo Marakwet', 'Nandi', 'Kericho',
      'Bomet', 'Nyamira', 'Kisii', 'Migori', 'Homa Bay', 'Siaya', 'Busia',
      'Vihiga', 'Bungoma', 'Trans Nzoia', 'Uasin Gishu', 'Elgeyo Marakwet'
    ];

    res.json({
      success: true,
      data: {
        counties: counties.sort()
      }
    });
  } catch (error) {
    console.error('Get counties error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/personnel/verified
// @desc    Get verified health professionals
// @access  Public
router.get('/verified', async (req, res) => {
  try {
    const verifiedProfessionals = await HealthProfessional.find({ 
      isVerified: true, 
      isActive: true 
    })
      .populate('user', 'name')
      .sort({ rating: -1, 'experience.years': -1 })
      .limit(10)
      .lean();

    const transformedProfessionals = verifiedProfessionals.map(professional => ({
      id: professional._id,
      name: professional.user.name,
      specialty: professional.specialty,
      experience: professional.experience.years,
      location: professional.location,
      consultationFee: professional.consultationFee,
      rating: professional.rating,
      profileImage: professional.profileImage,
      isVerified: professional.isVerified
    }));

    res.json({
      success: true,
      data: {
        professionals: transformedProfessionals
      }
    });
  } catch (error) {
    console.error('Get verified professionals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/personnel/emergency
// @desc    Get emergency service providers
// @access  Public
router.get('/emergency', async (req, res) => {
  try {
    const emergencyProfessionals = await HealthProfessional.find({ 
      emergencyServices: true,
      isActive: true 
    })
      .populate('user', 'name phone')
      .sort({ rating: -1 })
      .lean();

    const transformedProfessionals = emergencyProfessionals.map(professional => ({
      id: professional._id,
      name: professional.user.name,
      specialty: professional.specialty,
      contact: professional.contact,
      location: professional.location,
      rating: professional.rating,
      profileImage: professional.profileImage,
      isVerified: professional.isVerified
    }));

    res.json({
      success: true,
      data: {
        professionals: transformedProfessionals
      }
    });
  } catch (error) {
    console.error('Get emergency professionals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/personnel/stats
// @desc    Get personnel platform statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const totalProfessionals = await HealthProfessional.countDocuments({ isActive: true });
    const verifiedProfessionals = await HealthProfessional.countDocuments({ isVerified: true, isActive: true });
    const totalReviews = await HealthProfessional.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$rating.count' } } }
    ]);

    const specialtyStats = await HealthProfessional.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$specialty', count: { $sum: 1 } } }
    ]);

    const countyStats = await HealthProfessional.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$location.county', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalProfessionals,
        verifiedProfessionals,
        totalReviews: totalReviews[0]?.total || 0,
        specialtyStats,
        countyStats
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
