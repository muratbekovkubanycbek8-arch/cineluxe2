import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import movieRoutes from './routes/movie.js';
import subscriptionRoutes from './routes/subscription.js';

import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Database Connection: Try Local MongoDB first, fallback to Memory
const connectDB = async () => {
  try {
    // Attempt local MongoDB on standard port
    await mongoose.connect('mongodb://127.0.0.1:27017/cinemadb', { serverSelectionTimeoutMS: 2000 });
    console.log('Connected to Local MongoDB (cinemadb) successfully! Data is now permanent.');
  } catch (err) {
    console.log('Local MongoDB not found, falling back to In-Memory Database for testing...');
    try {
      const mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);
      console.log('Connected to In-Memory MongoDB automatically! (' + uri + ')');
    } catch (memErr) {
      console.log('Memory DB connection error:', memErr);
    }
  }
};
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
