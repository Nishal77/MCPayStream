#!/bin/bash

echo "🚀 Setting up Phantom Wallet for MCPayStream..."
echo "📍 Wallet Address: 9nGxKEUZkJAJAiaBZfvQVJPVvbpfndVjmPm5SBj5rHmr"
echo ""

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found. Please run this script from the project root."
    exit 1
fi

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp backend/env.example backend/.env
    echo "✅ .env file created. Please review and edit if needed."
    echo ""
fi

# Install backend dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    echo "✅ Backend dependencies installed."
    echo ""
fi

# Initialize the wallet
echo "🔧 Initializing Phantom wallet in database..."
cd backend
npm run init-wallet
cd ..

if [ $? -eq 0 ]; then
    echo "✅ Phantom wallet initialized successfully!"
    echo ""
    
    # Ask if user wants to seed demo data
    read -p "🌱 Would you like to seed demo transaction data? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🌱 Seeding demo transaction data..."
        cd backend
        npm run seed-demo
        cd ..
        
        if [ $? -eq 0 ]; then
            echo "✅ Demo data seeded successfully!"
        else
            echo "❌ Failed to seed demo data."
        fi
    fi
    
    echo ""
    echo "🎉 Setup complete! You can now start the application:"
    echo "   npm run full:dev"
    echo ""
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔗 Backend: http://localhost:5000"
    echo ""
    echo "💡 The Phantom wallet address is pre-loaded in the dashboard!"
    
else
    echo "❌ Failed to initialize wallet. Please check your MongoDB connection and try again."
    exit 1
fi
