const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Meal = require('../models/Meal');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private
router.post('/', [
  auth,
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.mealId').isMongoId().withMessage('Invalid meal ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('deliveryAddress.street').notEmpty().withMessage('Street address is required'),
  body('deliveryAddress.city').notEmpty().withMessage('City is required'),
  body('deliveryAddress.county').notEmpty().withMessage('County is required'),
  body('contactInfo.name').notEmpty().withMessage('Contact name is required'),
  body('contactInfo.phone').notEmpty().withMessage('Contact phone is required'),
  body('paymentMethod').isIn(['mpesa', 'cash_on_delivery', 'bank_transfer', 'credit_card']).withMessage('Invalid payment method')
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
      items,
      deliveryAddress,
      contactInfo,
      paymentMethod,
      specialInstructions,
      allergies,
      dietaryRestrictions
    } = req.body;

    // Validate meals exist and are available
    const mealIds = items.map(item => item.mealId);
    const meals = await Meal.find({ _id: { $in: mealIds }, isActive: true });

    if (meals.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: 'Some meals are not available'
      });
    }

    // Create order items with prices
    const orderItems = items.map(item => {
      const meal = meals.find(m => m._id.toString() === item.mealId);
      return {
        meal: item.mealId,
        quantity: item.quantity,
        price: meal.price,
        totalPrice: meal.price * item.quantity,
        specialInstructions: item.specialInstructions
      };
    });

    // Calculate totals
    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const deliveryFee = subtotal > 1000 ? 0 : 200; // Free delivery for orders over 1000
    const tax = subtotal * 0.16; // 16% VAT
    const total = subtotal + deliveryFee + tax;

    // Create order
    const order = new Order({
      user: req.user.id,
      items: orderItems,
      subtotal,
      deliveryFee,
      tax,
      total,
      deliveryAddress,
      contactInfo,
      paymentMethod,
      specialInstructions,
      allergies,
      dietaryRestrictions,
      createdBy: req.user.id
    });

    await order.save();

    // Calculate delivery time
    await order.calculateDeliveryTime();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: order.getSummary()
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', [
  auth,
  query('status').optional().isIn(['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']),
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
    if (status) filter.orderStatus = status;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const total = await Order.countDocuments(filter);

    // Get orders
    const orders = await Order.find(filter)
      .populate('items.meal', 'name image price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const transformedOrders = orders.map(order => ({
      id: order._id,
      orderNumber: order.orderNumber,
      items: order.items,
      total: order.total,
      currency: order.currency,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      deliveryAddress: order.deliveryAddress,
      deliveryTime: order.deliveryTime,
      createdAt: order.createdAt
    }));

    res.json({
      success: true,
      data: {
        orders: transformedOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order by ID
// @access  Private
router.get('/:id', [
  auth,
  param('id').isMongoId().withMessage('Invalid order ID')
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

    const order = await Order.findOne({ _id: id, user: req.user.id })
      .populate('items.meal', 'name image price description')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          items: order.items,
          subtotal: order.subtotal,
          deliveryFee: order.deliveryFee,
          tax: order.tax,
          total: order.total,
          currency: order.currency,
          deliveryAddress: order.deliveryAddress,
          contactInfo: order.contactInfo,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          deliveryTime: order.deliveryTime,
          deliveryPerson: order.deliveryPerson,
          specialInstructions: order.specialInstructions,
          allergies: order.allergies,
          dietaryRestrictions: order.dietaryRestrictions,
          rating: order.rating,
          notifications: order.notifications,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel an order
// @access  Private
router.put('/:id/cancel', [
  auth,
  param('id').isMongoId().withMessage('Invalid order ID'),
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

    const order = await Order.findOne({ _id: id, user: req.user.id });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    order.orderStatus = 'cancelled';
    order.cancellationReason = reason;
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        order: order.getSummary()
      }
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/orders/:id/rate
// @desc    Rate an order
// @access  Private
router.post('/:id/rate', [
  auth,
  param('id').isMongoId().withMessage('Invalid order ID'),
  body('foodRating').isFloat({ min: 1, max: 5 }).withMessage('Food rating must be between 1 and 5'),
  body('deliveryRating').isFloat({ min: 1, max: 5 }).withMessage('Delivery rating must be between 1 and 5'),
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
    const { foodRating, deliveryRating, overallRating, comment } = req.body;

    const order = await Order.findOne({ _id: id, user: req.user.id });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Order must be delivered before rating'
      });
    }

    await order.addRating(foodRating, deliveryRating, overallRating, comment);

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        rating: order.rating
      }
    });
  } catch (error) {
    console.error('Rate order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/orders/tracking/:orderNumber
// @desc    Track order by order number
// @access  Private
router.get('/tracking/:orderNumber', [
  auth,
  param('orderNumber').notEmpty().withMessage('Order number is required')
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

    const { orderNumber } = req.params;

    const order = await Order.findOne({ orderNumber, user: req.user.id })
      .populate('items.meal', 'name image')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Create tracking timeline
    const timeline = [
      {
        status: 'order_placed',
        title: 'Order Placed',
        description: 'Your order has been placed successfully',
        time: order.createdAt,
        completed: true
      },
      {
        status: 'order_confirmed',
        title: 'Order Confirmed',
        description: 'Your order has been confirmed',
        time: order.orderStatus === 'confirmed' ? order.updatedAt : null,
        completed: ['confirmed', 'preparing', 'out_for_delivery', 'delivered'].includes(order.orderStatus)
      },
      {
        status: 'preparing',
        title: 'Preparing',
        description: 'Your order is being prepared',
        time: order.orderStatus === 'preparing' ? order.updatedAt : null,
        completed: ['preparing', 'out_for_delivery', 'delivered'].includes(order.orderStatus)
      },
      {
        status: 'out_for_delivery',
        title: 'Out for Delivery',
        description: 'Your order is on its way',
        time: order.orderStatus === 'out_for_delivery' ? order.updatedAt : null,
        completed: ['out_for_delivery', 'delivered'].includes(order.orderStatus)
      },
      {
        status: 'delivered',
        title: 'Delivered',
        description: 'Your order has been delivered',
        time: order.orderStatus === 'delivered' ? order.deliveryTime?.actual : null,
        completed: order.orderStatus === 'delivered'
      }
    ];

    res.json({
      success: true,
      data: {
        order: {
          orderNumber: order.orderNumber,
          status: order.orderStatus,
          estimatedDelivery: order.deliveryTime?.estimated,
          actualDelivery: order.deliveryTime?.actual,
          deliveryPerson: order.deliveryPerson,
          items: order.items
        },
        timeline
      }
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
