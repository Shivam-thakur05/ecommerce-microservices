# MicroStore - Full-Stack E-commerce Platform

A complete microservices-based e-commerce platform with React frontend and Node.js backend services.

## 🏗️ Project Structure

```
microservice/
├── backend/                    # Backend microservices
│   ├── api-gateway/           # API Gateway service
│   ├── services/              # Individual microservices
│   │   ├── user-service/      # User management & auth
│   │   ├── product-service/   # Product catalog
│   │   ├── order-service/     # Order processing
│   │   ├── payment-service/   # Payment processing
│   │   ├── notification-service/ # Notifications
│   │   └── analytics-service/ # Analytics & reporting
│   ├── shared/                # Shared utilities
│   ├── infrastructure/        # Infrastructure configs
│   ├── monitoring/            # Monitoring setup
│   ├── docker-compose.yml     # Docker orchestration
│   └── package.json           # Backend dependencies
├── frontend/                  # React frontend application
│   ├── src/                   # Source code
│   │   ├── components/        # UI components
│   │   ├── pages/            # Page components
│   │   ├── store/            # State management
│   │   ├── services/         # API services
│   │   └── types/            # TypeScript types
│   ├── public/               # Static assets
│   └── package.json          # Frontend dependencies
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- Docker & Docker Compose
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**

   ```bash
   cd backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment:**

   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start with Docker:**
   ```bash
   docker-compose up -d
   ```

### Frontend Setup

1. **Navigate to frontend directory:**

   ```bash
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## 🏛️ Architecture

### Backend Microservices

- **API Gateway** (Port 3000) - Request routing & authentication
- **User Service** (Port 3001) - Authentication & user management
- **Product Service** (Port 3002) - Product catalog & search
- **Order Service** (Port 3003) - Order processing
- **Notification Service** (Port 3004) - Email, SMS, push notifications
- **Payment Service** (Port 3005) - Payment processing
- **Analytics Service** (Port 3006) - Analytics & reporting

### Frontend Features

- **Modern React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **Zustand** for state management
- **Framer Motion** for animations
- **Responsive design** for all devices

## 🛠️ Development

### Backend Development

```bash
cd backend
npm run dev          # Start all services in development
npm run test         # Run tests
npm run build        # Build for production
```

### Frontend Development

```bash
cd frontend
npm start           # Start development server
npm run build       # Build for production
npm test           # Run tests
```

## 📚 Documentation

- [Backend Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)
- [API Documentation](./backend/docs/api/)
- [Architecture Overview](./backend/docs/architecture/)

## 🐳 Docker Deployment

### Full Stack Deployment

```bash
# From root directory
docker-compose -f backend/docker-compose.yml up -d
cd frontend && npm run build
```

### Individual Services

```bash
cd backend
docker-compose up user-service product-service
```

## 🔧 Configuration

### Environment Variables

**Backend (.env in backend folder):**

```env
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/microservice
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

**Frontend (.env in frontend folder):**

```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_ENVIRONMENT=development
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm run test:unit      # Unit tests
npm run test:integration # Integration tests
npm run test:e2e       # End-to-end tests
```

### Frontend Tests

```bash
cd frontend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## 📊 Monitoring

- **Prometheus** - Metrics collection
- **Grafana** - Visualization dashboard
- **Jaeger** - Distributed tracing
- **ELK Stack** - Log aggregation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Check the documentation in each folder
- Open an issue on GitHub
- Review the architecture documentation

---

**Happy Coding! 🚀**
