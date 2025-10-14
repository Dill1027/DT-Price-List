const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const { auth, authorize } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');
const XLSX = require('xlsx');

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
      limit = 20,
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

// @route   GET /api/products/check-model/:modelNumber
// @desc    Check if model number exists
// @access  Private
router.get('/check-model/:modelNumber', auth, async (req, res) => {
  try {
    const { modelNumber } = req.params;
    const exists = await Product.findOne({ modelNumber: modelNumber.trim() });
    
    res.json({
      success: true,
      exists: !!exists,
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
  body('hp').isNumeric().withMessage('HP must be a number'),
  body('outlet').trim().notEmpty().withMessage('Outlet is required'),
  body('maxHead').isNumeric().withMessage('Max head must be a number'),
  body('watt').isNumeric().withMessage('Watt must be a number'),
  body('phase').isIn(['1 Phase', '3 Phase']).withMessage('Phase must be 1 Phase or 3 Phase'),
  body('price').if((value, { req }) => req.user.role === 'admin').isNumeric().withMessage('Price must be a number')
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

    const { category, brand, modelNumber, hp, outlet, maxHead, watt, phase, price } = req.body;

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
      hp: Number(hp),
      outlet,
      maxHead: Number(maxHead),
      watt: Number(watt),
      phase,
      createdBy: req.user._id
    };

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
    if (error.code === 11000 && error.keyPattern && error.keyPattern.modelNumber) {
      return res.status(400).json({
        success: false,
        message: `Product with model number "${modelNumber}" already exists`
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

    const { category, brand, modelNumber, hp, outlet, maxHead, watt, phase, price } = req.body;

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
    if (error.code === 11000 && error.keyPattern && error.keyPattern.modelNumber) {
      return res.status(400).json({
        success: false,
        message: `Product with model number "${req.body.modelNumber}" already exists`
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
// @desc    Delete product (Admin only)
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

    // Soft delete
    product.isActive = false;
    product.updatedBy = req.user._id;
    await product.save();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
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
      // Validate header format
      const expectedHeaders = ['category', 'brand', 'model number', 'HP', 'outlet', 'max head', 'watt', 'phase', 'price (rs.)'];
      const actualHeaders = Object.keys(data[0]).map(h => h.toLowerCase());
      
      const missingHeaders = expectedHeaders.filter(h => 
        !actualHeaders.some(ah => ah.includes(h.toLowerCase()))
      );

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
          // Map fields (case-insensitive)
          const categoryName = row.category || row.Category;
          const brandName = row.brand || row.Brand;
          const modelNumber = row['model number'] || row['Model Number'] || row.modelNumber;
          const hp = row.HP || row.hp;
          const outlet = row.outlet || row.Outlet;
          const maxHead = row['max head'] || row['Max Head'] || row.maxHead;
          const watt = row.watt || row.Watt;
          const phase = row.phase || row.Phase;
          const price = row['price (rs.)'] || row['Price (Rs.)'] || row.price || row.Price;

          // Validate required fields
          if (!categoryName || !brandName || !modelNumber || !hp || !outlet || !maxHead || !watt || !phase) {
            const errorMsg = 'Missing required fields';
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

          // Validate phase
          if (!['1 Phase', '3 Phase'].includes(phase)) {
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
            hp: Number(hp),
            outlet: String(outlet).trim(),
            maxHead: Number(maxHead),
            watt: Number(watt),
            phase,
            createdBy: req.user._id
          };

          // Handle price based on user role
          if (req.user.role === 'admin') {
            productData.price = Number(price) || 0;
          } else {
            // Project users cannot set price via upload
            productData.price = 0;
          }

          const product = new Product(productData);
          await product.save();

          console.log(`✅ Row ${rowNum} success: Product ${productData.modelNumber} created`);
          results.success.push({
            row: rowNum,
            modelNumber: productData.modelNumber
          });

        } catch (error) {
          let errorMessage = error.message;
          
          // Handle duplicate model number error
          if (error.code === 11000 && error.keyPattern && error.keyPattern.modelNumber && productData) {
            errorMessage = `Duplicate model number: ${productData.modelNumber}`;
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
        errorDetails: results.errors
      });

      res.json({
        success: true,
        message: `Bulk upload completed. ${results.success.length} products added, ${results.errors.length} errors`,
        data: results
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
// @desc    Download Excel template
// @access  Private
router.get('/download-template', auth, (req, res) => {
  try {
    // Create sample data
    const sampleData = [
      {
        'category': 'Submersible',
        'brand': 'Pentax',
        'model number': 'SUB-NEW-001',
        'HP': 1,
        'outlet': '1 inch',
        'max head': 50,
        'watt': 750,
        'phase': '1 Phase',
        'price (Rs.)': 15000
      },
      {
        'category': 'Centrifugal',
        'brand': 'Deep Tec',
        'model number': 'CENT-NEW-001',
        'HP': 2,
        'outlet': '2 inch',
        'max head': 35,
        'watt': 1500,
        'phase': '3 Phase',
        'price (Rs.)': 25000
      }
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Products');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

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