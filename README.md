# Maskon Health - Local Health & Wellness Platform

A comprehensive full-stack health and wellness platform connecting Kenyan communities to trusted health professionals, traditional nutritious meals, and practical fitness guidance.

## 🌟 Features

### Frontend (React Native/Expo)
- **Multi-platform Support**: iOS, Android, and Web
- **Modern UI/UX**: Beautiful, intuitive interface with gradient designs
- **Authentication System**: Email and phone-based login/registration
- **Real-time Data**: Live data from backend APIs
- **Offline Support**: Fallback data when API is unavailable
- **Responsive Design**: Works seamlessly across different screen sizes

### Backend (Node.js/Express)
- **RESTful API**: Complete API for all app features
- **Authentication**: JWT-based authentication with role-based access
- **Database**: MongoDB with Mongoose ODM
- **Security**: Password hashing, rate limiting, CORS, helmet
- **File Upload**: Image upload support with Cloudinary
- **Notifications**: Email and SMS integration
- **Payment Integration**: M-Pesa payment gateway support

### Core Features
- **Fitness Plans**: Curated workout routines with difficulty levels
- **Traditional Nutrition**: Kenyan traditional meals and medicinal herbs
- **Health Personnel**: Professional health service providers
- **Order Management**: Complete meal ordering system
- **Booking System**: Health professional appointment booking
- **Multi-language Support**: English, Swahili, Luo, and Kikuyu
- **User Profiles**: Comprehensive health and preference tracking

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Expo CLI
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd maskon-health
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Update .env with your configuration
   npm run seed  # Populate database with sample data
   npm run dev   # Start development server
   ```

3. **Frontend Setup**
   ```bash
   # In the root directory
   npm install
   # Update API_BASE_URL in services/api.js if needed
   npm start     # Start Expo development server
   ```

## 📁 Project Structure

```
maskon-health/
├── app/                    # Frontend screens (Expo Router)
│   ├── (tabs)/            # Main tab screens
│   ├── auth/              # Authentication screens
│   └── _layout.tsx        # Root layout
├── backend/               # Backend API
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── scripts/           # Database seeding
│   └── server.js          # Main server file
├── components/            # Reusable UI components
├── contexts/              # React contexts
├── services/              # API services
├── constants/             # App constants
└── assets/                # Images and fonts
```

## 🔧 Configuration

### Backend Environment Variables
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/maskon-health

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# SMS Configuration
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Payment Configuration
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_PASSKEY=your-passkey
MPESA_SHORTCODE=your-shortcode
```

### Frontend Configuration
Update the API base URL in `services/api.js`:
```javascript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api' 
  : 'https://your-production-api.com/api';
```

## 📱 Screenshots

### Main Screens
- **Home**: Welcome screen with feature overview
- **Fitness**: Workout plans with filtering
- **Nutrition**: Traditional meals and medicine
- **Personnel**: Health professionals directory

### Authentication
- **Login**: Email/phone login with password
- **Register**: Comprehensive user registration
- **Profile**: User profile management

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run dev          # Start development server
npm run seed         # Seed database
npm test             # Run tests
```

### Frontend Development
```bash
npm start            # Start Expo development server
npm run android      # Run on Android
npm run ios          # Run on iOS
npm run web          # Run on web
```

### Database Management
```bash
cd backend
npm run seed         # Populate with sample data
# Access MongoDB shell for direct database management
```

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Email login
- `POST /api/auth/login-phone` - Phone login
- `GET /api/auth/me` - Get current user

### Fitness Endpoints
- `GET /api/fitness/workouts` - Get all workouts
- `GET /api/fitness/workouts/:id` - Get single workout
- `POST /api/fitness/workouts/:id/rate` - Rate workout

### Nutrition Endpoints
- `GET /api/nutrition/meals` - Get all meals
- `GET /api/nutrition/meals/:id` - Get single meal
- `POST /api/nutrition/meals/:id/rate` - Rate meal

### Personnel Endpoints
- `GET /api/personnel/professionals` - Get all professionals
- `GET /api/personnel/professionals/:id` - Get single professional
- `POST /api/personnel/professionals/:id/rate` - Rate professional

### Orders & Bookings
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings

## 🔒 Security Features

- **Password Hashing**: bcrypt with configurable rounds
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: API abuse prevention
- **Input Validation**: express-validator sanitization
- **CORS Configuration**: Cross-origin request handling
- **Helmet Security**: HTTP headers protection
- **Environment Variables**: Sensitive data protection

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test             # Run all tests
npm run test:coverage # Run with coverage
```

### Frontend Testing
```bash
npm test             # Run component tests
```

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB
2. Configure environment variables
3. Deploy to your preferred platform (Heroku, AWS, etc.)
4. Set up PM2 for process management

### Frontend Deployment
1. Build for production
2. Deploy to Expo hosting or your preferred platform
3. Update API endpoints for production

### Environment Setup
```bash
# Production environment variables
NODE_ENV=production
MONGODB_URI_PROD=mongodb+srv://username:password@cluster.mongodb.net/maskon-health
JWT_SECRET=your-production-secret-key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Expo Team**: For the amazing React Native development platform
- **MongoDB**: For the flexible NoSQL database
- **Express.js**: For the robust web framework
- **React Native Community**: For the excellent ecosystem

## 📞 Support

- **Email**: support@maskonhealth.com
- **Documentation**: [API Documentation](link-to-docs)
- **Issues**: [GitHub Issues](link-to-issues)
- **Discord**: [Community Discord](link-to-discord)

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added authentication system
- **v1.2.0** - Enhanced UI/UX and performance
- **v1.3.0** - Added payment integration and notifications

---

**Maskon Health** - Empowering communities through accessible health and wellness solutions. 🌿💪
