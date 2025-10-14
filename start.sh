#!/bin/bash

echo "🚀 Starting Deep Tec Price List Application..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first."
    echo "   Run: brew services start mongodb/brew/mongodb-community"
    echo "   Or: mongod --dbpath /path/to/your/db"
    exit 1
fi

# Start backend in the background
echo "📦 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo "🌐 Starting frontend server..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Application started successfully!"
echo ""
echo "🔗 Frontend: http://localhost:3000"
echo "🔗 Backend:  http://localhost:5000"
echo ""
echo "👤 Login credentials:"
echo "   Admin:        admin / admin123"
echo "   Project User: project_user / project123"
echo "   Employee:     employee / employee123"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup processes
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup INT

# Wait for processes
wait