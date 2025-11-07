# 🏨 Hotel Management System

A complete full-stack hotel management system built with **HTML, CSS, JavaScript** (frontend) and **Node.js + Express + MongoDB** (backend).

## ✨ Features

- **Home Page** - Beautiful landing page with hotel overview and room types
- **Room Booking System** - Users can search and book rooms with date selection
- **Admin Dashboard** - Complete admin panel for managing bookings, rooms, and messages
- **Authentication System** - Separate login for admin and customers
- **Contact Page** - Contact form for customer inquiries
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **RESTful APIs** - Well-structured backend APIs for all operations

## 📁 Project Structure

```
hotel-management-system/
│
├── backend/
│   ├── server.js              # Main server file
│   ├── config/
│   │   └── database.js        # MongoDB connection
│   ├── models/
│   │   ├── Room.js           # Room model
│   │   ├── Booking.js        # Booking model
│   │   ├── User.js           # User model
│   │   └── Message.js        # Message model
│   ├── controllers/
│   │   ├── roomController.js
│   │   ├── bookingController.js
│   │   ├── userController.js
│   │   └── messageController.js
│   ├── routes/
│   │   ├── roomRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── userRoutes.js
│   │   └── messageRoutes.js
│   ├── middleware/
│   │   └── auth.js           # Authentication middleware
│   └── seed.js               # Database seeder
│
├── frontend/
│   ├── index.html            # Home page
│   ├── booking.html          # Booking page
│   ├── admin.html            # Admin dashboard
│   ├── contact.html          # Contact page
│   ├── style.css             # Stylesheet
│   └── script.js             # Frontend JavaScript
│
├── package.json              # Dependencies
├── .env.example             # Environment variables template
└── README.md                # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)
- **npm** (comes with Node.js)

### Installation Steps

1. **Clone or navigate to the project directory**
   ```bash
   cd hotel-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory (or copy from `.env.example`):
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/hotel-management
   JWT_SECRET=your-secret-key-change-in-production
   ```

   **Note:** If you're using MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string.

4. **Start MongoDB**
   
   Make sure MongoDB is running on your system:
   ```bash
   # On Windows (if installed as service, it should start automatically)
   # On macOS with Homebrew:
   brew services start mongodb-community
   # On Linux:
   sudo systemctl start mongod
   ```

5. **Seed the database (optional but recommended)**
   
   This will create sample rooms and an admin user:
   ```bash
   node backend/seed.js
   ```
   
   **Default Admin Credentials:**
   - Email: `admin@hotel.com`
   - Password: `admin123`

6. **Start the server**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```
   (Note: You may need to install nodemon globally: `npm install -g nodemon`)

7. **Open your browser**
   
   Navigate to: `http://localhost:3000`

## 📖 Usage Guide

### For Customers

1. **Browse Rooms**
   - Visit the home page to see available room types
   - Click "Book Now" to go to the booking page

2. **Book a Room**
   - Go to the "Book Room" page
   - Select check-in and check-out dates
   - Optionally filter by room type
   - Click "Search Rooms"
   - Select a room and fill in your details
   - Confirm the booking

3. **Contact Us**
   - Visit the "Contact" page
   - Fill out the contact form
   - Submit your message

### For Administrators

1. **Login**
   - Go to the "Admin" page
   - Use admin credentials (default: `admin@hotel.com` / `admin123`)
   - You'll be redirected to the dashboard

2. **Manage Bookings**
   - View all bookings in the "Bookings" tab
   - Update booking status (Pending, Confirmed, Cancelled, Completed)
   - Delete bookings if needed

3. **Manage Rooms**
   - Go to the "Rooms" tab
   - Add new rooms with details (room number, type, price, etc.)
   - Edit existing rooms
   - Delete rooms
   - Toggle room availability

4. **Manage Messages**
   - Go to the "Messages" tab
   - View all contact form submissions
   - Mark messages as read
   - Delete messages

## 🔌 API Endpoints

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get room by ID
- `POST /api/rooms` - Create room (Admin only)
- `PUT /api/rooms/:id` - Update room (Admin only)
- `DELETE /api/rooms/:id` - Delete room (Admin only)

### Bookings
- `GET /api/bookings` - Get all bookings (Admin only)
- `GET /api/bookings/:id` - Get booking by ID (Admin only)
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking (Admin only)
- `DELETE /api/bookings/:id` - Delete booking (Admin only)
- `GET /api/bookings/available` - Get available rooms for date range

### Users
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get current user profile (Protected)

### Messages
- `GET /api/messages` - Get all messages (Admin only)
- `GET /api/messages/:id` - Get message by ID (Admin only)
- `POST /api/messages` - Create message (contact form)
- `PUT /api/messages/:id/read` - Mark message as read (Admin only)
- `DELETE /api/messages/:id` - Delete message (Admin only)

## 🛠️ Technologies Used

### Frontend
- HTML5
- CSS3 (with CSS Grid and Flexbox)
- Vanilla JavaScript (ES6+)

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose (ODM)
- JWT (JSON Web Tokens) for authentication
- bcryptjs for password hashing

## 🔒 Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Protected admin routes
- Input validation
- CORS enabled for API access

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod` or check service status
- Verify connection string in `.env` file
- For MongoDB Atlas, check your IP whitelist and credentials

### Port Already in Use
- Change the `PORT` in `.env` file
- Or kill the process using port 3000

### Module Not Found Errors
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then run `npm install`

## 📝 Notes

- The database seeder creates sample rooms and an admin user
- All dates are validated (check-in cannot be in the past)
- Room availability is checked against existing bookings
- Booking prices are calculated automatically based on room price and number of nights

## 🤝 Contributing

Feel free to fork this project and submit pull requests for any improvements!

## 📄 License

This project is open source and available under the MIT License.

---

**Happy Coding! 🎉**

