const mongoose = require('mongoose');
require('dotenv').config();

// Check for existing model numbers in the database
const checkExistingModels = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Product = require('../models/Product');
    
    console.log('=== EXISTING MODEL NUMBERS ===\n');
    
    const products = await Product.find({}, 'modelNumber category brand')
      .populate('category', 'name')
      .populate('brand', 'name')
      .sort({ modelNumber: 1 });
    
    if (products.length === 0) {
      console.log('No products found in database.');
      return;
    }
    
    console.log(`Found ${products.length} products:\n`);
    
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.modelNumber} (${product.brand?.name || 'Unknown Brand'} - ${product.category?.name || 'Unknown Category'})`);
    });
    
    console.log('\n=== DUPLICATE CHECK ===\n');
    
    // Check for any remaining duplicates
    const duplicates = await Product.aggregate([
      { $group: { _id: '$modelNumber', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate model numbers found. Database is clean!');
    } else {
      console.log('❌ Duplicate model numbers found:');
      duplicates.forEach(dup => {
        console.log(`   - "${dup._id}" appears ${dup.count} times`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  checkExistingModels();
}

module.exports = checkExistingModels;