const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: [true, 'Brand is required']
  },
  modelNumber: {
    type: String,
    required: [true, 'Model number is required'],
    trim: true,
    maxlength: [100, 'Model number cannot exceed 100 characters']
  },
  hp: {
    type: Number,
    min: [0, 'HP must be a positive number'],
    default: ''
  },
  outlet: {
    type: String,
    trim: true,
    maxlength: [50, 'Outlet cannot exceed 50 characters'],
    default: ''
  },
  maxHead: {
    type: Number,
    min: [0, 'Max head must be a positive number'],
    default: ''
  },
  maxFlow: {
    type: Number,
    min: [0, 'Max flow must be a positive number'],
    default: ''
  },
  watt: {
    type: Number,
    min: [0, 'Watt must be a positive number'],
    default: ''
  },
  phase: {
    type: String,
    enum: ['1 Phase', '3 Phase', ''],
    default: ''
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be a positive number']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better search performance
productSchema.index({ 
  modelNumber: 'text', 
  'category.name': 'text', 
  'brand.name': 'text' 
});

// Compound unique index - allows same model number across different categories and phases
productSchema.index({ 
  modelNumber: 1, 
  category: 1,
  brand: 1, 
  phase: 1 
}, { 
  unique: true, 
  sparse: true // Allow documents with missing phase field
});

// Search performance index for model number
productSchema.index({ modelNumber: 1 });

module.exports = mongoose.model('Product', productSchema);