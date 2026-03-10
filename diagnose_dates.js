const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const JobApplication = require('./models/JobApplication');
const Bid = require('./models/Bid');
const OfferClaim = require('./models/OfferClaim');
require('dotenv').config();

async function diagnose() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const now = new Date();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setUTCDate(now.getUTCDate() - 13);

    const latestBooking = await Booking.findOne().sort({ createdAt: -1 });
    const latestApp = await JobApplication.findOne().sort({ createdAt: -1 });
    const latestBid = await Bid.findOne().sort({ createdAt: -1 });

    console.log('Latest Booking:', latestBooking ? latestBooking.createdAt : 'None');
    console.log('Latest Application:', latestApp ? latestApp.createdAt : 'None');
    console.log('Latest Bid:', latestBid ? latestBid.createdAt : 'None');

    const bookingsInRange = await Booking.countDocuments({ createdAt: { $gte: fourteenDaysAgo } });
    console.log('Bookings in last 14 days:', bookingsInRange);

    await mongoose.disconnect();
}

diagnose().catch(console.error);
