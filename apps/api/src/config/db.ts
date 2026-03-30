import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if(!mongoURI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }
  await mongoose.connect(mongoURI, {
    dbName: 'LinguaChat_V2',
    maxPoolSize: 10,
    minPoolSize: 2,
  });
  console.log("MongoDB Connected Successfully!!");

  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}; 

const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log("MongoDB Disconnected Successfully!!");
  } catch (error) {
    console.error("Error disconnecting from MongoDB:", error);
  }
};

export { connectDB, disconnectDB };
