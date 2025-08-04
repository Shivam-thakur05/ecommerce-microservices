# MicroStore Frontend

A modern, responsive React frontend for the MicroStore e-commerce platform built with TypeScript, Tailwind CSS, and modern React patterns.

## Features

- 🛍️ **E-commerce Functionality**
  - Product browsing and search
  - Shopping cart management
  - User authentication and registration
  - Order management
  - Wishlist functionality

- 🎨 **Modern UI/UX**
  - Responsive design for all devices
  - Beautiful animations with Framer Motion
  - Modern component library
  - Dark/light theme support
  - Loading states and error handling

- ⚡ **Performance**
  - React Query for efficient data fetching
  - Optimized bundle size
  - Lazy loading and code splitting
  - Image optimization

- 🔧 **Developer Experience**
  - TypeScript for type safety
  - ESLint and Prettier configuration
  - Hot reloading
  - Comprehensive error boundaries

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Yup** - Schema validation
- **Framer Motion** - Animations
- **Lucide React** - Icon library
- **Zustand** - State management
- **Axios** - HTTP client

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Backend microservices running (see main README)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd microservice/frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   Create a `.env` file in the frontend directory:

   ```env
   REACT_APP_API_URL=http://localhost:3000
   REACT_APP_ENVIRONMENT=development
   ```

4. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

The application will be available at `http://localhost:3000`

## Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Base UI components
│   │   └── layout/        # Layout components
│   ├── pages/             # Page components
│   │   ├── auth/          # Authentication pages
│   │   └── ...            # Other pages
│   ├── store/             # State management
│   ├── services/          # API services
│   ├── types/             # TypeScript types
│   ├── utils/             # Utility functions
│   ├── App.tsx            # Main app component
│   └── index.tsx          # Entry point
├── package.json
├── tailwind.config.js     # Tailwind configuration
└── tsconfig.json          # TypeScript configuration
```

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Key Features

### Authentication

- User registration and login
- JWT token management
- Protected routes
- Password reset functionality

### Product Management

- Product browsing with filters
- Search functionality
- Product details with variants
- Rating and review system

### Shopping Cart

- Add/remove items
- Quantity management
- Persistent cart state
- Checkout process

### User Dashboard

- Order history
- Profile management
- Address management
- Preferences settings

## API Integration

The frontend integrates with the following microservices:

- **User Service** (Port 3001) - Authentication and user management
- **Product Service** (Port 3002) - Product catalog and search
- **Order Service** (Port 3003) - Order processing
- **Payment Service** (Port 3005) - Payment processing
- **Notification Service** (Port 3004) - Notifications
- **Analytics Service** (Port 3006) - Analytics and reporting

## State Management

The application uses Zustand for state management with the following stores:

- **Auth Store** - User authentication state
- **Cart Store** - Shopping cart state
- **UI Store** - Application UI state

## Styling

The application uses Tailwind CSS with a custom design system:

- **Colors**: Primary, secondary, success, warning, error
- **Components**: Buttons, inputs, cards, modals
- **Responsive**: Mobile-first design
- **Animations**: Framer Motion for smooth transitions

## Performance Optimizations

- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Components loaded on demand
- **Caching**: React Query for API response caching
- **Image Optimization**: Responsive images with proper sizing
- **Bundle Optimization**: Tree shaking and minification

## Testing

The application includes:

- **Unit Tests**: Component testing with React Testing Library
- **Integration Tests**: API integration testing
- **E2E Tests**: End-to-end testing (planned)

## Deployment

### Development

```bash
npm start
```

### Production Build

```bash
npm run build
```

### Docker Deployment

```bash
docker build -t microstore-frontend .
docker run -p 3000:3000 microstore-frontend
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Ensure backend services are running
   - Check API URL in environment variables
   - Verify CORS configuration

2. **Build Errors**
   - Clear node_modules and reinstall
   - Check TypeScript configuration
   - Verify all dependencies are installed

3. **Styling Issues**
   - Ensure Tailwind CSS is properly configured
   - Check for CSS conflicts
   - Verify responsive breakpoints

## Support

For support and questions:

- Check the main project README
- Review the API documentation
- Open an issue on GitHub

## License

This project is licensed under the MIT License - see the LICENSE file for details.
