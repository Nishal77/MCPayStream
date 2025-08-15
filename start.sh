#!/bin/bash

echo "🚀 Starting MCPayStream..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Starting MongoDB..."
    if command -v brew &> /dev/null; then
        brew services start mongodb-community
    elif command -v systemctl &> /dev/null; then
        sudo systemctl start mongod
    else
        echo "❌ Please start MongoDB manually and try again."
        exit 1
    fi
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

# Create .env file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "⚙️  Creating environment file..."
    cp backend/env.example backend/.env
    echo "📝 Please edit backend/.env with your configuration before starting."
fi

echo "✅ Dependencies installed and environment configured!"
echo ""
echo "🚀 Phantom Wallet Address: 9nGxKEUZkJAJAiaBZfvQVJPVvbpfndVjmPm5SBj5rHmr"
echo ""
echo "To start the application:"
echo "1. Edit backend/.env with your configuration"
echo "2. Initialize the default wallet: cd backend && npm run init-wallet"
echo "3. (Optional) Seed demo data: cd backend && npm run seed-demo"
echo "4. Run: npm run full:dev"
echo ""
echo "Or start services individually:"
echo "- Backend: npm run backend:dev"
echo "- Frontend: npm run dev"
echo ""
echo "🌐 Frontend will be available at: http://localhost:3000"
echo "🔗 Backend API will be available at: http://localhost:5000"
echo "🗄️  MongoDB will be available at: localhost:27017"
echo ""
echo "💡 The Phantom wallet address is pre-loaded in the dashboard!"
