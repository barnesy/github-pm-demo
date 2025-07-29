const mongoose = require('mongoose');

const connectDB = async () => {
    const maxRetries = 5;
    let retries = 0;
    
    while (retries < maxRetries) {
        try {
            const conn = await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            
            console.log(`MongoDB Connected: ${conn.connection.host}`);
            
            // Handle connection events
            mongoose.connection.on('error', (err) => {
                console.error(`MongoDB connection error: ${err}`);
            });
            
            mongoose.connection.on('disconnected', () => {
                console.log('MongoDB disconnected');
            });
            
            // Graceful shutdown
            process.on('SIGINT', async () => {
                await mongoose.connection.close();
                console.log('MongoDB connection closed through app termination');
                process.exit(0);
            });
            
            return conn;
        } catch (error) {
            retries++;
            console.error(`Failed to connect to MongoDB (attempt ${retries}/${maxRetries}):`, error.message);
            
            if (retries === maxRetries) {
                console.error('Max retries reached. Exiting...');
                process.exit(1);
            }
            
            // Wait before retrying (exponential backoff)
            const waitTime = Math.min(1000 * Math.pow(2, retries - 1), 10000);
            console.log(`Retrying in ${waitTime / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
};

module.exports = connectDB;