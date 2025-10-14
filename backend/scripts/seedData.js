const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Category = require('../models/Category');
const Brand = require('../models/Brand');

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Brand.deleteMany({});

    console.log('Cleared existing data');

    // Create admin user
    const adminUser = new User({
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      role: 'admin'
    });

    await adminUser.save();
    console.log('Admin user created');

    // Create sample users
    const projectUser = new User({
      username: 'project',
      password: 'project123',
      role: 'project_user',
      createdBy: adminUser._id
    });

    const employee = new User({
      username: 'employee',
      password: 'employee123',
      role: 'employee',
      createdBy: adminUser._id
    });

    await projectUser.save();
    await employee.save();
    console.log('Sample users created');

    // Create default categories
    const defaultCategories = [
      'Submersible borehole',
      'Submersible',
      'Centrifugal',
      'Multistage',
      'Pressure pump',
      'Solar pumps',
      'Digital control panels'
    ];

    const categoryDocs = defaultCategories.map(name => ({
      name,
      description: `${name} category for Deep Tec products`,
      createdBy: adminUser._id
    }));

    await Category.insertMany(categoryDocs);
    console.log('Default categories created');

    // Create default brands
    const defaultBrands = [
      'Pentax',
      'Samking',
      'Difule',
      'Deep Tec',
      'Coverco',
      'Franklin'
    ];

    const brandDocs = defaultBrands.map(name => ({
      name,
      description: `${name} brand products`,
      createdBy: adminUser._id
    }));

    await Brand.insertMany(brandDocs);
    console.log('Default brands created');

    console.log('✅ Seed data created successfully!');
    console.log('\nLogin credentials:');
    console.log('👑 Admin: admin / admin123');
    console.log('👤 Project User: project / project123');
    console.log('👥 Employee: employee / employee123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();