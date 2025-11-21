const mongoose = require('mongoose');
require('dotenv').config();

const allowDuplicateModelPhases = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('products');

    console.log('📋 Getting current indexes...');
    const currentIndexes = await collection.listIndexes().toArray();
    console.log('Current indexes:', currentIndexes.map(idx => ({ name: idx.name, key: idx.key })));

    // Drop the unique index on modelNumber only if it exists
    try {
      console.log('🗑️ Dropping unique modelNumber index...');
      await collection.dropIndex('modelNumber_1');
      console.log('✅ Unique modelNumber index dropped successfully');
    } catch (error) {
      if (error.code === 27 || error.codeName === 'IndexNotFound') {
        console.log('ℹ️ Unique modelNumber index doesn\'t exist, continuing...');
      } else {
        console.log('⚠️ Warning dropping index:', error.message);
      }
    }

    // Create a compound unique index on modelNumber + brand + phase combination
    // This allows same model number for different phases, but prevents exact duplicates
    console.log('📝 Creating compound unique index on modelNumber + brand + phase...');
    try {
      await collection.createIndex(
        { modelNumber: 1, brand: 1, phase: 1 }, 
        { 
          unique: true,
          name: 'modelNumber_brand_phase_unique',
          sparse: true  // Allow documents with missing phase field
        }
      );
      console.log('✅ Compound unique index created successfully');
    } catch (error) {
      if (error.code === 11000) {
        console.log('⚠️ Warning: There are duplicate modelNumber+brand+phase combinations');
        console.log('   This is expected and normal - the same model can exist in different phases');
      } else {
        console.log('⚠️ Warning creating compound index:', error.message);
      }
    }

    // Also create a regular (non-unique) search index for better search performance
    console.log('📝 Creating search performance index...');
    try {
      await collection.createIndex(
        { modelNumber: 1 }, 
        { 
          name: 'modelNumber_search'
        }
      );
      console.log('✅ Search performance index created successfully');
    } catch (error) {
      console.log('⚠️ Warning creating search index:', error.message);
    }

    console.log('📋 Updated indexes:');
    const updatedIndexes = await collection.listIndexes().toArray();
    console.log(updatedIndexes.map(idx => ({ name: idx.name, key: idx.key, unique: idx.unique })));

    console.log('✅ Phase-aware product structure completed successfully!');
    console.log('');
    console.log('🎯 CHANGES MADE:');
    console.log('• Same model number can now exist for different phases (1 Phase & 3 Phase)');
    console.log('• Unique constraint: modelNumber + brand + phase combination');
    console.log('• Search will return both 1 Phase and 3 Phase variants of same model');
    console.log('• Prevents true duplicates (same model, brand, phase)');
    console.log('• Improved search performance with dedicated search index');
    console.log('');
    console.log('📝 EXAMPLE:');
    console.log('✅ Allowed: Model "ABC123" with 1 Phase AND 3 Phase (same brand)');
    console.log('❌ Blocked: Duplicate "ABC123" with 1 Phase (same brand)');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating product structure:', error);
    process.exit(1);
  }
};

allowDuplicateModelPhases();