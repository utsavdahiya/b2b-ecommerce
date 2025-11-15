#!/bin/bash

# Database Initialization Script for Render
# Run this once after deploying to Render

echo "🚀 Initializing B2B E-Commerce Database on Render..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL in your Render dashboard"
    exit 1
fi

echo "📋 Database URL found"
echo "🔧 Running database schema setup..."

# Run the initialization script
node lib/db/init.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database initialized successfully!"
    echo ""
    echo "🎉 Your B2B E-Commerce platform is ready!"
    echo ""
    echo "Next steps:"
    echo "1. Visit your app URL"
    echo "2. Create a new account (Sign Up)"
    echo "3. Start configuring products!"
else
    echo ""
    echo "❌ Database initialization failed"
    echo "Please check the error messages above"
    exit 1
fi

