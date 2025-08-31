const express = require('express');
const { body, param, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('phone').optional().matches(/^\+254\d{9}$/).withMessage('Please provide a valid Kenyan phone number'),
  body('location').optional().trim().notEmpty().withMessage('Location cannot be empty'),
  body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('emergencyContact.name').optional().trim().notEmpty().withMessage('Emergency contact name cannot be empty'),
  body('emergencyContact.phone').optional().matches(/^\+254\d{9}$/).withMessage('Please provide a valid Kenyan phone number'),
  body('emergencyContact.relationship').optional().trim().notEmpty().withMessage('Relationship cannot be empty')
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
      name,
      phone,
      location,
      dateOfBirth,
      gender,
      emergencyContact
    } = req.body;

    // Check if phone number is already taken by another user
    if (phone && phone !== req.user.phone) {
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is already registered'
        });
      }
    }

    // Update user profile
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (location) updateData.location = location;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (gender) updateData.gender = gender;
    if (emergencyContact) updateData.emergencyContact = emergencyContact;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/health-profile
// @desc    Update user health profile
// @access  Private
router.put('/health-profile', [
  auth,
  body('height').optional().isFloat({ min: 50, max: 300 }).withMessage('Height must be between 50 and 300 cm'),
  body('weight').optional().isFloat({ min: 20, max: 500 }).withMessage('Weight must be between 20 and 500 kg'),
  body('bloodType').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood type'),
  body('allergies').optional().isArray().withMessage('Allergies must be an array'),
  body('medicalConditions').optional().isArray().withMessage('Medical conditions must be an array'),
  body('medications').optional().isArray().withMessage('Medications must be an array')
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
      height,
      weight,
      bloodType,
      allergies,
      medicalConditions,
      medications
    } = req.body;

    // Update health profile
    const updateData = {};
    if (height !== undefined) updateData['healthProfile.height'] = height;
    if (weight !== undefined) updateData['healthProfile.weight'] = weight;
    if (bloodType) updateData['healthProfile.bloodType'] = bloodType;
    if (allergies) updateData['healthProfile.allergies'] = allergies;
    if (medicalConditions) updateData['healthProfile.medicalConditions'] = medicalConditions;
    if (medications) updateData['healthProfile.medications'] = medications;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    // Calculate BMI
    const bmi = updatedUser.calculateBMI();

    res.json({
      success: true,
      message: 'Health profile updated successfully',
      data: {
        user: updatedUser.getPublicProfile(),
        bmi
      }
    });
  } catch (error) {
    console.error('Update health profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', [
  auth,
  body('fitnessGoals').optional().isArray().withMessage('Fitness goals must be an array'),
  body('dietaryRestrictions').optional().isArray().withMessage('Dietary restrictions must be an array'),
  body('preferredLanguage').optional().isIn(['english', 'swahili', 'luo', 'kikuyu', 'other']).withMessage('Invalid language preference')
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
      fitnessGoals,
      dietaryRestrictions,
      preferredLanguage
    } = req.body;

    // Update preferences
    const updateData = {};
    if (fitnessGoals) updateData['preferences.fitnessGoals'] = fitnessGoals;
    if (dietaryRestrictions) updateData['preferences.dietaryRestrictions'] = dietaryRestrictions;
    if (preferredLanguage) updateData['preferences.preferredLanguage'] = preferredLanguage;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        user: updatedUser.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/users/upload-profile-image
// @desc    Upload profile image
// @access  Private
router.post('/upload-profile-image', auth, async (req, res) => {
  try {
    // This would typically handle file upload using multer
    // For now, we'll just update the profile image URL
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: imageUrl },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile image updated successfully',
      data: {
        user: updatedUser.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', [
  auth,
  body('password').notEmpty().withMessage('Password is required to delete account')
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

    const { password } = req.body;

    // Verify password
    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    // Deactivate account instead of deleting
    await User.findByIdAndUpdate(req.user.id, { isActive: false });

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/bmi
// @desc    Get user BMI
// @access  Private
router.get('/bmi', auth, async (req, res) => {
  try {
    const bmi = req.user.calculateBMI();

    res.json({
      success: true,
      data: {
        bmi,
        height: req.user.healthProfile.height,
        weight: req.user.healthProfile.weight,
        bmiCategory: getBMICategory(bmi)
      }
    });
  } catch (error) {
    console.error('Get BMI error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper function to get BMI category
function getBMICategory(bmi) {
  if (!bmi) return null;
  
  if (bmi < 18.5) return 'Underweight';
  if (bmi >= 18.5 && bmi < 25) return 'Normal weight';
  if (bmi >= 25 && bmi < 30) return 'Overweight';
  return 'Obese';
}

module.exports = router;
