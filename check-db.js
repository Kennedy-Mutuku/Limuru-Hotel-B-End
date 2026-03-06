const mongoose = require('mongoose');
require('dotenv').config();

const checkResorts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jumuia-resorts');
        console.log('Connected to MongoDB');

        const Booking = mongoose.model('Booking', new mongoose.Schema({ resort: String }));

        const resorts = await Booking.distinct('resort');
        console.log('Distinct Resorts in Bookings:', resorts);

        const counts = await Booking.aggregate([
            { $group: { _id: "$resort", count: { $sum: 1 } } }
        ]);
        console.log('Booking counts by resort:', counts);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkResorts();
