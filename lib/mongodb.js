import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        console.log('Using cached database connection');
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts)
            .then((mongoose) => {
                console.log('Connected to MongoDB');
                console.log('Database name:', mongoose.connections[0].name);
                const collections = mongoose.connections[0].collections;
                console.log('Collections:', Object.keys(collections));
                return mongoose;
            })
            .catch((error) => {
                console.error('Failed to connect to MongoDB', error);
                throw error;
            });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

export default dbConnect;
