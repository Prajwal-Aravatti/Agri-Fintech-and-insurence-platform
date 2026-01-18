# 🌾 Agri Fintech & Insurance Platform

A comprehensive digital platform connecting farmers with financial services and crop insurance, built with modern web technologies.

## 📋 Overview

This platform provides:
- **Loan Application System** - Multi-step loan applications with document uploads
- **Crop Insurance** - Comprehensive insurance policy management
- **Multi-Role Dashboard** - Separate interfaces for Farmers, Agents, and Admins
- **Document Management** - Secure file uploads and storage
- **Application Tracking** - Real-time status updates for loans and policies

## 🚀 Features

### For Farmers
- ✅ Easy signup and login
- ✅ Multi-step loan application with real-time validation
- ✅ Crop insurance policy applications
- ✅ Track application status
- ✅ View loan and policy history

### For Agents
- ✅ Review pending loan applications
- ✅ Approve/reject applications
- ✅ View complete applicant details
- ✅ Track reviewed applications

### For Admins
- ✅ System-wide dashboard
- ✅ Manage all users and applications
- ✅ Generate reports
- ✅ Monitor platform activity

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with animations
- **Vanilla JavaScript** - No framework dependencies
- **Responsive Design** - Mobile-friendly interface

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Multer** - File uploads
- **bcrypt** - Password hashing

### Testing
- **Selenium WebDriver** - End-to-end testing
- **Chrome Driver** - Browser automation

## 📦 Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/agri-fintech-insurance.git
cd agri-fintech-insurance
```

### Step 2: Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies (if needed)
cd frontend
npm install
cd ..
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Then edit `.env` with your actual values:

```env
MONGODB_URI=mongodb://localhost:27017/agri-fintech
JWT_SECRET=your-super-secret-jwt-key
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5500
```

> **Generate a secure JWT secret:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### Step 4: Start MongoDB

Make sure MongoDB is running:

```bash
# If using local MongoDB
mongod

# Or if using Docker
docker run -d -p 27017:27017 --name mongodb mongo
```

### Step 5: Seed Demo Data (Optional)

```bash
npm run seed
```

This creates demo accounts:
- `farmer@demo.com` / `password123` (Farmer)
- `agent@demo.com` / `password123` (Agent)
- `admin@demo.com` / `password123` (Admin)

> ⚠️ **WARNING:** These are DEMO credentials with weak passwords. Change them in production!

### Step 6: Start the Application

```bash
# Terminal 1: Start backend server
npm start
# or for development with auto-reload
npm run dev

# Terminal 2: Start frontend (using Live Server or similar)
# If using VS Code Live Server extension, right-click on frontend/index.html
# Or use any static file server on port 5500
```

The application will be available at:
- **Frontend:** http://localhost:5500
- **Backend API:** http://localhost:3000

## 📁 Project Structure

```
agri-fintech-insurance/
├── backend/
│   ├── models/              # Mongoose schemas
│   │   ├── User.js
│   │   ├── LoanApplication.js
│   │   └── InsuranceApplication.js
│   ├── routes/              # API routes
│   │   ├── auth.js
│   │   ├── loans.js
│   │   └── insurance.js
│   ├── middleware/          # Custom middleware
│   │   ├── auth.js
│   │   └── uploadConfig.js
│   ├── scripts/             # Utility scripts
│   │   └── seed-users.js
│   └── server.js            # Express app entry point
├── frontend/
│   ├── css/                 # Stylesheets
│   ├── js/                  # Client-side JavaScript
│   │   ├── main.js
│   │   ├── login.js
│   │   ├── dashboard.js
│   │   └── dashboard-admin.js
│   ├── data/                # Mock data for seeding
│   └── *.html               # HTML pages
├── test_recordings/         # Selenium test artifacts
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
└── package.json             # Dependencies and scripts
```

## 🧪 Testing

### Run Selenium Tests

```bash
# Make sure both frontend and backend are running first

# Test 2: Loan Application
node test2_loan_application.js

# Test 3: Insurance Application
node test3_insurance_application.js

# Test 4: Agent Approval Workflow
node test4_agent_approval.js
```
