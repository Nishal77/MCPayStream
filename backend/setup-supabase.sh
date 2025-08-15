#!/bin/bash

echo "🚀 MCPayStream Supabase Setup"
echo "=============================="
echo ""

# Check if env.development exists
if [ -f "env.development" ]; then
    echo "✅ env.development file found"
else
    echo "❌ env.development file not found"
    echo "Please create env.development with your Supabase credentials first."
    exit 1
fi

echo ""
echo "🔧 Setting up database..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Check database connection
echo "🔍 Testing database connection..."
if node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✅ Database connection successful');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  });
"; then
    echo "✅ Database connection test passed"
else
    echo "❌ Database connection test failed"
    echo "Please check your DATABASE_URL in env.development"
    exit 1
fi

# Run migration
echo "🗄️  Running database migration..."
npx prisma migrate dev --name init

# Seed database
echo "🌱 Seeding database..."
npm run db:seed

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📊 Start the backend with: npm run dev"
echo "🔍 View database with: npm run prisma:studio"
echo "📚 API documentation: http://localhost:5000"
echo ""
echo "Happy coding! 🚀"


