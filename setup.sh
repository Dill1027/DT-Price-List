#!/bin/bash

echo "🔧 Setting up Deep Tec Price List Application..."
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check for MongoDB
if ! command -v mongod &> /dev/null; then
    echo "❌ MongoDB is not installed. Please install MongoDB first."
    echo "   macOS: brew install mongodb/brew/mongodb-community"
    echo "   Linux: Follow instructions at https://docs.mongodb.com/manual/installation/"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Setup backend
echo "📦 Setting up backend..."
cd backend

if [ ! -f "package.json" ]; then
    echo "❌ Backend package.json not found!"
    exit 1
fi

echo "   Installing backend dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

echo "   ✅ Backend dependencies installed"

# Setup frontend
echo ""
echo "🌐 Setting up frontend..."
cd ../frontend

if [ ! -f "package.json" ]; then
    echo "❌ Frontend package.json not found!"
    exit 1
fi

echo "   Installing frontend dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo "   ✅ Frontend dependencies installed"

# Go back to root
cd ..

echo ""
echo "🗄️  Database setup..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "   Starting MongoDB..."
    # Try to start MongoDB (macOS with Homebrew)
    brew services start mongodb/brew/mongodb-community 2>/dev/null || {
        echo "   ⚠️  Please start MongoDB manually:"
        echo "      macOS: brew services start mongodb/brew/mongodb-community"
        echo "      Linux: sudo systemctl start mongod"
        echo "      Manual: mongod --dbpath /path/to/your/db"
        echo ""
        echo "   Then run: cd backend && npm run seed"
        exit 1
    }
    sleep 3
fi

echo "   Seeding database with initial data..."
cd backend
npm run seed

if [ $? -ne 0 ]; then
    echo "⚠️  Database seeding failed. You can run it manually later:"
    echo "   cd backend && npm run seed"
else
    echo "   ✅ Database seeded successfully"
fi

cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Make sure MongoDB is running"
echo "   2. Run: ./start.sh (or npm start in both backend and frontend directories)"
echo "   3. Open http://localhost:3000"
echo ""
echo "👤 Default login credentials:"
echo "   Admin:        admin / admin123"
echo "   Project User: project_user / project123"
echo "   Employee:     employee / employee123"
echo ""
echo "📚 For more information, see README.md"