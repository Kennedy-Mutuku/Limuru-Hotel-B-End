const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        mongoose.set('bufferCommands', false); // Disable buffering globally
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return true;
    } catch (error) {
        console.error(`Database Connection Error: ${error.message}`);
        return false;
    }
};

module.exports = connectDB;
