import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface GlobalWithMongoose {
  mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

declare const global: GlobalWithMongoose;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    if (mongoose.connection.readyState === 1) {
      return cached.conn;
    }
    // If connection is not ready, clear cache and reconnect
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true,
      maxPoolSize: 25, // Increased pool size for better concurrent performance
      minPoolSize: 5, // Maintain minimum connections
      serverSelectionTimeoutMS: 5000, // Reduced timeout for faster failure detection
      socketTimeoutMS: 30000, // Reduced socket timeout
      family: 4,
      connectTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
      autoIndex: process.env.NODE_ENV !== 'production', // Disable auto-indexing in production
      // Add connection pool monitoring
      monitorCommands: process.env.NODE_ENV !== 'production',
    };

    mongoose.set('debug', process.env.NODE_ENV !== 'production');

    cached.promise = mongoose.connect(MONGODB_URI!, opts)
      .then((mongoose) => {
        // Add connection event handlers
        mongoose.connection.on('connected', () => {
          console.log('MongoDB connected successfully');
        });

        mongoose.connection.on('error', (err) => {
          console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
          console.log('MongoDB disconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
          await mongoose.connection.close();
          process.exit(0);
        });

        return mongoose;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
} 