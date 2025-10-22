const express = require('express');
const { body, validationResult } = require('express-validator');
const Brand = require('../models/Brand');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/brands
// @desc    Get all brands
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true })
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: brands.length,
      data: brands
    });
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/brands
// @desc    Create new brand (Admin only)
// @access  Private (Admin)
router.post('/', [
  auth,
  authorize(['admin']),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Brand name is required')
    .isLength({ max: 100 })
    .withMessage('Brand name cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description } = req.body;

    // Check if active brand already exists (ignore soft-deleted brands)
    const existingBrand = await Brand.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      isActive: true
    });
    
    if (existingBrand) {
      return res.status(400).json({
        success: false,
        message: 'Brand already exists'
      });
    }

    const brand = new Brand({
      name,
      description,
      createdBy: req.user._id
    });

    await brand.save();
    await brand.populate('createdBy', 'username');

    res.status(201).json({
      success: true,
      data: brand
    });
  } catch (error) {
    console.error('Create brand error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/brands/:id
// @desc    Update brand (Admin only)
// @access  Private (Admin)
router.put('/:id', [
  auth,
  authorize(['admin']),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Brand name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Brand name cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }

    const { name, description } = req.body;

    // Check if new name is taken by another active brand (ignore soft-deleted brands)
    if (name && name !== brand.name) {
      const existingBrand = await Brand.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: brand._id },
        isActive: true
      });
      
      if (existingBrand) {
        return res.status(400).json({
          success: false,
          message: 'Brand name already exists'
        });
      }
      brand.name = name;
    }

    if (description !== undefined) {
      brand.description = description;
    }

    brand.updatedBy = req.user._id;
    await brand.save();
    await brand.populate('updatedBy', 'username');

    res.json({
      success: true,
      data: brand
    });
  } catch (error) {
    console.error('Update brand error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/brands/:id
// @desc    Delete brand (Admin only)
// @access  Private (Admin)
router.delete('/:id', auth, authorize(['admin']), async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }

    // Soft delete
    brand.isActive = false;
    brand.updatedBy = req.user._id;
    await brand.save();

    res.json({
      success: true,
      message: 'Brand deleted successfully'
    });
  } catch (error) {
    console.error('Delete brand error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;