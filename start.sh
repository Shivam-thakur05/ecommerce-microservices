#!/bin/bash

# MicroStore - Full Stack Startup Script
# This script helps you start both backend and frontend services

echo "🚀 Starting MicroStore Full Stack Application..."
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

if ! command_exists docker; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ All prerequisites are met!"
echo ""

# Function to start backend
start_backend() {
    echo "🔧 Starting Backend Services..."
    cd backend
    
    # Check if .env exists, if not copy from example
    if [ ! -f .env ]; then
        echo "📝 Creating .env file from template..."
        cp env.example .env
        echo "⚠️  Please edit backend/.env with your configuration"
    fi
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing backend dependencies..."
        npm install
    fi
    
    # Start services with Docker Compose
    echo "🐳 Starting services with Docker Compose..."
    docker-compose up -d
    
    echo "✅ Backend services started!"
    echo "   - API Gateway: http://localhost:3000"
    echo "   - User Service: http://localhost:3001"
    echo "   - Product Service: http://localhost:3002"
    echo "   - Order Service: http://localhost:3003"
    echo "   - Notification Service: http://localhost:3004"
    echo "   - Payment Service: http://localhost:3005"
    echo "   - Analytics Service: http://localhost:3006"
    echo ""
}

# Function to start frontend
start_frontend() {
    echo "🎨 Starting Frontend Application..."
    cd ../frontend
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing frontend dependencies..."
        npm install
    fi
    
    # Create .env if it doesn't exist
    if [ ! -f .env ]; then
        echo "📝 Creating frontend .env file..."
        cat > .env << EOF
REACT_APP_API_URL=http://localhost:3000
REACT_APP_ENVIRONMENT=development
EOF
    fi
    
    # Start development server
    echo "🌐 Starting React development server..."
    npm start
    
    echo "✅ Frontend started!"
    echo "   - Frontend: http://localhost:3000"
    echo ""
}

# Function to stop all services
stop_services() {
    echo "🛑 Stopping all services..."
    cd backend
    docker-compose down
    echo "✅ All services stopped!"
}

# Function to show status
show_status() {
    echo "📊 Service Status:"
    echo ""
    
    # Check Docker containers
    echo "🐳 Docker Containers:"
    docker-compose -f backend/docker-compose.yml ps
    
    echo ""
    echo "🌐 Frontend:"
    if curl -s http://localhost:3000 > /dev/null; then
        echo "   ✅ Running at http://localhost:3000"
    else
        echo "   ❌ Not running"
    fi
    
    echo ""
    echo "🔧 Backend Services:"
    for port in 3000 3001 3002 3003 3004 3005 3006; do
        if curl -s http://localhost:$port > /dev/null; then
            echo "   ✅ Service on port $port is running"
        else
            echo "   ❌ Service on port $port is not running"
        fi
    done
}

# Main menu
case "${1:-start}" in
    "start")
        start_backend
        start_frontend
        ;;
    "backend")
        start_backend
        ;;
    "frontend")
        start_frontend
        ;;
    "stop")
        stop_services
        ;;
    "status")
        show_status
        ;;
    "restart")
        stop_services
        sleep 2
        start_backend
        start_frontend
        ;;
    "help"|"-h"|"--help")
        echo "MicroStore Startup Script"
        echo ""
        echo "Usage: ./start.sh [command]"
        echo ""
        echo "Commands:"
        echo "  start     Start both backend and frontend (default)"
        echo "  backend   Start only backend services"
        echo "  frontend  Start only frontend application"
        echo "  stop      Stop all services"
        echo "  status    Show service status"
        echo "  restart   Restart all services"
        echo "  help      Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./start.sh start"
        echo "  ./start.sh backend"
        echo "  ./start.sh status"
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo "Use './start.sh help' for usage information"
        exit 1
        ;;
esac

echo ""
echo "🎉 Setup complete! Happy coding! 🚀" 