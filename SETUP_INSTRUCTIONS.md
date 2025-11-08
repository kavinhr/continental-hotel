# 🚀 Hotel Management System - Setup Instructions

Complete guide to install, run, and test the Hotel Management System.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v14 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`
   - npm comes bundled with Node.js

2. **MongoDB** 
   - **Option A: Local MongoDB**
     - Download from: https://www.mongodb.com/try/download/community
     - Install and start MongoDB service
   - **Option B: MongoDB Atlas (Cloud - Recommended)**
     - Sign up at: https://www.mongodb.com/cloud/atlas
     - Create a free cluster
     - Get your connection string

---

## 🔧 Installation Steps

### Step 1: Navigate to Project Directory

```bash
cd hotel-management-system
# or
cd C:\Users\kavin\Documents\APP
```

### Step 2: Install Dependencies

Install all required npm packages:

```bash
npm install
```

This will install:
- Express (web framework)
- Mongoose (MongoDB ODM)
- CORS (cross-origin resource sharing)
- dotenv (environment variables)
- bcryptjs (password hashing)
- jsonwebtoken (JWT authentication)

### Step 3: Create Environment File

Create a `.env` file in the root directory:

**For Local MongoDB:**
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/hotel-management
JWT_SECRET=your-secret-key-change-in-production-12345
```

**For MongoDB Atlas:**
```env
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hotel-management?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-change-in-production-12345
```

**Important:** Replace `username` and `password` with your MongoDB Atlas credentials.

### Step 4: Seed the Database (Optional but Recommended)

This creates sample rooms and an admin user:

```bash
node backend/seed.js
```

**Default Admin Credentials:**
- Email: `admin@hotel.com`
- Password: `admin123`

---

## ▶️ Running the Application

### Start the Server

```bash
npm start
```

Or for development with auto-reload (requires nodemon):

```bash
npm run dev
```

**Expected Output:**
```
✅ MongoDB Connected Successfully
🚀 Server is running on https://continental-backend-1i4g.onrender.com
📁 Frontend files served from: [path]
```

### Access the Application

Open your browser and navigate to:
- **Homepage:** https://continental-backend-1i4g.onrender.com
- **Booking Page:** https://continental-backend-1i4g.onrender.com/booking
- **Admin Dashboard:** https://continental-backend-1i4g.onrender.com/admin
- **Contact Page:** https://continental-backend-1i4g.onrender.com/contact

---

## 🧪 Testing Booking Functionality

### Test 1: View Available Rooms

1. Go to https://continental-backend-1i4g.onrender.com/booking
2. Select check-in and check-out dates
3. Optionally select a room type filter
4. Click "Search Rooms"
5. You should see available rooms displayed

### Test 2: Create a Booking

1. After searching for rooms, click "Book Now" on any room
2. Fill in the booking form:
   - Full Name: `John Doe`
   - Email: `john@example.com`
   - Phone: `+1234567890`
   - Special Requests: (optional)
3. Click "Confirm Booking"
4. You should see a success message with booking ID

### Test 3: Verify Booking in Database

**Option A: Using MongoDB Compass (GUI)**
1. Open MongoDB Compass
2. Connect to your database
3. Navigate to `hotel-management` database
4. Check the `bookings` collection

**Option B: Using Admin Dashboard**
1. Go to https://continental-backend-1i4g.onrender.com/admin
2. Login with admin credentials:
   - Email: `admin@hotel.com`
   - Password: `admin123`
3. Click on "Bookings" tab
4. You should see all bookings including the one you just created

### Test 4: API Endpoint Test

You can test the API directly using curl or Postman:

```bash
curl -X POST https://continental-backend-1i4g.onrender.com/api/book \
  -H "Content-Type: application/json" \
  -d '{
    "roomType": "Single",
    "checkIn": "2024-12-25",
    "checkOut": "2024-12-27",
    "customerName": "Test User",
    "customerEmail": "test@example.com",
    "customerPhone": "+1234567890"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "booking": {
    "id": "...",
    "customerName": "Test User",
    "totalPrice": 160,
    "status": "Pending"
  }
}
```

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to MongoDB"

**Solution:**
- Ensure MongoDB is running (for local installation)
- Check your MongoDB connection string in `.env`
- For MongoDB Atlas, verify your IP is whitelisted
- Check network connectivity

### Issue: "Port 3000 already in use"

**Solution:**
- Change PORT in `.env` file to another port (e.g., 3001)
- Or stop the process using port 3000:
  ```bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  
  # Mac/Linux
  lsof -ti:3000 | xargs kill
  ```

### Issue: "Module not found"

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Booking form not submitting"

**Solution:**
- Open browser console (F12)
- Check for JavaScript errors
- Verify the server is running
- Check network tab for API request/response
- Ensure all required fields are filled

### Issue: "AOS animations not working"

**Solution:**
- Check internet connection (AOS loads from CDN)
- Verify AOS library is loaded in browser console
- Check if AOS.init() is called in script

---

## 📁 Project Structure

```
hotel-management-system/
│
├── backend/
│   ├── server.js              # Main server file
│   ├── config/
│   │   └── database.js        # MongoDB connection
│   ├── models/                # Mongoose schemas
│   │   ├── Room.js
│   │   ├── Booking.js
│   │   ├── User.js
│   │   └── Message.js
│   ├── controllers/          # Business logic
│   │   ├── roomController.js
│   │   ├── bookingController.js
│   │   ├── userController.js
│   │   └── messageController.js
│   ├── routes/                # API route definitions
│   │   ├── roomRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── userRoutes.js
│   │   └── messageRoutes.js
│   ├── middleware/
│   │   └── auth.js           # JWT authentication
│   └── seed.js               # Database seeder
│
├── frontend/
│   ├── index.html            # Homepage (redesigned)
│   ├── booking.html          # Booking page
│   ├── admin.html            # Admin dashboard
│   ├── contact.html          # Contact page
│   ├── style.css             # Modern stylesheet
│   └── script.js             # Frontend JavaScript
│
├── package.json              # Dependencies
├── .env                      # Environment variables (create this)
├── README.md                 # Project documentation
└── SETUP_INSTRUCTIONS.md     # This file
```

---

## 🔌 API Endpoints

### Booking Endpoints

- `POST /api/book` - Create a new booking (alias for /api/bookings)
- `POST /api/bookings` - Create a new booking
- `GET /api/bookings/available?checkIn=DATE&checkOut=DATE` - Get available rooms

### Room Endpoints

- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get room by ID
- `POST /api/rooms` - Create room (Admin only)
- `PUT /api/rooms/:id` - Update room (Admin only)
- `DELETE /api/rooms/:id` - Delete room (Admin only)

### User Endpoints

- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get current user (Protected)

### Message Endpoints

- `POST /api/messages` - Create contact message
- `GET /api/messages` - Get all messages (Admin only)

---

## ✅ Checklist

Before considering the setup complete:

- [ ] Node.js and npm installed
- [ ] MongoDB running or Atlas configured
- [ ] `.env` file created with correct values
- [ ] Dependencies installed (`npm install`)
- [ ] Database seeded (`node backend/seed.js`)
- [ ] Server starts without errors (`npm start`)
- [ ] Homepage loads at https://continental-backend-1i4g.onrender.com
- [ ] Booking page accessible
- [ ] Can search for rooms
- [ ] Can create a booking
- [ ] Admin dashboard accessible
- [ ] Can login to admin panel

---

## 🎉 You're All Set!

Your Hotel Management System is now running. Enjoy exploring the features:

- ✨ Beautiful animated homepage
- 🏨 Room booking system
- 👨‍💼 Admin dashboard
- 📧 Contact form
- 🔒 Secure authentication

For questions or issues, check the console logs and browser developer tools (F12).

---

**Happy Coding! 🚀**

