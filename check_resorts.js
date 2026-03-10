const mongoose = require('mongoose');
const Booking = require('./models/Booking');
require('dotenv').config();

async function checkResorts() {
    await mongoose.connect(process.env.MONGODB_URI);
    const resorts = await Booking.distinct('resort');
    console.log('Unique resorts in DB:', resorts);

    const latest = await Booking.find().sort({ createdAt: -1 }).limit(5).select('resort createdAt totalAmount');
    console.log('Latest Bookings:', latest);

    await mongoose.disconnect();
}

checkResorts().catch(console.error);
