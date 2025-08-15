#!/bin/bash

echo "🚀 Initializing MCPayStream Database with Prisma..."

# Check if .env.development exists
if [ ! -f "env.development" ]; then
    echo "❌ env.development file not found!"
    echo "Please create env.development with your Supabase connection details first."
    exit 1
fi

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migration
echo "🗄️  Running database migration..."
npx prisma migrate dev --name init

# Seed the database with initial data
echo "🌱 Seeding database with initial data..."
node src/scripts/initCreator.js

echo "✅ Database initialization complete!"
echo ""
echo "📊 You can now start the backend with: npm run dev"
echo "🔍 View your database with: npx prisma studio"


