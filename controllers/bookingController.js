const Booking = require('../models/Booking');

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Public (for now, will add auth later)
const getBookings = async (req, res) => {
    try {
        let filter = {};

        // If user is a manager, they only see their assigned properties and exclude soft-deleted ones
        if (req.user.role === 'manager') {
            filter.resort = { $in: req.user.properties };
            filter.deletedByBranch = { $ne: true };
        }
        // General Manager sees all bookings including soft-deleted ones

        const bookings = await Booking.find(filter).sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Public
const createBooking = async (req, res) => {
    try {
        const resortNames = {
            'limuru': 'Jumuia Limuru Country Home',
            'kanamai': 'Jumuia Kanamai Beach Resort',
            'kisumu': 'Jumuia Hotel Kisumu'
        };

        const bookingData = { ...req.body };

        // Ensure bookingId exists
        if (!bookingData.bookingId) {
            bookingData.bookingId = `JUM-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        // Ensure resortName exists
        if (!bookingData.resortName && bookingData.resort) {
            bookingData.resortName = resortNames[bookingData.resort] || 'Jumuia Resort';
        }

        // Map guestName/firstName/lastName/fullName
        if (!bookingData.firstName && bookingData.guestName) {
            const parts = bookingData.guestName.split(' ');
            bookingData.firstName = parts[0] || 'Guest';
            bookingData.lastName = parts.slice(1).join(' ') || 'Guest';
            bookingData.fullName = bookingData.guestName;
        } else if (!bookingData.fullName && bookingData.firstName && bookingData.lastName) {
            bookingData.fullName = `${bookingData.firstName} ${bookingData.lastName}`;
        } else if (!bookingData.fullName) {
            bookingData.firstName = bookingData.firstName || 'Guest';
            bookingData.lastName = bookingData.lastName || 'Guest';
            bookingData.fullName = 'Guest User';
        }

        // Handle flat guests object vs nested
        if (bookingData.adults !== undefined || bookingData.children !== undefined) {
            bookingData.guests = {
                adults: parseInt(bookingData.adults) || 1,
                children: parseInt(bookingData.childrenCount) || parseInt(bookingData.children) || 0
            };
        }

        // Build guestName if not provided
        if (!bookingData.guestName && bookingData.fullName) {
            bookingData.guestName = bookingData.fullName;
        }

        const newBooking = new Booking(bookingData);
        const savedBooking = await newBooking.save();
        res.status(201).json(savedBooking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Public
const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findOne({ bookingId: req.params.id });
        if (booking) {
            res.json(booking);
        } else {
            res.status(404).json({ message: 'Booking not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a booking
// @route   PUT /api/bookings/:id
// @desc    Update a booking
// @route   PUT /api/bookings/:id
// @access  Private (Admin/Manager)
const updateBooking = async (req, res) => {
    try {
        const query = req.params.id.startsWith('BOOK-') || req.params.id.startsWith('JUM-')
            ? { bookingId: req.params.id }
            : { _id: req.params.id };

        const booking = await Booking.findOne(query);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (req.user.role === 'manager' && !req.user.properties.includes(booking.resort)) {
            return res.status(403).json({ message: 'Not authorized to update this property' });
        }

        const updatedBooking = await Booking.findOneAndUpdate(
            query,
            req.body,
            { new: true, runValidators: true }
        );

        res.json(updatedBooking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a booking
// @route   DELETE /api/bookings/:id
// @access  Private (Admin/Manager)
const deleteBooking = async (req, res) => {
    try {
        const query = req.params.id.startsWith('BOOK-') || req.params.id.startsWith('JUM-')
            ? { bookingId: req.params.id }
            : { _id: req.params.id };

        const booking = await Booking.findOne(query);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Branch Manager logic: Soft Delete
        if (req.user.role === 'manager') {
            if (!req.user.properties.includes(booking.resort)) {
                return res.status(403).json({ message: 'Not authorized to delete this property booking' });
            }

            booking.deletedByBranch = true;
            booking.deletedByAdminName = req.user.name || 'Branch Manager';
            booking.deletedAt = new Date();
            await booking.save();

            return res.json({ message: 'Booking soft-deleted by branch manager', booking });
        }

        // General Manager logic: Permanent Delete
        if (req.user.role === 'general-manager' || req.user.role === 'admin') {
            await Booking.findOneAndDelete(query);
            return res.json({ message: 'Booking permanently deleted by general manager' });
        }

        res.status(403).json({ message: 'Not authorized for this action' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark booking as read
// @route   PUT /api/bookings/:id/read
// @access  Private (Admin/Manager)
const markAsRead = async (req, res) => {
    try {
        const query = req.params.id.startsWith('BOOK-') || req.params.id.startsWith('JUM-')
            ? { bookingId: req.params.id }
            : { _id: req.params.id };

        const booking = await Booking.findOneAndUpdate(
            query,
            { isRead: true },
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.json({ message: 'Marked as read', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getBookings,
    createBooking,
    getBookingById,
    updateBooking,
    deleteBooking,
    markAsRead
};
