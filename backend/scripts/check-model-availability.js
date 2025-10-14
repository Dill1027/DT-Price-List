const mongoose = require('mongoose');
require('dotenv').config();

// Utility to check if model numbers are available
const checkModelNumbers = async (modelNumbers) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Product = require('../models/Product');
    
    console.log('🔍 Checking model number availability...\n');
    
    const results = [];
    
    for (const modelNumber of modelNumbers) {
      const exists = await Product.findOne({ modelNumber: modelNumber.trim() });
      results.push({
        modelNumber: modelNumber.trim(),
        available: !exists,
        status: exists ? '❌ TAKEN' : '✅ AVAILABLE'
      });
    }
    
    console.log('📋 Model Number Check Results:');
    console.log('=' .repeat(40));
    results.forEach(result => {
      console.log(`${result.status} ${result.modelNumber}`);
    });
    
    console.log('\n📊 Summary:');
    const available = results.filter(r => r.available).length;
    const taken = results.filter(r => !r.available).length;
    console.log(`✅ Available: ${available}`);
    console.log(`❌ Taken: ${taken}`);
    
    if (taken > 0) {
      console.log('\n💡 Suggestion: Use different model numbers for the taken ones.');
    }
    
    return results;
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
};

// If run directly from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node check-model-availability.js MODEL1 MODEL2 MODEL3...');
    console.log('Example: node check-model-availability.js SUB-001 CENT-002 PUMP-123');
    process.exit(1);
  }
  
  checkModelNumbers(args);
}

module.exports = checkModelNumbers;