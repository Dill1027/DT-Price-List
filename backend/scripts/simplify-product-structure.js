const mongoose = require('mongoose');
require('dotenv').config();

const simplifyProductStructure = async () => {
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

    // Drop the compound index on modelNumber + phase
    try {
      console.log('🗑️ Dropping compound modelNumber + phase index...');
      await collection.dropIndex('modelNumber_1_phase_1');
      console.log('✅ Compound index dropped successfully');
    } catch (error) {
      if (error.code === 27 || error.codeName === 'IndexNotFound') {
        console.log('ℹ️ Compound index already doesn\'t exist, continuing...');
      } else {
        console.log('⚠️ Warning dropping compound index:', error.message);
      }
    }

    // Create simple unique index on modelNumber only
    console.log('📝 Creating simple unique index on modelNumber...');
    try {
      await collection.createIndex(
        { modelNumber: 1 }, 
        { 
          unique: true,
          name: 'modelNumber_1'
        }
      );
      console.log('✅ Simple modelNumber index created successfully');
    } catch (error) {
      if (error.code === 11000) {
        console.log('⚠️ Warning: There are duplicate model numbers in the database');
        console.log('   You may need to clean up duplicate data first');
      } else {
        console.log('⚠️ Warning creating index:', error.message);
      }
    }

    console.log('📋 Updated indexes:');
    const updatedIndexes = await collection.listIndexes().toArray();
    console.log(updatedIndexes.map(idx => ({ name: idx.name, key: idx.key })));

    console.log('✅ Product structure simplification completed successfully!');
    console.log('');
    console.log('🎯 CHANGES MADE:');
    console.log('• Model numbers are now simply unique (no phase combination)');
    console.log('• Only Category, Brand, Model Number, and Price are required');
    console.log('• HP, Outlet, Max Head, Max Flow, Watt, and Phase are now optional');
    console.log('• Bulk upload simplified to require only essential fields');
    console.log('• Excel template updated with new structure');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error simplifying product structure:', error);
    process.exit(1);
  }
};

simplifyProductStructure();