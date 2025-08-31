# Maskon Health Backend API

A comprehensive backend API for the Maskon Health platform - a local health and wellness platform connecting Kenyan communities to trusted health professionals, traditional nutritious meals, and practical fitness guidance.

## Features

- **User Authentication & Management**: Secure JWT-based authentication with role-based access control
- **Fitness Plans**: Complete workout management with exercises, categories, and difficulty levels
- **Traditional Nutrition**: Meal management with traditional Kenyan dishes and medicinal herbs
- **Health Personnel**: Professional health service providers with booking and consultation management
- **Order Management**: Complete meal ordering and delivery system
- **Booking System**: Health professional appointment booking and management
- **Multi-language Support**: English, Swahili, Luo, and Kikuyu language support
- **Payment Integration**: M-Pesa and other payment methods support
- **Real-time Notifications**: SMS and email notification system

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **multer** - File uploads
- **cloudinary** - Image storage
- **nodemailer** - Email notifications
- **twilio** - SMS notifications

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd maskon-health/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/maskon-health

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
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
   ```

4. **Start MongoDB**
   ```bash
   # Install MongoDB if not already installed
   # Start MongoDB service
   ```

5. **Seed the database**
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with email
- `POST /api/auth/login-phone` - Login with phone number
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/health-profile` - Update health profile
- `PUT /api/users/preferences` - Update preferences
- `POST /api/users/upload-profile-image` - Upload profile image
- `DELETE /api/users/account` - Delete account
- `GET /api/users/bmi` - Get user BMI

### Fitness
- `GET /api/fitness/workouts` - Get all workout plans
- `GET /api/fitness/workouts/:id` - Get single workout plan
- `POST /api/fitness/workouts/:id/rate` - Rate a workout plan
- `GET /api/fitness/categories` - Get workout categories
- `GET /api/fitness/difficulties` - Get difficulty levels
- `GET /api/fitness/featured` - Get featured workouts
- `GET /api/fitness/stats` - Get fitness statistics

### Nutrition
- `GET /api/nutrition/meals` - Get all meals
- `GET /api/nutrition/meals/:id` - Get single meal
- `POST /api/nutrition/meals/:id/rate` - Rate a meal
- `GET /api/nutrition/categories` - Get meal categories
- `GET /api/nutrition/subcategories` - Get meal subcategories
- `GET /api/nutrition/featured` - Get featured meals
- `GET /api/nutrition/traditional-medicine` - Get traditional medicine
- `GET /api/nutrition/stats` - Get nutrition statistics

### Health Personnel
- `GET /api/personnel/professionals` - Get all health professionals
- `GET /api/personnel/professionals/:id` - Get single professional
- `POST /api/personnel/professionals/:id/rate` - Rate a professional
- `GET /api/personnel/specialties` - Get specialties
- `GET /api/personnel/counties` - Get counties
- `GET /api/personnel/verified` - Get verified professionals
- `GET /api/personnel/emergency` - Get emergency providers
- `GET /api/personnel/stats` - Get personnel statistics

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/cancel` - Cancel order
- `POST /api/orders/:id/rate` - Rate order
- `GET /api/orders/tracking/:orderNumber` - Track order

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:id` - Get single booking
- `PUT /api/bookings/:id/cancel` - Cancel booking
- `POST /api/bookings/:id/rate` - Rate booking
- `GET /api/bookings/upcoming` - Get upcoming bookings

## Database Models

### User
- Basic user information
- Health profile (height, weight, blood type, allergies, etc.)
- Preferences (fitness goals, dietary restrictions, language)
- Emergency contacts

### WorkoutPlan
- Workout details (title, description, category, difficulty)
- Exercises with instructions, duration, sets, reps
- Instructor information
- Ratings and reviews

### Meal
- Meal information (name, description, category, price)
- Ingredients and nutrition facts
- Traditional uses and health benefits
- Supplier information

### HealthProfessional
- Professional details (specialty, experience, qualifications)
- Services and consultation fees
- Availability schedule
- Location and contact information

### Order
- Order items and quantities
- Delivery information
- Payment details
- Order status and tracking

### Booking
- Appointment details (date, time, duration)
- Consultation type (in-person, online, home visit)
- Medical information (symptoms, history)
- Booking status and notifications

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors if any
}
```

## Success Responses

All successful responses follow this format:

```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Response data
  }
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- 100 requests per 15 minutes per IP address
- Custom limits for specific endpoints

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- CORS configuration
- Helmet security headers
- Rate limiting
- Environment variable protection

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI_PROD=mongodb+srv://username:password@cluster.mongodb.net/maskon-health
JWT_SECRET=your-production-secret-key
```

### PM2 Deployment
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name "maskon-health-api"

# Monitor
pm2 monit

# Logs
pm2 logs
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Email: support@maskonhealth.com
- Documentation: [API Documentation](link-to-docs)
- Issues: [GitHub Issues](link-to-issues)
