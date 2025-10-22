const mongoose = require('mongoose');
require('dotenv').config();

const fixUniqueIndexes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Drop unique index on categories.name
    try {
      await db.collection('categories').dropIndex('name_1');
      console.log('✅ Dropped unique index on categories.name');
    } catch (error) {
      if (error.code === 27 || error.codeName === 'IndexNotFound') {
        console.log('⚠️  Unique index on categories.name not found (may already be dropped)');
      } else {
        console.error('❌ Error dropping categories.name index:', error.message);
      }
    }

    // Drop unique index on brands.name
    try {
      await db.collection('brands').dropIndex('name_1');
      console.log('✅ Dropped unique index on brands.name');
    } catch (error) {
      if (error.code === 27 || error.codeName === 'IndexNotFound') {
        console.log('⚠️  Unique index on brands.name not found (may already be dropped)');
      } else {
        console.error('❌ Error dropping brands.name index:', error.message);
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('Now you can create categories and brands with names of previously deleted items.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the migration
fixUniqueIndexes();