# Environment Setup Guide

This guide explains how to set up environment variables for your microservices project.

## 📁 Environment Files

The project includes several environment configuration files:

### 1. `env.example` - Template File

- **Purpose**: Complete template with all possible environment variables
- **Usage**: Copy this file and rename it to `.env` for your local development
- **Contains**: All configuration options with placeholder values

### 2. `env.local` - Local Development

- **Purpose**: Minimal configuration for local development
- **Usage**: Quick start with basic settings
- **Contains**: Essential variables for local development

### 3. `env.production` - Production Environment

- **Purpose**: Production-ready configuration
- **Usage**: For staging and production deployments
- **Contains**: Secure defaults and production-specific settings

## 🚀 Quick Start

### For Local Development:

1. **Copy the local environment file:**

   ```bash
   cp env.local .env
   ```

2. **Or copy the example file for full configuration:**

   ```bash
   cp env.example .env
   ```

3. **Edit the `.env` file with your actual values:**
   ```bash
   nano .env
   # or
   code .env
   ```

## 🔧 Configuration Sections

### Database Configuration

#### PostgreSQL

```bash
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=microservices_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
```

#### MongoDB

```bash
MONGODB_URI=mongodb://localhost:27017/microservices_dev
```

#### Redis

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

#### RabbitMQ

```bash
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
```

### JWT Authentication

```bash
JWT_SECRET=your_super_secret_jwt_key_here
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
```

### Service Ports

```bash
API_GATEWAY_PORT=3000
USER_SERVICE_PORT=3001
PRODUCT_SERVICE_PORT=3002
ORDER_SERVICE_PORT=3003
NOTIFICATION_SERVICE_PORT=3004
PAYMENT_SERVICE_PORT=3005
ANALYTICS_SERVICE_PORT=3006
```

## 🔐 Security Considerations

### Development

- Use weak passwords for local development
- Enable debug logging
- Use test API keys for external services

### Production

- Use strong, unique passwords
- Enable SSL for database connections
- Use production API keys
- Disable debug features
- Use secure session secrets

## 📋 Required Services

### For Full Functionality:

1. **PostgreSQL** - Primary database
2. **MongoDB** - Document storage
3. **Redis** - Caching and sessions
4. **RabbitMQ** - Message queuing

### For Basic Development:

1. **PostgreSQL** - Main database
2. **Redis** - Caching (optional)

## 🛠️ External Services (Optional)

### Email Service

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### SMS Service (Twilio)

```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Payment Gateway (Stripe)

```bash
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

### Firebase

```bash
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Key Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

## 🔄 Environment-Specific Files

### Development

- Copy `env.local` to `.env`
- Modify database credentials
- Set up local services

### Staging

- Copy `env.example` to `.env.staging`
- Use staging database credentials
- Configure staging external services

### Production

- Copy `env.production` to `.env.production`
- Use production database credentials
- Configure production external services
- Ensure all security settings are enabled

## 🐳 Docker Environment

For Docker deployments, you can use environment files:

```bash
# Development
docker-compose --env-file env.local up

# Production
docker-compose --env-file env.production up
```

## 🔍 Validation

After setting up your environment:

1. **Test database connections:**

   ```bash
   npm run test:db
   ```

2. **Check service health:**

   ```bash
   curl http://localhost:3000/health
   curl http://localhost:3001/health
   ```

3. **Verify environment loading:**
   ```bash
   npm run dev
   ```

## ⚠️ Important Notes

1. **Never commit `.env` files** to version control
2. **Use different secrets** for each environment
3. **Rotate production secrets** regularly
4. **Backup environment configurations** securely
5. **Use environment-specific** feature flags

## 🆘 Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Check if PostgreSQL/MongoDB is running
   - Verify connection credentials
   - Ensure database exists

2. **Port Already in Use**
   - Change service ports in `.env`
   - Kill existing processes
   - Use different port ranges

3. **JWT Errors**
   - Ensure JWT_SECRET is set
   - Check token expiration settings
   - Verify issuer/audience settings

4. **External Service Errors**
   - Verify API keys are correct
   - Check service quotas
   - Ensure network connectivity

## 📞 Support

For environment setup issues:

1. Check the logs: `npm run logs`
2. Verify service status: `npm run status`
3. Test connections: `npm run test:connections`
