#!/bin/bash

# Sirangkul System - Unified Dev Starter
echo "🚀 Starting Sirangkul Budget Management System..."

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    # Kill background jobs
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM EXIT

# 1. Check if backend port 8000 is in use (Laravel default)
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 8000 is already in use. Cleaning up..."
    lsof -ti:8000 | xargs kill -9
fi

# 2. Start Backend (Laravel)
echo "📡 Starting Backend (Laravel)..."
# Using fixed path for PHP find in Herd
(cd api-sirangkul && /usr/local/bin/php artisan serve) &

# 3. Wait a moment for BE to initialize
sleep 2

# 4. Start Frontend (Vite)
echo "💻 Starting Frontend (Vite)..."
npm run dev

# Wait for background jobs
wait
