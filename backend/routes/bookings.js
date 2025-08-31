const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const HealthProfessional = require('../models/HealthProfessional');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/', [
  auth,
  body('healthProfessionalId').isMongoId().withMessage('Invalid health professional ID'),
  body('appointmentDate').isISO8601().withMessage('Invalid appointment date'),
  body('appointmentTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid appointment time'),
  body('duration').optional().isInt({ min: 15, max: 180 }).withMessage('Duration must be between 15 and 180 minutes'),
  body('consultationType').isIn(['in_person', 'online', 'home_visit']).withMessage('Invalid consultation type'),
  body('service.name').optional().isString().trim(),
  body('service.price').optional().isFloat({ min: 0 }),
  body('symptoms').optional().isArray(),
  body('medicalHistory').optional().isString().trim(),
  body('currentMedications').optional().isArray(),
  body('allergies').optional().isArray(),
  body('specialInstructions').optional().isString().trim(),
  body('isUrgent').optional().isBoolean()
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
      healthProfessionalId,
      appointmentDate,
      appointmentTime,
      duration = 30,
      consultationType,
      service,
      symptoms,
      medicalHistory,
      currentMedications,
      allergies,
      specialInstructions,
      isUrgent = false
    } = req.body;

    // Check if health professional exists and is active
    const healthProfessional = await HealthProfessional.findById(healthProfessionalId);
    if (!healthProfessional || !healthProfessional.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Health professional not found or not available'
      });
    }

    // Check if appointment date is in the future
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    if (appointmentDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date and time must be in the future'
      });
    }

    // Check if professional is available at that time
    const dayOfWeek = appointmentDateTime.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const isAvailable = healthProfessional.isAvailable(dayOfWeek, appointmentTime);
    
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Health professional is not available at this time'
      });
    }

    // Check for conflicting bookings
    const conflictingBooking = await Booking.findOne({
      healthProfessional: healthProfessionalId,
      appointmentDate: appointmentDate,
      appointmentTime: appointmentTime,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    // Calculate amount
    const amount = service?.price || healthProfessional.consultationFee;

    // Create booking
    const booking = new Booking({
      user: req.user.id,
      healthProfessional: healthProfessionalId,
      appointmentDate: appointmentDate,
      appointmentTime: appointmentTime,
      duration,
      service,
      consultationType,
      symptoms,
      medicalHistory,
      currentMedications,
      allergies,
      specialInstructions,
      isUrgent,
      amount,
      createdBy: req.user.id
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking: booking.getSummary()
      }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/bookings
// @desc    Get user's bookings
// @access  Private
router.get('/', [
  auth,
  query('status').optional().isIn(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']),
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

    const { status, limit = 10, page = 1 } = req.query;

    // Build filter
    const filter = { user: req.user.id };
    if (status) filter.status = status;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const total = await Booking.countDocuments(filter);

    // Get bookings
    const bookings = await Booking.find(filter)
      .populate('healthProfessional', 'specialty consultationFee')
      .populate('healthProfessional.user', 'name')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const transformedBookings = bookings.map(booking => ({
      id: booking._id,
      bookingNumber: booking.bookingNumber,
      appointmentDate: booking.appointmentDate,
      appointmentTime: booking.appointmentTime,
      duration: booking.duration,
      consultationType: booking.consultationType,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      amount: booking.amount,
      currency: booking.currency,
      healthProfessional: {
        id: booking.healthProfessional._id,
        name: booking.healthProfessional.user.name,
        specialty: booking.healthProfessional.specialty
      }
    }));

    res.json({
      success: true,
      data: {
        bookings: transformedBookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking by ID
// @access  Private
router.get('/:id', [
  auth,
  param('id').isMongoId().withMessage('Invalid booking ID')
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

    const booking = await Booking.findOne({ _id: id, user: req.user.id })
      .populate('healthProfessional', 'specialty consultationFee')
      .populate('healthProfessional.user', 'name email phone')
      .lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: {
        booking: {
          id: booking._id,
          bookingNumber: booking.bookingNumber,
          appointmentDate: booking.appointmentDate,
          appointmentTime: booking.appointmentTime,
          duration: booking.duration,
          service: booking.service,
          consultationType: booking.consultationType,
          location: booking.location,
          address: booking.address,
          symptoms: booking.symptoms,
          medicalHistory: booking.medicalHistory,
          currentMedications: booking.currentMedications,
          allergies: booking.allergies,
          specialInstructions: booking.specialInstructions,
          isUrgent: booking.isUrgent,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          paymentMethod: booking.paymentMethod,
          amount: booking.amount,
          currency: booking.currency,
          paymentDetails: booking.paymentDetails,
          cancellationReason: booking.cancellationReason,
          cancellationDate: booking.cancellationDate,
          notes: booking.notes,
          followUp: booking.followUp,
          rating: booking.rating,
          notifications: booking.notifications,
          healthProfessional: {
            id: booking.healthProfessional._id,
            name: booking.healthProfessional.user.name,
            specialty: booking.healthProfessional.specialty,
            contact: booking.healthProfessional.user
          },
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.put('/:id/cancel', [
  auth,
  param('id').isMongoId().withMessage('Invalid booking ID'),
  body('reason').optional().isString().trim()
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
    const { reason } = req.body;

    const booking = await Booking.findOne({ _id: id, user: req.user.id });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (!booking.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be cancelled at this stage'
      });
    }

    await booking.cancelBooking(reason, 'user');

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        booking: booking.getSummary()
      }
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/bookings/:id/rate
// @desc    Rate a booking
// @access  Private
router.post('/:id/rate', [
  auth,
  param('id').isMongoId().withMessage('Invalid booking ID'),
  body('professionalRating').isFloat({ min: 1, max: 5 }).withMessage('Professional rating must be between 1 and 5'),
  body('serviceRating').isFloat({ min: 1, max: 5 }).withMessage('Service rating must be between 1 and 5'),
  body('overallRating').isFloat({ min: 1, max: 5 }).withMessage('Overall rating must be between 1 and 5'),
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
    const { professionalRating, serviceRating, overallRating, comment } = req.body;

    const booking = await Booking.findOne({ _id: id, user: req.user.id });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Booking must be completed before rating'
      });
    }

    await booking.addRating(professionalRating, serviceRating, overallRating, comment);

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        rating: booking.rating
      }
    });
  } catch (error) {
    console.error('Rate booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/bookings/upcoming
// @desc    Get upcoming bookings
// @access  Private
router.get('/upcoming', auth, async (req, res) => {
  try {
    const upcomingBookings = await Booking.find({
      user: req.user.id,
      status: 'confirmed',
      appointmentDate: { $gte: new Date() }
    })
      .populate('healthProfessional', 'specialty')
      .populate('healthProfessional.user', 'name')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .limit(5)
      .lean();

    const transformedBookings = upcomingBookings.map(booking => ({
      id: booking._id,
      bookingNumber: booking.bookingNumber,
      appointmentDate: booking.appointmentDate,
      appointmentTime: booking.appointmentTime,
      duration: booking.duration,
      consultationType: booking.consultationType,
      healthProfessional: {
        name: booking.healthProfessional.user.name,
        specialty: booking.healthProfessional.specialty
      }
    }));

    res.json({
      success: true,
      data: {
        bookings: transformedBookings
      }
    });
  } catch (error) {
    console.error('Get upcoming bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
