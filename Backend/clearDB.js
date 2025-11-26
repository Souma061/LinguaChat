import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import { Message } from './models.js';

dotenv.config();

async function clearDatabase() {
  try {
    await connectDB();

    // Drop the Message collection to clear all old data and indexes
    await Message.collection.drop();
    console.log('✅ Message collection dropped successfully');

    // Close the connection
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    if (error.message.includes('ns not found')) {
      console.log('✅ Collection did not exist, nothing to drop');
      await mongoose.disconnect();
      process.exit(0);
    } else {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

clearDatabase();
