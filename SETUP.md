# Maskon Health - Local Setup Guide

## Quick Start

### Option 1: Using the Batch File (Windows)
1. Double-click `start-app.bat`
2. Wait for both backend and frontend to start
3. Open your browser and go to `http://localhost:8081`

### Option 2: Manual Setup

#### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

#### Backend Setup
```bash
cd backend
npm install
# Create .env file with your configuration
npm run dev
```

#### Frontend Setup
```bash
# In the root directory
npm install
npm run web
```

## Environment Configuration

### Backend (.env file in backend directory)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/maskon-health
JWT_SECRET=your-secret-key
```

### Frontend Configuration
Update `services/api.js` if needed:
```javascript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api' 
  : 'https://your-production-api.com/api';
```

## Access Points
- **Frontend**: http://localhost:8081
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api

## Features Available
- User Authentication (Login/Register)
- Fitness Plans with filtering
- Traditional Nutrition items
- Health Personnel directory
- Order management
- Booking system

## Troubleshooting
- Make sure MongoDB is running
- Check that ports 5000 and 8081 are available
- Ensure all dependencies are installed
