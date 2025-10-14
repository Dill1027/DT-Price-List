const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Brand name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Brand name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
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

module.exports = mongoose.model('Brand', brandSchema);