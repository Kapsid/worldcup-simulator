#!/bin/bash

echo "🏆 Starting World Cup Simulator..."
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing root dependencies..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Start MongoDB
echo "🗄️  Starting MongoDB..."
if command -v brew &> /dev/null && brew services list | grep -q "mongodb/brew/mongodb-community.*started"; then
    echo "✅ MongoDB is already running"
elif command -v systemctl &> /dev/null; then
    sudo systemctl start mongod
    echo "✅ MongoDB started via systemctl"
elif command -v service &> /dev/null; then
    sudo service mongod start
    echo "✅ MongoDB started via service"
elif command -v brew &> /dev/null; then
    brew services start mongodb/brew/mongodb-community
    echo "✅ MongoDB started via Homebrew"
else
    echo "⚠️  Please start MongoDB manually before continuing"
    echo "   - macOS: brew services start mongodb/brew/mongodb-community"
    echo "   - Linux: sudo systemctl start mongod"
    echo "   - Windows: net start MongoDB"
    read -p "Press Enter when MongoDB is running..."
fi

echo ""
echo "🚀 Starting both frontend and backend..."
echo "📍 Frontend will be available at: http://localhost:3000"
echo "📍 Backend API will be available at: http://localhost:3001"
echo "📍 MongoDB will be running on: mongodb://localhost:27017/worldcup"
echo ""
echo "Demo credentials: username: admin, password: admin123"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

npm run dev