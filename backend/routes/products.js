const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const { auth, authorize } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with filtering and search
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const {
      category,
      brand,
      search,
      phase,
      minHp,
      maxHp,
      minPrice,
      maxPrice,
      page = 1,
      limit = 100,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (category) {
      filter.category = category;
    }

    if (brand) {
      filter.brand = brand;
    }

    if (phase) {
      filter.phase = phase;
    }

    if (minHp || maxHp) {
      filter.hp = {};
      if (minHp) filter.hp.$gte = Number(minHp);
      if (maxHp) filter.hp.$lte = Number(maxHp);
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Build query
    let query = Product.find(filter)
      .populate('category', 'name')
      .populate('brand', 'name')
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');

    // Add search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const searchFilter = {
        $or: [
          { modelNumber: searchRegex },
          { 'category.name': searchRegex },
          { 'brand.name': searchRegex }
        ]
      };
      
      // Use aggregation for complex search
      const aggregatePipeline = [
        { $match: filter },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand'
          }
        },
        { $unwind: '$category' },
        { $unwind: '$brand' },
        {
          $match: {
            $or: [
              { modelNumber: searchRegex },
              { outlet: searchRegex },
              { phase: searchRegex },
              { hp: isNaN(parseFloat(search)) ? null : parseFloat(search) },
              { maxHead: isNaN(parseFloat(search)) ? null : parseFloat(search) },
              { maxFlow: isNaN(parseFloat(search)) ? null : parseFloat(search) },
              { watt: isNaN(parseFloat(search)) ? null : parseFloat(search) },
              { price: isNaN(parseFloat(search)) ? null : parseFloat(search) },
              { 'category.name': searchRegex },
              { 'brand.name': searchRegex }
            ].filter(condition => condition !== null)
          }
        },
        { $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 } },
        { $skip: (page - 1) * limit },
        { $limit: parseInt(limit) }
      ];

      const products = await Product.aggregate(aggregatePipeline);
      const totalCount = await Product.aggregate([
        ...aggregatePipeline.slice(0, -2),
        { $count: 'total' }
      ]);

      return res.json({
        success: true,
        count: products.length,
        total: totalCount[0]?.total || 0,
        page: parseInt(page),
        pages: Math.ceil((totalCount[0]?.total || 0) / limit),
        data: products
      });
    }

    // Sort and paginate
    query = query
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const products = await query;
    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      count: products.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/products/check-model/:modelNumber/:phase
// @desc    Check if model number + phase combination exists in a category
// @access  Private
router.get('/check-model/:modelNumber/:phase', auth, async (req, res) => {
  try {
    const { modelNumber, phase } = req.params;
    const { category } = req.query; // Optional category filter
    
    const query = { 
      modelNumber: modelNumber.trim(),
      phase: phase,
      isActive: true 
    };
    
    if (category) {
      query.category = category;
    }
    
    const exists = await Product.findOne(query);
    
    res.json({
      success: true,
      exists: !!exists,
      modelNumber: modelNumber.trim(),
      phase: phase,
      category: category || 'all'
    });
  } catch (error) {
    console.error('Check model number + phase error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/products/check-model/:modelNumber
// @desc    Check if model number exists (shows all instances across categories)
// @access  Private
router.get('/check-model/:modelNumber', auth, async (req, res) => {
  try {
    const { modelNumber } = req.params;
    const { category } = req.query; // Optional category filter
    
    const query = { 
      modelNumber: modelNumber.trim(),
      isActive: true 
    };
    
    if (category) {
      query.category = category;
    }
    
    const products = await Product.find(query);
    
    res.json({
      success: true,
      exists: products.length > 0,
      count: products.length,
      phases: products.map(p => p.phase),
      modelNumber: modelNumber.trim()
    });
  } catch (error) {
    console.error('Check model number error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/products/category/:categoryId
// @desc    Get products by category
// @access  Private
router.get('/category/:categoryId', auth, async (req, res) => {
  try {
    const products = await Product.find({ 
      category: req.params.categoryId, 
      isActive: true 
    })
      .populate('category', 'name')
      .populate('brand', 'name')
      .populate('createdBy', 'username')
      .sort({ modelNumber: 1 });

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Admin, Project User)
router.post('/', [
  auth,
  authorize(['admin', 'project_user']),
  body('category').notEmpty().withMessage('Category is required'),
  body('brand').notEmpty().withMessage('Brand is required'),
  body('modelNumber').trim().notEmpty().withMessage('Model number is required'),
  body('price').if((value, { req }) => req.user.role === 'admin').isNumeric().withMessage('Price must be a number'),
  // Optional fields
  body('hp').optional().isNumeric().withMessage('HP must be a number'),
  body('outlet').optional().trim(),
  body('maxHead').optional().isNumeric().withMessage('Max head must be a number'),
  body('maxFlow').optional().isNumeric().withMessage('Max flow must be a number'),
  body('watt').optional().isNumeric().withMessage('Watt must be a number'),
  body('phase').optional().isIn(['1 Phase', '3 Phase']).withMessage('Phase must be 1 Phase or 3 Phase')
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

    const { category, brand, modelNumber, hp, outlet, maxHead, maxFlow, watt, phase, price } = req.body;

    // Verify category and brand exist
    const categoryExists = await Category.findById(category);
    const brandExists = await Brand.findById(brand);

    if (!categoryExists || !brandExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category or brand'
      });
    }

    const productData = {
      category,
      brand,
      modelNumber,
      createdBy: req.user._id
    };

    // Add optional fields only if provided
    if (hp !== undefined && hp !== '') productData.hp = Number(hp);
    if (outlet !== undefined && outlet !== '') productData.outlet = outlet;
    if (maxHead !== undefined && maxHead !== '') productData.maxHead = Number(maxHead);
    if (maxFlow !== undefined && maxFlow !== '') productData.maxFlow = Number(maxFlow);
    if (watt !== undefined && watt !== '') productData.watt = Number(watt);
    if (phase !== undefined && phase !== '') productData.phase = phase;

    // Only admin can set price
    if (req.user.role === 'admin') {
      productData.price = Number(price);
    } else {
      productData.price = 0; // Default price for project users
    }

    const product = new Product(productData);
    await product.save();
    await product.populate(['category', 'brand', 'createdBy']);

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    
    // Handle duplicate model number error
    if (error.code === 11000 && error.keyPattern && (error.keyPattern.modelNumber || error.keyPattern.phase)) {
      return res.status(400).json({
        success: false,
        message: `Product with model number "${req.body.modelNumber}" and phase "${req.body.phase}" already exists`
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Admin, Project User)
router.put('/:id', [
  auth,
  authorize(['admin', 'project_user']),
  body('category').optional().notEmpty().withMessage('Category cannot be empty'),
  body('brand').optional().notEmpty().withMessage('Brand cannot be empty'),
  body('modelNumber').optional().trim().notEmpty().withMessage('Model number cannot be empty'),
  body('hp').optional().isNumeric().withMessage('HP must be a number'),
  body('outlet').optional().trim().notEmpty().withMessage('Outlet cannot be empty'),
  body('maxHead').optional().isNumeric().withMessage('Max head must be a number'),
  body('maxFlow').optional().isNumeric().withMessage('Max flow must be a number'),
  body('watt').optional().isNumeric().withMessage('Watt must be a number'),
  body('phase').optional().isIn(['1 Phase', '3 Phase']).withMessage('Phase must be 1 Phase or 3 Phase'),
  body('price').if((value, { req }) => req.user.role === 'admin').optional().isNumeric().withMessage('Price must be a number')
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

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const { category, brand, modelNumber, hp, outlet, maxHead, maxFlow, watt, phase, price } = req.body;

    // Verify category and brand exist if provided
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
      }
      product.category = category;
    }

    if (brand) {
      const brandExists = await Brand.findById(brand);
      if (!brandExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid brand'
        });
      }
      product.brand = brand;
    }

    // Update other fields
    if (modelNumber) product.modelNumber = modelNumber;
    if (hp) product.hp = Number(hp);
    if (outlet) product.outlet = outlet;
    if (maxHead) product.maxHead = Number(maxHead);
    if (maxFlow) product.maxFlow = Number(maxFlow);
    if (watt) product.watt = Number(watt);
    if (phase) product.phase = phase;

    // Only admin can update price
    if (req.user.role === 'admin' && price !== undefined) {
      product.price = Number(price);
    }

    product.updatedBy = req.user._id;
    await product.save();
    await product.populate(['category', 'brand', 'updatedBy']);

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    
    // Handle duplicate model number error
    if (error.code === 11000 && error.keyPattern && (error.keyPattern.modelNumber || error.keyPattern.phase)) {
      return res.status(400).json({
        success: false,
        message: `Product with model number "${req.body.modelNumber}" and phase "${req.body.phase}" already exists`
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (Admin only) - Hard delete from database
// @access  Private (Admin)
router.delete('/:id', auth, authorize(['admin']), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Hard delete - completely remove from database
    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted permanently from database'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/products/bulk-delete
// @desc    Bulk delete products (Admin only) - Hard delete from database
// @access  Private (Admin)
router.post('/bulk-delete', auth, authorize(['admin']), async (req, res) => {
  try {
    const { productIds } = req.body;

    // Validation
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs array is required and cannot be empty'
      });
    }

    // Validate that all IDs are valid MongoDB ObjectIDs
    const mongoose = require('mongoose');
    const invalidIds = productIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid product IDs: ${invalidIds.join(', ')}`
      });
    }

    console.log(`🗑️ Bulk delete request for ${productIds.length} products by user: ${req.user.username}`);

    // Find products to be deleted (for logging and validation)
    const productsToDelete = await Product.find({
      _id: { $in: productIds },
      isActive: true
    }).populate('category', 'name').populate('brand', 'name');

    if (productsToDelete.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active products found with the provided IDs'
      });
    }

    console.log('📋 Products to be deleted:');
    productsToDelete.forEach(product => {
      console.log(`  - ${product.modelNumber} (${product.category.name} - ${product.brand.name})`);
    });

    // Perform bulk delete
    const deleteResult = await Product.deleteMany({
      _id: { $in: productIds },
      isActive: true
    });

    console.log(`✅ Bulk delete completed: ${deleteResult.deletedCount} products deleted`);

    // Return detailed response
    res.json({
      success: true,
      message: `Successfully deleted ${deleteResult.deletedCount} product(s) from database`,
      data: {
        requested: productIds.length,
        found: productsToDelete.length,
        deleted: deleteResult.deletedCount,
        deletedProducts: productsToDelete.map(product => ({
          id: product._id,
          modelNumber: product.modelNumber,
          category: product.category.name,
          brand: product.brand.name
        }))
      }
    });

  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk delete operation'
    });
  }
});

// @route   POST /api/products/check-duplicates
// @desc    Check if model numbers already exist in the database
// @access  Private
router.post('/check-duplicates', auth, async (req, res) => {
  try {
    const { modelNumbers, categoryId } = req.body;
    
    if (!modelNumbers || !Array.isArray(modelNumbers)) {
      return res.status(400).json({
        success: false,
        message: 'Model numbers array is required'
      });
    }

    // Find existing products with these model numbers
    const filter = {
      modelNumber: { $in: modelNumbers },
      isActive: true
    };

    // If category is specified, filter by category too
    if (categoryId) {
      filter.category = categoryId;
    }

    const existingProducts = await Product.find(filter).select('modelNumber phase');
    
    // Extract just the model numbers that exist
    const duplicates = existingProducts.map(product => product.modelNumber);
    
    res.json({
      success: true,
      duplicates: [...new Set(duplicates)], // Remove duplicates from the array
      existingProducts: existingProducts.map(p => ({
        modelNumber: p.modelNumber,
        phase: p.phase,
        id: p._id
      }))
    });

  } catch (error) {
    console.error('Check duplicates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking duplicates'
    });
  }
});

// @route   POST /api/products/bulk-upload
// @desc    Bulk upload products via Excel
// @access  Private (Admin, Project User)
router.post('/bulk-upload', 
  auth, 
  authorize(['admin', 'project_user']), 
  upload.single('file'), 
  handleMulterError,
  async (req, res) => {
    console.log('🔄 Bulk upload request received');
    console.log('📄 File info:', req.file ? 'File present' : 'No file');
    console.log('👤 User:', req.user ? req.user.username : 'No user');
    
    try {
      console.log('✅ Starting file validation...');
      if (!req.file) {
        console.log('❌ No file uploaded');
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      console.log('✅ Parsing Excel file...');
      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      console.log('✅ Excel parsed, rows:', data.length);

      if (data.length === 0) {
        console.log('❌ Excel file is empty');
        return res.status(400).json({
          success: false,
          message: 'Excel file is empty'
        });
      }

      console.log('✅ Validating headers...');
      // Validate header format - only require essential fields
      const requiredHeaders = ['category', 'brand', 'model number', 'price'];
      const actualHeaders = Object.keys(data[0]).map(h => h.toLowerCase().trim());
      
      console.log('Required headers:', requiredHeaders);
      console.log('Actual headers:', actualHeaders);
      
      const missingHeaders = requiredHeaders.filter(requiredHeader => {
        return !actualHeaders.some(actualHeader => {
          // More flexible matching for variations
          if (requiredHeader === 'model number') {
            return actualHeader.includes('model') && actualHeader.includes('number');
          }
          if (requiredHeader === 'price') {
            return actualHeader.includes('price');
          }
          return actualHeader.includes(requiredHeader);
        });
      });

      if (missingHeaders.length > 0) {
        console.log('❌ Missing headers:', missingHeaders);
        return res.status(400).json({
          success: false,
          message: `Missing required columns: ${missingHeaders.join(', ')}`
        });
      }

      console.log('✅ Fetching categories and brands...');
      // Get all categories and brands for mapping
      const categories = await Category.find({ isActive: true });
      const brands = await Brand.find({ isActive: true });
      
      console.log('✅ Found categories:', categories.length, 'brands:', brands.length);

      const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c._id]));
      const brandMap = new Map(brands.map(b => [b.name.toLowerCase(), b._id]));

      const results = {
        success: [],
        errors: [],
        total: data.length
      };

      console.log('✅ Processing rows...');
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNum = i + 2; // Excel row number (accounting for header)
        let productData = null; // Initialize to avoid reference error

        console.log(`🔄 Processing row ${rowNum}:`, row);

        try {
          // Map fields (case-insensitive and flexible)
          const getFieldValue = (fieldVariations) => {
            for (const variation of fieldVariations) {
              const value = row[variation];
              if (value !== undefined && value !== null && value !== '') {
                return String(value).trim();
              }
            }
            return null;
          };

          const categoryName = getFieldValue(['category', 'Category', 'CATEGORY']);
          const brandName = getFieldValue(['brand', 'Brand', 'BRAND']);
          const modelNumber = getFieldValue(['model number', 'Model Number', 'MODEL NUMBER', 'modelNumber', 'ModelNumber']);
          const hp = getFieldValue(['hp', 'HP', 'Hp', 'hP']);
          const outlet = getFieldValue(['outlet', 'Outlet', 'OUTLET']);
          const maxHead = getFieldValue(['max head', 'Max Head', 'MAX HEAD', 'maxHead', 'MaxHead']);
          const maxFlow = getFieldValue(['max flow', 'Max Flow', 'MAX FLOW', 'maxFlow', 'MaxFlow']);
          const watt = getFieldValue(['watt', 'Watt', 'WATT']);
          const phase = getFieldValue(['phase', 'Phase', 'PHASE']);
          const price = getFieldValue(['price (rs.)', 'Price (Rs.)', 'PRICE (RS.)', 'price', 'Price', 'PRICE']);

          console.log(`Row ${rowNum} extracted values:`, {
            categoryName, brandName, modelNumber, hp, outlet, maxHead, maxFlow, watt, phase, price
          });

          // Validate required fields (only essential ones)
          if (!categoryName || !brandName || !modelNumber) {
            const errorMsg = 'Missing required fields (category, brand, model number)';
            console.log(`❌ Row ${rowNum} error:`, errorMsg);
            results.errors.push({
              row: rowNum,
              error: errorMsg
            });
            continue;
          }

          // Find category and brand IDs
          const categoryId = categoryMap.get(categoryName.toLowerCase());
          const brandId = brandMap.get(brandName.toLowerCase());

          if (!categoryId) {
            const errorMsg = `Category '${categoryName}' not found`;
            console.log(`❌ Row ${rowNum} error:`, errorMsg);
            results.errors.push({
              row: rowNum,
              error: errorMsg
            });
            continue;
          }

          if (!brandId) {
            const errorMsg = `Brand '${brandName}' not found`;
            console.log(`❌ Row ${rowNum} error:`, errorMsg);
            results.errors.push({
              row: rowNum,
              error: errorMsg
            });
            continue;
          }

          // Validate phase if provided
          if (phase && !['1 Phase', '3 Phase'].includes(phase)) {
            const errorMsg = 'Phase must be "1 Phase" or "3 Phase"';
            console.log(`❌ Row ${rowNum} error:`, errorMsg);
            results.errors.push({
              row: rowNum,
              error: errorMsg
            });
            continue;
          }

          productData = {
            category: categoryId,
            brand: brandId,
            modelNumber: String(modelNumber).trim(),
            createdBy: req.user._id
          };

          // Add optional fields only if provided
          if (hp) productData.hp = Number(hp);
          if (outlet) productData.outlet = String(outlet).trim();
          if (maxHead) productData.maxHead = Number(maxHead);
          if (maxFlow) productData.maxFlow = Number(maxFlow);
          if (watt) productData.watt = Number(watt);
          if (phase) productData.phase = phase;

          // Handle price based on user role
          if (req.user.role === 'admin') {
            productData.price = Number(price) || 0;
          } else {
            // Project users cannot set price via upload
            productData.price = 0;
          }

          // Check if product with same model number, category, brand, and phase already exists
          const existingProduct = await Product.findOne({ 
            modelNumber: String(modelNumber).trim(),
            category: categoryId,
            brand: brandId,
            phase: phase || '',
            isActive: true 
          });

          if (existingProduct) {
            // If product exists with same model number, update price or other fields
            if (req.user.role === 'admin' && price && Number(price) !== existingProduct.price) {
              // Update price for existing product
              existingProduct.price = Number(price);
              
              // Update other fields if provided
              if (hp) existingProduct.hp = Number(hp);
              if (outlet) existingProduct.outlet = String(outlet).trim();
              if (maxHead) existingProduct.maxHead = Number(maxHead);
              if (maxFlow) existingProduct.maxFlow = Number(maxFlow);
              if (watt) existingProduct.watt = Number(watt);
              if (phase) existingProduct.phase = phase;
              
              existingProduct.updatedBy = req.user._id;
              await existingProduct.save();

              console.log(`✅ Row ${rowNum} success: Price updated for existing product ${productData.modelNumber} from ${existingProduct.price} to ${Number(price)}`);
              results.success.push({
                row: rowNum,
                modelNumber: productData.modelNumber,
                action: 'price_updated',
                oldPrice: existingProduct.price,
                newPrice: Number(price)
              });
            } else if (req.user.role !== 'admin') {
              // Project users can update other fields but not price
              if (hp) existingProduct.hp = Number(hp);
              if (outlet) existingProduct.outlet = String(outlet).trim();
              if (maxHead) existingProduct.maxHead = Number(maxHead);
              if (maxFlow) existingProduct.maxFlow = Number(maxFlow);
              if (watt) existingProduct.watt = Number(watt);
              if (phase) existingProduct.phase = phase;
              
              existingProduct.updatedBy = req.user._id;
              await existingProduct.save();

              console.log(`✅ Row ${rowNum} success: Product details updated for existing product ${productData.modelNumber}`);
              results.success.push({
                row: rowNum,
                modelNumber: productData.modelNumber,
                action: 'details_updated'
              });
            } else {
              // Same price, no update needed
              console.log(`ℹ️ Row ${rowNum} skipped: Product ${productData.modelNumber} already exists with same price`);
              results.success.push({
                row: rowNum,
                modelNumber: productData.modelNumber,
                action: 'no_change_needed'
              });
            }
          } else {
            // Create new product if it doesn't exist
            const product = new Product(productData);
            await product.save();

            console.log(`✅ Row ${rowNum} success: New product ${productData.modelNumber} created`);
            results.success.push({
              row: rowNum,
              modelNumber: productData.modelNumber,
              action: 'created'
            });
          }

        } catch (error) {
          let errorMessage = error.message;
          
          // Handle other validation errors (not duplicate model number since we handle that above)
          if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            errorMessage = messages.join(', ');
          }
          
          console.log(`❌ Row ${rowNum} error:`, errorMessage);
          results.errors.push({
            row: rowNum,
            error: errorMessage
          });
        }
      }

      console.log('📊 Final results:', {
        total: results.total,
        success: results.success.length,
        errors: results.errors.length,
        actions: {
          created: results.success.filter(s => s.action === 'created').length,
          priceUpdated: results.success.filter(s => s.action === 'price_updated').length,
          detailsUpdated: results.success.filter(s => s.action === 'details_updated').length,
          noChangeNeeded: results.success.filter(s => s.action === 'no_change_needed').length
        },
        errorDetails: results.errors
      });

      // Create detailed success message
      const actionCounts = {
        created: results.success.filter(s => s.action === 'created').length,
        priceUpdated: results.success.filter(s => s.action === 'price_updated').length,
        detailsUpdated: results.success.filter(s => s.action === 'details_updated').length,
        noChangeNeeded: results.success.filter(s => s.action === 'no_change_needed').length
      };

      let successMessage = `Bulk upload completed. `;
      const messageParts = [];
      
      if (actionCounts.created > 0) messageParts.push(`${actionCounts.created} new products created`);
      if (actionCounts.priceUpdated > 0) messageParts.push(`${actionCounts.priceUpdated} prices updated`);
      if (actionCounts.detailsUpdated > 0) messageParts.push(`${actionCounts.detailsUpdated} product details updated`);
      if (actionCounts.noChangeNeeded > 0) messageParts.push(`${actionCounts.noChangeNeeded} products unchanged`);
      
      successMessage += messageParts.join(', ');
      if (results.errors.length > 0) successMessage += `, ${results.errors.length} errors`;

      res.json({
        success: true,
        message: successMessage,
        data: {
          ...results,
          summary: actionCounts
        }
      });

    } catch (error) {
      console.error('❌ Bulk upload error:', error);
      console.error('❌ Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Server error during bulk upload',
        error: error.message
      });
    }
  }
);

// @route   GET /api/products/download-template
// @desc    Download Excel template with dropdowns
// @access  Private
router.get('/download-template', auth, async (req, res) => {
  try {
    // Fetch categories and brands from database
    const categories = await Category.find({ isActive: true }).select('name').sort({ name: 1 });
    const brands = await Brand.find({ isActive: true }).select('name').sort({ name: 1 });

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    
    // Create Instructions sheet first
    const instructionsSheet = workbook.addWorksheet('Instructions');
    
    // Add instructions content
    instructionsSheet.columns = [
      { header: 'Instructions for Bulk Product Upload', key: 'instruction', width: 80 }
    ];

    const instructions = [
      '',
      '📋 SIMPLIFIED BULK UPLOAD:',
      '',
      '✅ REQUIRED FIELDS ONLY: Only Category, Brand, Model Number, and Price are required.',
      '   All other fields (HP, Outlet, Max Head, Max Flow, Watt, Phase) are optional.',
      '',
      '✅ PRICE UPDATES: If a model number already exists but with a different price,',
      '   only the price will be updated (Admin users only).',
      '',
      '✅ DETAIL UPDATES: Project users can update product details (except price)',
      '   for existing products.',
      '',
      '✅ FLEXIBLE UPLOAD: You can upload just the essential information or include',
      '   detailed specifications as needed.',
      '',
      '⚠️  IMPORTANT NOTES:',
      '',
      '• REQUIRED: Category, Brand, Model Number, Price',
      '• OPTIONAL: HP, Outlet, Max Head, Max Flow, Watt, Phase',
      '• Model numbers must be unique within the system',
      '• Phase (if provided) must be exactly "1 Phase" or "3 Phase"',
      '• All numeric fields must be positive numbers',
      '• Category and Brand must exist in the system (use dropdowns)',
      '• Admin users can set/update prices, Project users cannot',
      '',
      '📊 UPLOAD RESULTS:',
      '',
      '• You will see a summary showing:',
      '  - How many new products were created',
      '  - How many prices were updated',
      '  - How many product details were updated',
      '  - Any errors that occurred during upload',
      '',
      '🔄 PROCESS:',
      '',
      '1. Fill in the required fields: Category, Brand, Model Number, Price',
      '2. Add optional fields if you have detailed specifications',
      '3. Use dropdown menus for Category and Brand',
      '4. Save the file and upload it through the application',
      '5. Review the upload results for any errors',
      '',
      '💡 TIP: You can start with just the basic information and add details later.',
      '💡 TIP: See sample data showing both minimal and detailed product entries.'
    ];

    instructions.forEach((instruction, index) => {
      const row = instructionsSheet.addRow({ instruction });
      if (instruction.includes('📋') || instruction.includes('⚠️') || instruction.includes('📊') || instruction.includes('🔄')) {
        row.font = { bold: true, size: 12 };
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F8FF' }
        };
      }
    });

    // Style the instructions sheet
    instructionsSheet.getCell('A1').font = { bold: true, size: 14 };
    instructionsSheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    instructionsSheet.getCell('A1').font.color = { argb: 'FFFFFFFF' };

    // Now create the main Products worksheet
    const worksheet = workbook.addWorksheet('Products');

    // Define the columns - only required fields, others optional
    worksheet.columns = [
      { header: 'category', key: 'category', width: 15 },
      { header: 'brand', key: 'brand', width: 15 },
      { header: 'model number', key: 'modelNumber', width: 20 },
      { header: 'price (rs.)', key: 'price', width: 15 },
      // Optional fields
      { header: 'hp', key: 'hp', width: 10 },
      { header: 'outlet', key: 'outlet', width: 12 },
      { header: 'max head', key: 'maxHead', width: 15 },
      { header: 'max flow', key: 'maxFlow', width: 15 },
      { header: 'watt', key: 'watt', width: 10 },
      { header: 'phase', key: 'phase', width: 12 }
    ];

    // Add sample data rows - showing required fields only and with optional fields
    worksheet.addRow({
      category: categories.length > 0 ? categories[0].name : 'Submersible',
      brand: brands.length > 0 ? brands[0].name : 'Pentax',
      modelNumber: 'SUB-001',
      price: 15000
      // Optional fields can be left empty or filled
    });

    worksheet.addRow({
      category: categories.length > 0 ? categories[0].name : 'Submersible',
      brand: brands.length > 0 ? brands[0].name : 'Pentax',
      modelNumber: 'SUB-002',
      price: 17000,
      // Example with optional fields filled
      hp: 1,
      outlet: '1 inch',
      maxHead: 50,
      maxFlow: 120,
      watt: 750,
      phase: '1 Phase'
    });

    worksheet.addRow({
      category: categories.length > 1 ? categories[1].name : 'Centrifugal',
      brand: brands.length > 1 ? brands[1].name : 'Deep Tec',
      modelNumber: 'CENT-001',
      price: 25000
      // Only required fields - optional fields empty
    });

    // Add more empty rows for data entry (rows 4-100)
    for (let i = 4; i <= 100; i++) {
      worksheet.addRow({});
    }

    // Create category dropdown validation
    if (categories.length > 0) {
      const categoryNames = categories.map(cat => cat.name);
      worksheet.dataValidations.add('A2:A100', {
        type: 'list',
        allowBlank: false,
        formulae: [`"${categoryNames.join(',')}"`],
        showErrorMessage: true,
        errorTitle: 'Invalid Category',
        error: 'Please select a category from the dropdown list.'
      });
    }

    // Create brand dropdown validation
    if (brands.length > 0) {
      const brandNames = brands.map(brand => brand.name);
      worksheet.dataValidations.add('B2:B100', {
        type: 'list',
        allowBlank: false,
        formulae: [`"${brandNames.join(',')}"`],
        showErrorMessage: true,
        errorTitle: 'Invalid Brand',
        error: 'Please select a brand from the dropdown list.'
      });
    }

    // Create phase dropdown validation (column J - optional)
    worksheet.dataValidations.add('J2:J100', {
      type: 'list',
      allowBlank: true, // Make phase optional
      formulae: ['"1 Phase,3 Phase"'],
      showErrorMessage: true,
      errorTitle: 'Invalid Phase',
      error: 'Please select either "1 Phase" or "3 Phase" or leave blank.'
    });

    // Add number validation for numeric fields (all optional except price)
    worksheet.dataValidations.add('D2:D100', { // price (required)
      type: 'decimal',
      operator: 'greaterThan',
      formulae: [0],
      allowBlank: false,
      showErrorMessage: true,
      errorTitle: 'Invalid Price',
      error: 'Price is required and must be greater than 0.'
    });

    worksheet.dataValidations.add('E2:E100', { // hp (optional)
      type: 'decimal',
      operator: 'greaterThanOrEqual',
      formulae: [0],
      allowBlank: true,
      showErrorMessage: true,
      errorTitle: 'Invalid HP',
      error: 'HP must be a positive number or leave blank.'
    });

    worksheet.dataValidations.add('G2:G100', { // max head (optional)
      type: 'decimal',
      operator: 'greaterThanOrEqual',
      formulae: [0],
      allowBlank: true,
      showErrorMessage: true,
      errorTitle: 'Invalid Max Head',
      error: 'Max Head must be a positive number or leave blank.'
    });

    worksheet.dataValidations.add('H2:H100', { // max flow (optional)
      type: 'decimal',
      operator: 'greaterThanOrEqual',
      formulae: [0],
      allowBlank: true,
      showErrorMessage: true,
      errorTitle: 'Invalid Max Flow',
      error: 'Max Flow must be a positive number or leave blank.'
    });

    worksheet.dataValidations.add('I2:I100', { // watt (optional)
      type: 'whole',
      operator: 'greaterThanOrEqual',
      formulae: [0],
      allowBlank: true,
      showErrorMessage: true,
      errorTitle: 'Invalid Watt',
      error: 'Watt must be a positive whole number or leave blank.'
    });

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add borders to all cells with data
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 100) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });

    // Freeze the header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Set response headers
    res.setHeader('Content-Disposition', 'attachment; filename=product-template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(buffer);
  } catch (error) {
    console.error('Download template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/products/export
// @desc    Export filtered products to Excel
// @access  Private
router.get('/export', auth, async (req, res) => {
  try {
    const {
      category,
      brand,
      search,
      phase,
      minHp,
      maxHp,
      minPrice,
      maxPrice
    } = req.query;

    // Build filter (same as GET /api/products)
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (phase) filter.phase = phase;

    if (minHp || maxHp) {
      filter.hp = {};
      if (minHp) filter.hp.$gte = Number(minHp);
      if (maxHp) filter.hp.$lte = Number(maxHp);
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let products;

    if (search) {
      // Use aggregation for search
      const searchRegex = new RegExp(search, 'i');
      products = await Product.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand'
          }
        },
        { $unwind: '$category' },
        { $unwind: '$brand' },
        {
          $match: {
            $or: [
              { modelNumber: searchRegex },
              { outlet: searchRegex },
              { phase: searchRegex },
              { hp: isNaN(parseFloat(search)) ? null : parseFloat(search) },
              { maxHead: isNaN(parseFloat(search)) ? null : parseFloat(search) },
              { maxFlow: isNaN(parseFloat(search)) ? null : parseFloat(search) },
              { watt: isNaN(parseFloat(search)) ? null : parseFloat(search) },
              { price: isNaN(parseFloat(search)) ? null : parseFloat(search) },
              { 'category.name': searchRegex },
              { 'brand.name': searchRegex }
            ].filter(condition => condition !== null)
          }
        },
        { $sort: { modelNumber: 1 } }
      ]);
    } else {
      products = await Product.find(filter)
        .populate('category', 'name')
        .populate('brand', 'name')
        .sort({ modelNumber: 1 });
    }

    // Format data for Excel
    const excelData = products.map(product => ({
      'Category': product.category.name,
      'Brand': product.brand.name,
      'Model Number': product.modelNumber,
      'HP': product.hp,
      'Outlet': product.outlet,
      'Max Head': product.maxHead,
      'Max Flow': product.maxFlow,
      'Watt': product.watt,
      'Phase': product.phase,
      'Price (Rs.)': req.user.role === 'employee' ? 'N/A' : product.price
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, 'Products');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    const filename = `products-export-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(buffer);
  } catch (error) {
    console.error('Export products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;