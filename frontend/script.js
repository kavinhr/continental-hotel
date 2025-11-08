/**
 * Hotel Management System - Frontend JavaScript
 * Handles API calls, form submissions, and UI interactions
 */

// API Base URL
const API_BASE_URL = 'https://continental-backend-1i4g.onrender.com/api';

// Utility Functions
function showMessage(elementId, message, type = 'success') {
    const messageEl = document.getElementById(elementId);
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        setTimeout(() => {
            messageEl.className = 'message';
            messageEl.textContent = '';
        }, 5000);
    }
}

// Format date in Indian format
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Format date for input fields (YYYY-MM-DD)
function formatDateInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format currency in Indian Rupees (₹)
function formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '₹0';
    }
    // Convert to number and format with Indian number system
    const numAmount = parseFloat(amount);
    return '₹' + numAmount.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// Format currency with decimals (for detailed views)
function formatCurrencyDetailed(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '₹0.00';
    }
    const numAmount = parseFloat(amount);
    return '₹' + numAmount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function getAuthToken() {
    return localStorage.getItem('authToken');
}

function setAuthToken(token) {
    localStorage.setItem('authToken', token);
}

function removeAuthToken() {
    localStorage.removeItem('authToken');
}

function isAdmin() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role === 'admin';
}

// API Request Helper
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'An error occurred');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Set minimum date for date inputs to today
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        input.setAttribute('min', today);
    });
});

// ==================== BOOKING PAGE ====================

// Search for available rooms with loading state and error handling
if (document.getElementById('searchForm')) {
    document.getElementById('searchForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const checkIn = document.getElementById('checkIn').value;
        const checkOut = document.getElementById('checkOut').value;
        const roomType = document.getElementById('roomTypeFilter').value;
        const container = document.getElementById('roomsContainer');
        const submitButton = e.target.querySelector('button[type="submit"]');

        // Validate dates
        if (!checkIn || !checkOut) {
            alert('Please select both check-in and check-out dates');
            return;
        }

        // Show loading state
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Searching...';
        container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Searching for available rooms...</p></div>';

        console.log('🔍 [FRONTEND] Searching for rooms:', { checkIn, checkOut, roomType });

        try {
            // Get available rooms for the date range with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            let availableRooms = [];
            try {
                availableRooms = await apiRequest(`/bookings/available?checkIn=${checkIn}&checkOut=${checkOut}`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                console.log('✅ [FRONTEND] Found rooms:', availableRooms ? availableRooms.length : 0);
            } catch (apiError) {
                clearTimeout(timeoutId);
                // If API fails, try to get all rooms as fallback
                console.warn('⚠️ [FRONTEND] Available rooms API failed, trying to fetch all rooms...');
                try {
                    const allRooms = await apiRequest('/rooms', { signal: controller.signal });
                    availableRooms = allRooms.filter(room => room.isAvailable);
                    console.log('✅ [FRONTEND] Found rooms (fallback):', availableRooms.length);
                } catch (fallbackError) {
                    throw apiError; // Throw original error
                }
            }
            
            if (!Array.isArray(availableRooms)) {
                availableRooms = [];
            }
            
            // Filter by room type if selected
            let filteredRooms = availableRooms;
            if (roomType) {
                filteredRooms = availableRooms.filter(room => room.roomType === roomType);
                console.log(`🔍 [FRONTEND] Filtered to ${roomType}:`, filteredRooms.length);
            }

            displayAvailableRooms(filteredRooms, checkIn, checkOut);
        } catch (error) {
            console.error('❌ [FRONTEND] Error searching rooms:', error);
            
            if (error.name === 'AbortError') {
                container.innerHTML = '<div class="error-message"><p>⏱️ Request timed out. Please check your connection and try again.</p></div>';
            } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                container.innerHTML = '<div class="error-message"><p>🌐 Connection error. Please ensure the server is running and try again.</p></div>';
            } else {
                container.innerHTML = `<div class="error-message"><p>❌ Error: ${error.message}</p><p>Please try again or contact support.</p></div>`;
            }
        } finally {
            // Restore button state
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
}

// Display available rooms
function displayAvailableRooms(rooms, checkIn, checkOut) {
    const container = document.getElementById('roomsContainer');
    
    if (!rooms || rooms.length === 0) {
        container.innerHTML = '<div class="info-message"><p>No rooms available at the moment for the selected dates.</p><p style="margin-top: 1rem; font-size: 0.9rem;">Please try different dates or contact us for assistance.</p></div>';
        return;
    }

    container.innerHTML = rooms.map((room, index) => {
        const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
        const totalPrice = room.price * nights;

        return `
            <div class="room-booking-card">
                <h3>Room ${room.roomNumber}</h3>
                <div class="room-type">${room.roomType} Room</div>
                <p>${room.description || 'Comfortable and well-appointed room'}</p>
                <div class="room-price">${formatCurrency(totalPrice)} for ${nights} night(s)</div>
                <p style="color: #666; margin-top: 0.5rem;">${formatCurrency(room.price)} per night</p>
                ${room.amenities && room.amenities.length > 0 ? 
                    `<p style="margin-top: 1rem;"><strong>Amenities:</strong> ${room.amenities.join(', ')}</p>` : ''}
                <button class="btn btn-primary book-room-btn" style="width: 100%; margin-top: 1rem;" 
                        data-room-id="${room._id}"
                        data-room-number="${room.roomNumber}"
                        data-room-type="${room.roomType}"
                        data-room-price="${room.price}"
                        data-check-in="${checkIn}"
                        data-check-out="${checkOut}">
                    Book Now
                </button>
            </div>
        `;
    }).join('');
    
    // Add event listeners to all book buttons
    container.querySelectorAll('.book-room-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const roomId = this.getAttribute('data-room-id');
            const roomNumber = this.getAttribute('data-room-number');
            const roomType = this.getAttribute('data-room-type');
            const price = parseFloat(this.getAttribute('data-room-price'));
            const checkIn = this.getAttribute('data-check-in');
            const checkOut = this.getAttribute('data-check-out');
            
            openBookingModal(roomId, roomNumber, roomType, price, checkIn, checkOut);
        });
    });
}

// Open booking modal
window.openBookingModal = function(roomId, roomNumber, roomType, price, checkIn, checkOut) {
    try {
        const modal = document.getElementById('bookingModal');
        if (!modal) {
            console.error('Booking modal not found');
            alert('Error: Booking form not available. Please refresh the page.');
            return;
        }

        const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
        const totalPrice = price * nights;

        // Store values in hidden inputs
        const roomIdInput = document.getElementById('selectedRoomId');
        const checkInInput = document.getElementById('selectedCheckIn');
        const checkOutInput = document.getElementById('selectedCheckOut');
        
        if (roomIdInput) roomIdInput.value = roomId || '';
        if (checkInInput) checkInInput.value = checkIn || '';
        if (checkOutInput) checkOutInput.value = checkOut || '';
        
        // Update summary display
        const summaryRoom = document.getElementById('summaryRoom');
        const summaryCheckIn = document.getElementById('summaryCheckIn');
        const summaryCheckOut = document.getElementById('summaryCheckOut');
        const summaryPrice = document.getElementById('summaryPrice');
        
        if (summaryRoom) summaryRoom.textContent = `Room ${roomNumber} (${roomType})`;
        if (summaryCheckIn) summaryCheckIn.textContent = formatDate(checkIn);
        if (summaryCheckOut) summaryCheckOut.textContent = formatDate(checkOut);
        if (summaryPrice) summaryPrice.textContent = formatCurrency(totalPrice);

        modal.style.display = 'block';
    } catch (error) {
        console.error('Error opening booking modal:', error);
        alert('An error occurred while opening the booking form. Please try again.');
    }
};

// Close modal
document.addEventListener('DOMContentLoaded', () => {
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close');

    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modals.forEach(modal => modal.style.display = 'none');
        });
    });

    window.addEventListener('click', (e) => {
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
});

// Submit booking
if (document.getElementById('bookingForm')) {
    document.getElementById('bookingForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const roomId = document.getElementById('selectedRoomId').value;
        const checkIn = document.getElementById('selectedCheckIn').value;
        const checkOut = document.getElementById('selectedCheckOut').value;

        // Validate that we have all required data
        if (!roomId || !checkIn || !checkOut) {
            alert('Missing booking information. Please try again.');
            return;
        }

        const bookingData = {
            room: roomId,
            checkIn: checkIn,
            checkOut: checkOut,
            customerName: document.getElementById('customerName').value.trim(),
            customerEmail: document.getElementById('customerEmail').value.trim(),
            customerPhone: document.getElementById('customerPhone').value.trim(),
            specialRequests: document.getElementById('specialRequests').value.trim()
        };

        // Validate required fields
        if (!bookingData.customerName || !bookingData.customerEmail || !bookingData.customerPhone) {
            alert('Please fill in all required fields.');
            return;
        }

        try {
            // Submit to /api/book endpoint (also works with /api/bookings)
            const result = await apiRequest('/book', {
                method: 'POST',
                body: JSON.stringify(bookingData)
            });

            // Check if the response indicates success
            if (result.success) {
                // Store booking details for confirmation page
                const bookingDetails = {
                    bookingId: result.booking.id,
                    customerName: bookingData.customerName,
                    customerEmail: bookingData.customerEmail,
                    roomNumber: result.booking.room.roomNumber,
                    roomType: result.booking.room.roomType,
                    roomPrice: result.booking.room.price,
                    checkIn: bookingData.checkIn,
                    checkOut: bookingData.checkOut,
                    totalPrice: result.booking.totalPrice,
                    nights: Math.ceil((new Date(bookingData.checkOut) - new Date(bookingData.checkIn)) / (1000 * 60 * 60 * 24))
                };
                
                // Store in sessionStorage for confirmation page
                sessionStorage.setItem('bookingConfirmation', JSON.stringify(bookingDetails));
                
                // Redirect to confirmation page
                window.location.href = 'booking-confirmation.html';
            } else {
                throw new Error(result.message || 'Booking failed');
            }
        } catch (error) {
            console.error('Booking error:', error);
            alert('❌ Error creating booking: ' + error.message);
        }
    });
}

// ==================== ADMIN PAGE ====================

// Admin Login Function
window.loginAdmin = async function(email, password) {
    try {
        const result = await apiRequest('/users/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (!result.user || result.user.role !== 'admin') {
            throw new Error('Access denied. Admin privileges required.');
        }

        if (!result.token) {
            throw new Error('Authentication token not received.');
        }

        // Store token and user data
        setAuthToken(result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // Show dashboard and hide login
        const loginSection = document.getElementById('loginSection');
        const dashboardSection = document.getElementById('dashboardSection');
        
        if (loginSection) loginSection.style.display = 'none';
        if (dashboardSection) dashboardSection.style.display = 'block';
        
        // Load all data
        await Promise.all([
            loadBookings(),
            loadRooms(),
            loadMessages()
        ]);
        
        return true;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

// Admin Login Form Handler
if (document.getElementById('adminLoginForm')) {
    document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;

        if (!email || !password) {
            alert('Please enter both email and password.');
            return;
        }

        // Show loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Logging in...';

        try {
            await loginAdmin(email, password);
        } catch (error) {
            alert('Login failed: ' + (error.message || 'Please check your credentials and try again.'));
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
}

// Logout Function
window.logoutAdmin = function() {
    if (confirm('Are you sure you want to logout?')) {
        removeAuthToken();
        localStorage.removeItem('user');
        
        const loginSection = document.getElementById('loginSection');
        const dashboardSection = document.getElementById('dashboardSection');
        
        if (loginSection) loginSection.style.display = 'block';
        if (dashboardSection) dashboardSection.style.display = 'none';
        
        // Clear form
        const loginForm = document.getElementById('adminLoginForm');
        if (loginForm) loginForm.reset();
    }
};

// Check if already logged in on page load
document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    
    if (!loginSection || !dashboardSection) return;
    
    const token = getAuthToken();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user.role === 'admin') {
        // User is logged in, show dashboard
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        
        // Load all data
        loadBookings();
        loadRooms();
        loadMessages();
    } else {
        // User is not logged in, show login form
        loginSection.style.display = 'block';
        dashboardSection.style.display = 'none';
        
        // Clear any invalid tokens
        if (token) {
            removeAuthToken();
            localStorage.removeItem('user');
        }
    }
});

// Tab switching
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            // Remove active class from all
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked
            btn.classList.add('active');
            document.getElementById(`${targetTab}Tab`).classList.add('active');
        });
    });
});

// Load Bookings
window.loadBookings = async function() {
    const container = document.getElementById('bookingsTable');
    if (!container) return;
    
    try {
        container.innerHTML = '<p class="info-message">Loading bookings...</p>';
        
        const bookings = await apiRequest('/bookings');
        
        if (!Array.isArray(bookings)) {
            throw new Error('Invalid response format');
        }

        if (bookings.length === 0) {
            container.innerHTML = '<p class="info-message">No bookings found.</p>';
            return;
        }

        container.innerHTML = `
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Booking ID</th>
                            <th>Customer</th>
                            <th>Room</th>
                            <th>Check-in</th>
                            <th>Check-out</th>
                            <th>Total Price</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bookings.map(booking => {
                            const bookingId = booking._id || booking.id || 'N/A';
                            const room = booking.room || {};
                            return `
                            <tr>
                                <td>${String(bookingId).substring(0, 8)}...</td>
                                <td>
                                    <strong>${booking.customerName || 'N/A'}</strong><br>
                                    <small style="color: var(--text-light);">${booking.customerEmail || ''}</small>
                                </td>
                                <td>${room.roomNumber || 'N/A'} (${room.roomType || 'N/A'})</td>
                                <td>${formatDate(booking.checkIn)}</td>
                                <td>${formatDate(booking.checkOut)}</td>
                                <td><strong>${formatCurrency(booking.totalPrice)}</strong></td>
                                <td>
                                    <span class="status-badge status-${(booking.status || 'Pending').toLowerCase()}">
                                        ${booking.status || 'Pending'}
                                    </span>
                                </td>
                                <td>
                                    <select onchange="updateBookingStatus('${bookingId}', this.value)" 
                                            class="status-select">
                                        <option value="Pending" ${(booking.status || 'Pending') === 'Pending' ? 'selected' : ''}>Pending</option>
                                        <option value="Confirmed" ${(booking.status || 'Pending') === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                                        <option value="Cancelled" ${(booking.status || 'Pending') === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                                        <option value="Completed" ${(booking.status || 'Pending') === 'Completed' ? 'selected' : ''}>Completed</option>
                                    </select>
                                    <button class="btn btn-danger btn-sm" 
                                            onclick="deleteBooking('${bookingId}')">Delete</button>
                                </td>
                            </tr>
                        `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Error loading bookings:', error);
        container.innerHTML = `<p class="info-message error">Error loading bookings: ${error.message || 'Please try again later.'}</p>`;
    }
};

// Update Booking Status
window.updateBookingStatus = async function(bookingId, status) {
    if (!bookingId || !status) {
        alert('Invalid booking data.');
        return;
    }
    
    try {
        await apiRequest(`/bookings/${bookingId}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        await loadBookings();
    } catch (error) {
        console.error('Error updating booking:', error);
        alert('Error updating booking: ' + (error.message || 'Please try again.'));
    }
};

// Delete Booking
window.deleteBooking = async function(bookingId) {
    if (!bookingId) {
        alert('Invalid booking ID.');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
        return;
    }

    try {
        await apiRequest(`/bookings/${bookingId}`, {
            method: 'DELETE'
        });
        await loadBookings();
    } catch (error) {
        console.error('Error deleting booking:', error);
        alert('Error deleting booking: ' + (error.message || 'Please try again.'));
    }
};

// Load Rooms
window.loadRooms = async function() {
    const container = document.getElementById('roomsTable');
    if (!container) return;
    
    try {
        container.innerHTML = '<p class="info-message">Loading rooms...</p>';
        
        const rooms = await apiRequest('/rooms');
        
        if (!Array.isArray(rooms)) {
            throw new Error('Invalid response format');
        }

        if (rooms.length === 0) {
            container.innerHTML = '<p class="info-message">No rooms found. Add your first room!</p>';
            return;
        }

        container.innerHTML = `
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Room Number</th>
                            <th>Type</th>
                            <th>Price/Night</th>
                            <th>Max Occupancy</th>
                            <th>Available</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rooms.map(room => {
                            const roomId = room._id || room.id || 'N/A';
                            return `
                            <tr>
                                <td><strong>${room.roomNumber || 'N/A'}</strong></td>
                                <td>${room.roomType || 'N/A'}</td>
                                <td><strong>${formatCurrency(room.price)}</strong></td>
                                <td>${room.maxOccupancy || 'N/A'}</td>
                                <td>
                                    <span class="status-badge ${room.isAvailable ? 'status-confirmed' : 'status-cancelled'}">
                                        ${room.isAvailable ? '✅ Available' : '❌ Unavailable'}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn btn-primary btn-sm" 
                                            onclick="editRoom('${roomId}')">Edit</button>
                                    <button class="btn btn-danger btn-sm" 
                                            onclick="deleteRoom('${roomId}')">Delete</button>
                                </td>
                            </tr>
                        `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Error loading rooms:', error);
        container.innerHTML = `<p class="info-message error">Error loading rooms: ${error.message || 'Please try again later.'}</p>`;
    }
};

// Open Room Modal
window.openRoomModal = function(roomId = null) {
    const modal = document.getElementById('roomModal');
    const form = document.getElementById('roomForm');
    const title = document.getElementById('roomModalTitle');

    if (!modal || !form || !title) return;

    if (roomId) {
        // Edit mode - load room data
        apiRequest(`/rooms/${roomId}`).then(room => {
            document.getElementById('roomId').value = room._id || room.id || '';
            document.getElementById('roomNumber').value = room.roomNumber || '';
            document.getElementById('roomType').value = room.roomType || '';
            document.getElementById('roomPrice').value = room.price || '';
            document.getElementById('roomDescription').value = room.description || '';
            document.getElementById('maxOccupancy').value = room.maxOccupancy || '';
            document.getElementById('roomAvailable').checked = room.isAvailable !== false;
            title.textContent = 'Edit Room';
            modal.style.display = 'block';
        }).catch(error => {
            console.error('Error loading room:', error);
            alert('Error loading room: ' + (error.message || 'Please try again.'));
        });
    } else {
        // Add mode
        form.reset();
        document.getElementById('roomId').value = '';
        title.textContent = 'Add New Room';
        modal.style.display = 'block';
    }
};

// Close Room Modal
if (document.querySelector('.close')) {
    document.querySelector('.close').addEventListener('click', () => {
        const modal = document.getElementById('roomModal');
        if (modal) modal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('roomModal');
        if (e.target === modal && modal) {
            modal.style.display = 'none';
        }
    });
}

// Edit Room
window.editRoom = function(roomId) {
    openRoomModal(roomId);
};

// Submit Room Form
if (document.getElementById('roomForm')) {
    document.getElementById('roomForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const roomId = document.getElementById('roomId').value;
        const roomData = {
            roomNumber: document.getElementById('roomNumber').value.trim(),
            roomType: document.getElementById('roomType').value,
            price: parseFloat(document.getElementById('roomPrice').value),
            description: document.getElementById('roomDescription').value.trim(),
            maxOccupancy: parseInt(document.getElementById('maxOccupancy').value),
            isAvailable: document.getElementById('roomAvailable').checked
        };

        if (!roomData.roomNumber || !roomData.roomType || !roomData.price || !roomData.maxOccupancy) {
            alert('Please fill in all required fields.');
            return;
        }

        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';

        try {
            if (roomId) {
                // Update
                await apiRequest(`/rooms/${roomId}`, {
                    method: 'PUT',
                    body: JSON.stringify(roomData)
                });
            } else {
                // Create
                await apiRequest('/rooms', {
                    method: 'POST',
                    body: JSON.stringify(roomData)
                });
            }

            document.getElementById('roomModal').style.display = 'none';
            await loadRooms();
        } catch (error) {
            console.error('Error saving room:', error);
            alert('Error saving room: ' + (error.message || 'Please try again.'));
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
}

// Delete Room
window.deleteRoom = async function(roomId) {
    if (!roomId) {
        alert('Invalid room ID.');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
        return;
    }

    try {
        await apiRequest(`/rooms/${roomId}`, {
            method: 'DELETE'
        });
        await loadRooms();
    } catch (error) {
        console.error('Error deleting room:', error);
        alert('Error deleting room: ' + (error.message || 'Please try again.'));
    }
};

// Load Messages
window.loadMessages = async function() {
    const container = document.getElementById('messagesTable');
    if (!container) return;
    
    try {
        container.innerHTML = '<p class="info-message">Loading messages...</p>';
        
        const messages = await apiRequest('/messages');
        
        if (!Array.isArray(messages)) {
            throw new Error('Invalid response format');
        }

        if (messages.length === 0) {
            container.innerHTML = '<p class="info-message">No messages found.</p>';
            return;
        }

        container.innerHTML = `
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Subject</th>
                            <th>Message</th>
                            <th>Date</th>
                            <th>Read</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${messages.map(message => {
                            const messageId = message._id || message.id || 'N/A';
                            const isRead = message.isRead || false;
                            return `
                            <tr class="${!isRead ? 'unread-message' : ''}">
                                <td><strong>${message.name || 'N/A'}</strong></td>
                                <td>${message.email || 'N/A'}</td>
                                <td>${message.subject || 'N/A'}</td>
                                <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" 
                                    title="${(message.message || '').replace(/"/g, '&quot;')}">
                                    ${message.message || 'N/A'}
                                </td>
                                <td>${formatDate(message.createdAt || message.created_at)}</td>
                                <td>
                                    <span class="status-badge ${isRead ? 'status-confirmed' : 'status-pending'}">
                                        ${isRead ? '✅ Read' : '❌ Unread'}
                                    </span>
                                </td>
                                <td>
                                    ${!isRead ? `
                                        <button class="btn btn-primary btn-sm" 
                                                onclick="markMessageAsRead('${messageId}')">Mark Read</button>
                                    ` : ''}
                                    <button class="btn btn-danger btn-sm" 
                                            onclick="deleteMessage('${messageId}')">Delete</button>
                                </td>
                            </tr>
                        `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Error loading messages:', error);
        container.innerHTML = `<p class="info-message error">Error loading messages: ${error.message || 'Please try again later.'}</p>`;
    }
};

// Mark Message as Read
window.markMessageAsRead = async function(messageId) {
    if (!messageId) {
        alert('Invalid message ID.');
        return;
    }
    
    try {
        await apiRequest(`/messages/${messageId}/read`, {
            method: 'PUT'
        });
        await loadMessages();
    } catch (error) {
        console.error('Error marking message as read:', error);
        alert('Error updating message: ' + (error.message || 'Please try again.'));
    }
};

// Delete Message
window.deleteMessage = async function(messageId) {
    if (!messageId) {
        alert('Invalid message ID.');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
        return;
    }

    try {
        await apiRequest(`/messages/${messageId}`, {
            method: 'DELETE'
        });
        await loadMessages();
    } catch (error) {
        console.error('Error deleting message:', error);
        alert('Error deleting message: ' + (error.message || 'Please try again.'));
    }
};

// ==================== CONTACT PAGE ====================

// Submit Contact Form
if (document.getElementById('contactForm')) {
    document.getElementById('contactForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const messageData = {
            name: document.getElementById('contactName').value,
            email: document.getElementById('contactEmail').value,
            subject: document.getElementById('contactSubject').value,
            message: document.getElementById('contactMessage').value
        };

        try {
            await apiRequest('/messages', {
                method: 'POST',
                body: JSON.stringify(messageData)
            });

            const messageDisplay = document.getElementById('contactMessageDisplay') || document.getElementById('contactMessage');
            if (messageDisplay) {
                showMessage(messageDisplay.id, 'Message sent successfully! We will get back to you soon.', 'success');
            } else {
                alert('Message sent successfully! We will get back to you soon.');
            }
            document.getElementById('contactForm').reset();
        } catch (error) {
            const messageDisplay = document.getElementById('contactMessageDisplay') || document.getElementById('contactMessage');
            if (messageDisplay) {
                showMessage(messageDisplay.id, 'Error sending message: ' + error.message, 'error');
            } else {
                alert('Error sending message: ' + error.message);
            }
        }
    });
}

