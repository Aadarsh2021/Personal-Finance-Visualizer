import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

console.log('MongoDB URI found:', MONGODB_URI ? 'Yes' : 'No');

let cached = {
  conn: null as mongoose.Mongoose | null,
  promise: null as Promise<mongoose.Mongoose> | null,
};

export async function connectToDatabase() {
  console.log('Attempting to connect to MongoDB...');
  
  if (cached.conn) {
    console.log('Using cached connection');
    if (cached.conn.connection.readyState === 1) {
      console.log('Cached connection is ready');
      return cached.conn;
    }
    console.log('Cached connection is not ready, clearing cache');
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    console.log('Creating new connection promise');
    const opts = {
      bufferCommands: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongoose) => {
      console.log('Successfully connected to MongoDB');
      mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error);
        cached.conn = null;
        cached.promise = null;
      });
      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        cached.conn = null;
        cached.promise = null;
      });
      return mongoose;
    }).catch((error) => {
      console.error('Failed to connect to MongoDB:', error);
      cached.conn = null;
      cached.promise = null;
      throw error;
    });
  }

  try {
    console.log('Waiting for connection promise...');
    cached.conn = await cached.promise;
    console.log('Connection established successfully');
    return cached.conn;
  } catch (error) {
    console.error('Error in connectToDatabase:', error);
    cached.conn = null;
    cached.promise = null;
    throw error;
  }
} 