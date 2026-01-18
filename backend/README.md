# Backend API - Setup Guide

This is the backend API for the Agri Fintech & Insurance platform, built with Node.js, Express, and MongoDB.

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Copy `.env.example` to `.env` in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update the following:
   ```env
   # MongoDB URI - Replace with your MongoDB connection string
   MONGODB_URI=mongodb://localhost:27017/agri-fintech-insurance
   
   # For MongoDB Atlas (cloud), use:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/agri-fintech-insurance?retryWrites=true&w=majority
   
   # Server port (default: 3000)
   PORT=3000
   
   # Frontend URL for CORS
   FRONTEND_URL=http://localhost:8000
   
   # JWT Secret - Generate a strong random string
   # You can generate one using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-characters
   
   # JWT expiration (default: 7d)
   JWT_EXPIRES_IN=7d
   ```

3. **Start MongoDB:**
   
   If using local MongoDB:
   ```bash
   # On Windows
   net start MongoDB
   
   # On macOS/Linux
   sudo systemctl start mongod
   ```
   
   Or use MongoDB Atlas (cloud) - no local installation needed.

4. **Seed demo users (optional):**
   ```bash
   npm run seed
   ```
   
   This will populate the database with users from `data/mock-users.json`:
   - farmer@demo.com / password123 (Farmer)
   - agent@demo.com / password123 (Agent)
   - admin@demo.com / password123 (Admin)

5. **Start the server:**
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

   The server will start on `http://localhost:3000` (or your configured PORT).

## 📡 API Endpoints

### Authentication

- **POST** `/api/auth/register` - Register a new user
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "farmer",
    "phone": "+91 9876543210",
    "address": "Village: Example"
  }
  ```

- **POST** `/api/auth/login` - Login user
  ```json
  {
    "email": "farmer@demo.com",
    "password": "password123",
    "role": "farmer"
  }
  ```
  
  Response:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "id": "...",
        "name": "...",
        "email": "...",
        "role": "farmer"
      },
      "token": "jwt_token_here"
    }
  }
  ```

- **GET** `/api/auth/me` - Get current user (requires authentication)
  - Headers: `Authorization: Bearer <token>`

- **POST** `/api/auth/verify-token` - Verify JWT token (requires authentication)
  - Headers: `Authorization: Bearer <token>`

### Health Check

- **GET** `/api/health` - Check API status

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. After login, include the token in requests:

```
Authorization: Bearer <your_jwt_token>
```

## 🗄️ Database Schema

### User Model

```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (required, enum: ['farmer', 'agent', 'admin']),
  phone: String,
  address: String,
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

## 🛠️ Development

### Project Structure

```
backend/
├── server.js           # Main server file
├── models/
│   └── User.js         # User Mongoose model
├── routes/
│   └── auth.js         # Authentication routes
├── middleware/
│   └── auth.js         # JWT authentication middleware
└── scripts/
    └── seed-users.js   # Database seeding script
```

### Environment Variables

All configuration is done through `.env` file. See `.env.example` for all available options.

## 🐛 Troubleshooting

### MongoDB Connection Issues

- Ensure MongoDB is running (if using local installation)
- Check your `MONGODB_URI` in `.env`
- For MongoDB Atlas, ensure your IP is whitelisted

### CORS Errors

- Update `FRONTEND_URL` in `.env` to match your frontend URL
- Ensure the backend server is running

### Authentication Errors

- Verify `JWT_SECRET` is set in `.env`
- Check token expiration (default: 7 days)
- Ensure token is included in `Authorization` header

## 📝 Notes

- Passwords are automatically hashed using bcrypt before saving
- JWT tokens expire after 7 days (configurable via `JWT_EXPIRES_IN`)
- User passwords are never returned in API responses
- All API responses follow a consistent format with `success`, `message`, and `data` fields

