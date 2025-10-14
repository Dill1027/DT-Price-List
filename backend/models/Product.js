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
    unique: true,
    trim: true,
    maxlength: [100, 'Model number cannot exceed 100 characters']
  },
  hp: {
    type: Number,
    required: [true, 'HP is required'],
    min: [0, 'HP must be a positive number']
  },
  outlet: {
    type: String,
    required: [true, 'Outlet is required'],
    trim: true,
    maxlength: [50, 'Outlet cannot exceed 50 characters']
  },
  maxHead: {
    type: Number,
    required: [true, 'Max head is required'],
    min: [0, 'Max head must be a positive number']
  },
  watt: {
    type: Number,
    required: [true, 'Watt is required'],
    min: [0, 'Watt must be a positive number']
  },
  phase: {
    type: String,
    enum: ['1 Phase', '3 Phase'],
    required: [true, 'Phase is required']
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

// Unique index for model number
productSchema.index({ modelNumber: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);