const mongoose = require('mongoose');
require('dotenv').config();

const updateProductIndexes = async () => {
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

    // Drop the old unique index on modelNumber only
    try {
      console.log('🗑️ Dropping old modelNumber unique index...');
      await collection.dropIndex({ modelNumber: 1 });
      console.log('✅ Old index dropped successfully');
    } catch (error) {
      if (error.code === 27 || error.codeName === 'IndexNotFound') {
        console.log('ℹ️ Index already doesn\'t exist, continuing...');
      } else {
        console.log('⚠️ Warning dropping old index:', error.message);
      }
    }

    // Create new compound unique index on modelNumber + phase
    console.log('📝 Creating new compound unique index on modelNumber and phase...');
    await collection.createIndex(
      { modelNumber: 1, phase: 1 }, 
      { 
        unique: true,
        name: 'modelNumber_1_phase_1'
      }
    );
    console.log('✅ New compound index created successfully');

    console.log('📋 Updated indexes:');
    const updatedIndexes = await collection.listIndexes().toArray();
    console.log(updatedIndexes.map(idx => ({ name: idx.name, key: idx.key })));

    console.log('✅ Index migration completed successfully!');
    console.log('');
    console.log('🎯 IMPACT:');
    console.log('• Same model numbers can now exist with different phases (1 Phase, 3 Phase)');
    console.log('• Bulk upload will check for model number + phase combination');
    console.log('• Example: "SUB-001" can exist as both "1 Phase" and "3 Phase" versions');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating indexes:', error);
    process.exit(1);
  }
};

updateProductIndexes();