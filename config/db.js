const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        mongoose.set('bufferCommands', false);
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Run index cleanup after connection
        await cleanupIndexes();

        return true;
    } catch (error) {
        console.error(`Database Connection Error: ${error.message}`);
        return false;
    }
};

const cleanupIndexes = async () => {
    try {
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        if (collectionNames.includes('offers')) {
            const offers = db.collection('offers');
            const indexes = await offers.indexes();
            if (indexes.some(idx => idx.name === 'id_1')) {
                await offers.dropIndex('id_1');
                console.log('Successfully dropped legacy [id_1] index from offers collection');
            }
        }

        // Add more legacy cleanups if needed in the future
    } catch (err) {
        console.warn('Index cleanup warning (non-critical):', err.message);
    }
};

module.exports = connectDB;
