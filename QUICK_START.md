# Quick Start Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **Docker** and **Docker Compose**
- **Git**
- **npm** or **yarn**

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd microservice
```

### 2. Install Dependencies

```bash
# Install all dependencies for all services
npm run install:all
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```bash
# Copy the example environment file
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=microservices
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123

MONGODB_URL=mongodb://admin:admin123@localhost:27017/microservices?authSource=admin

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123

RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=admin
RABBITMQ_PASSWORD=admin123

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Service Ports
USER_SERVICE_PORT=3001
PRODUCT_SERVICE_PORT=3002
ORDER_SERVICE_PORT=3003
NOTIFICATION_SERVICE_PORT=3004
PAYMENT_SERVICE_PORT=3005
ANALYTICS_SERVICE_PORT=3006
API_GATEWAY_PORT=3000

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3007
JAEGER_PORT=16686
```

### 4. Start the Development Environment

```bash
# Start all services with Docker Compose
docker-compose up -d

# Or start individual services
npm run dev
```

### 5. Verify Services are Running

Check if all services are running:

```bash
# Check Docker containers
docker-compose ps

# Check service health
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # User Service
curl http://localhost:3002/health  # Product Service
curl http://localhost:3003/health  # Order Service
curl http://localhost:3004/health  # Notification Service
curl http://localhost:3005/health  # Payment Service
curl http://localhost:3006/health  # Analytics Service
```

### 6. Access Monitoring Tools

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3007 (admin/admin123)
- **Jaeger**: http://localhost:16686
- **RabbitMQ Management**: http://localhost:15672 (admin/admin123)

## Development Workflow

### Running Individual Services

```bash
# Run specific service
npm run dev --workspace=services/user-service

# Run API Gateway
npm run dev --workspace=api-gateway
```

### Testing

```bash
# Run all tests
npm run test

# Run tests for specific service
npm run test --workspace=services/user-service

# Run tests with coverage
npm run test:coverage
```

### Building for Production

```bash
# Build all services
npm run build

# Build specific service
npm run build --workspace=services/user-service
```

### Linting and Formatting

```bash
# Lint all code
npm run lint

# Fix linting issues
npm run lint:fix
```

## API Testing

### Using the API Gateway

The API Gateway is available at `http://localhost:3000` and routes requests to appropriate services.

### Example API Calls

```bash
# Register a new user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Get user profile (with authentication)
curl -X GET http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Database Access

### PostgreSQL

```bash
# Connect to PostgreSQL
docker exec -it microservice-postgres psql -U postgres -d microservices

# Or using psql client
psql -h localhost -p 5432 -U postgres -d microservices
```

### MongoDB

```bash
# Connect to MongoDB
docker exec -it microservice-mongodb mongosh -u admin -p admin123

# Or using mongo client
mongosh "mongodb://admin:admin123@localhost:27017/microservices?authSource=admin"
```

### Redis

```bash
# Connect to Redis
docker exec -it microservice-redis redis-cli

# Or using redis-cli
redis-cli -h localhost -p 6379
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port
   lsof -i :3000
   
   # Kill process
   kill -9 <PID>
   ```

2. **Database Connection Issues**
   ```bash
   # Restart database containers
   docker-compose restart postgres mongodb redis
   ```

3. **Service Not Starting**
   ```bash
   # Check logs
   docker-compose logs <service-name>
   
   # Restart specific service
   docker-compose restart <service-name>
   ```

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f user-service

# View service logs in real-time
npm run docker:logs
```

## Production Deployment

### Using Kubernetes

```bash
# Deploy to Kubernetes
kubectl apply -f infrastructure/kubernetes/manifests/

# Check deployment status
kubectl get pods -n microservices

# Access services
kubectl port-forward svc/api-gateway 3000:3000 -n microservices
```

### Using Docker Compose (Production)

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

## Next Steps

1. **Explore the Codebase**: Review the service implementations
2. **Add New Features**: Implement new functionality in existing services
3. **Create New Services**: Add new microservices following the established patterns
4. **Set Up CI/CD**: Configure automated testing and deployment
5. **Monitor Performance**: Set up alerts and performance monitoring
6. **Security Audit**: Review and enhance security measures

## Support

- **Documentation**: Check the `docs/` directory for detailed documentation
- **Issues**: Report bugs and feature requests through the issue tracker
- **Contributing**: Read CONTRIBUTING.md for development guidelines

Happy coding! 🚀 