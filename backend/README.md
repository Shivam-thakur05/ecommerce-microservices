# MicroStore Backend

A microservices-based backend for the MicroStore e-commerce platform built with Node.js, TypeScript, and modern architectural patterns.

## 🏗️ Architecture

### Microservices

- **API Gateway** (Port 3000) - Request routing, authentication, rate limiting
- **User Service** (Port 3001) - User management, authentication, profiles
- **Product Service** (Port 3002) - Product catalog, search, inventory
- **Order Service** (Port 3003) - Order processing, status management
- **Payment Service** (Port 3005) - Payment processing, transactions
- **Notification Service** (Port 3004) - Email, SMS, push notifications
- **Analytics Service** (Port 3006) - Data analytics, reporting

### Technology Stack

- **Runtime**: Node.js with TypeScript
- **Frameworks**: Express.js
- **Databases**: PostgreSQL, MongoDB
- **Message Queue**: Redis, RabbitMQ
- **Authentication**: JWT, OAuth2
- **Monitoring**: Prometheus, Grafana, Jaeger
- **Testing**: Jest, Supertest
- **Containerization**: Docker, Docker Compose

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- Docker & Docker Compose
- PostgreSQL 14+
- MongoDB 6+
- Redis 7+

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment:**

   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker:**

   ```bash
   docker-compose up -d
   ```

4. **Start services in development:**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
backend/
├── api-gateway/           # API Gateway service
│   ├── src/
│   │   ├── config/       # Configuration
│   │   ├── middleware/   # Custom middleware
│   │   ├── routes/       # Route definitions
│   │   └── index.ts      # Entry point
│   └── package.json
├── services/              # Individual microservices
│   ├── user-service/     # User management
│   ├── product-service/  # Product catalog
│   ├── order-service/    # Order processing
│   ├── payment-service/  # Payment processing
│   ├── notification-service/ # Notifications
│   └── analytics-service/ # Analytics
├── shared/               # Shared utilities
│   ├── common/          # Common types, utils
│   ├── database/        # Database connections
│   └── middleware/      # Shared middleware
├── infrastructure/       # Infrastructure configs
│   ├── docker/          # Docker configurations
│   ├── kubernetes/      # K8s manifests
│   └── terraform/       # Infrastructure as code
├── monitoring/          # Monitoring setup
│   ├── prometheus/      # Metrics collection
│   ├── grafana/         # Dashboards
│   └── jaeger/          # Distributed tracing
├── docker-compose.yml   # Service orchestration
└── package.json         # Root dependencies
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database Configuration
POSTGRES_URL=postgresql://postgres:postgres123@localhost:5432/microservices
MONGODB_URL=mongodb://admin:admin123@localhost:27017/microservices?authSource=admin
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Service Ports
API_GATEWAY_PORT=3000
USER_SERVICE_PORT=3001
PRODUCT_SERVICE_PORT=3002
ORDER_SERVICE_PORT=3003
NOTIFICATION_SERVICE_PORT=3004
PAYMENT_SERVICE_PORT=3005
ANALYTICS_SERVICE_PORT=3006

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payment Gateway
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 🛠️ Development

### Running Individual Services

```bash
# Start API Gateway
cd api-gateway && npm run dev

# Start User Service
cd services/user-service && npm run dev

# Start Product Service
cd services/product-service && npm run dev
```

### Running All Services

```bash
# Using Docker Compose
docker-compose up -d

# Using npm scripts
npm run dev
```

### Database Migrations

```bash
# Run migrations
npm run migrate

# Rollback migrations
npm run migrate:rollback

# Seed database
npm run seed
```

## 🧪 Testing

### Unit Tests

```bash
npm run test:unit
```

### Integration Tests

```bash
npm run test:integration
```

### End-to-End Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:coverage
```

## 📊 API Documentation

### Base URLs

- **API Gateway**: `http://localhost:3000`
- **User Service**: `http://localhost:3001`
- **Product Service**: `http://localhost:3002`
- **Order Service**: `http://localhost:3003`
- **Payment Service**: `http://localhost:3005`
- **Notification Service**: `http://localhost:3004`
- **Analytics Service**: `http://localhost:3006`

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints

#### User Service

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

#### Product Service

- `GET /api/products` - List products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)

#### Order Service

- `POST /api/orders` - Create order
- `GET /api/orders` - List user orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status

## 🐳 Docker Deployment

### Development

```bash
docker-compose up -d
```

### Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Individual Services

```bash
docker-compose up user-service product-service
```

## 📈 Monitoring

### Metrics (Prometheus)

- **URL**: `http://localhost:9090`
- **Metrics**: Service health, response times, error rates

### Dashboards (Grafana)

- **URL**: `http://localhost:3001`
- **Dashboards**: Service metrics, business KPIs

### Tracing (Jaeger)

- **URL**: `http://localhost:16686`
- **Traces**: Request flow across services

### Logs (ELK Stack)

- **Elasticsearch**: `http://localhost:9200`
- **Kibana**: `http://localhost:5601`

## 🔒 Security

### Authentication & Authorization

- JWT-based authentication
- Role-based access control (RBAC)
- API key management
- Rate limiting

### Data Protection

- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration

### Infrastructure Security

- HTTPS/TLS encryption
- Database connection encryption
- Secure environment variables
- Container security scanning

## 🚀 Performance

### Optimization Strategies

- Database query optimization
- Redis caching
- Connection pooling
- Load balancing
- Horizontal scaling

### Caching

- Redis for session storage
- Product catalog caching
- API response caching
- Database query caching

## 🔄 CI/CD

### GitHub Actions

- Automated testing
- Code quality checks
- Security scanning
- Docker image building
- Deployment automation

### Deployment Pipeline

1. Code commit triggers CI
2. Run tests and quality checks
3. Build Docker images
4. Deploy to staging
5. Run integration tests
6. Deploy to production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Update documentation
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Check the API documentation
- Review the architecture docs
- Open an issue on GitHub
- Contact the development team

---

**Happy Coding! 🚀**
