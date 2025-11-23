import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI,{
      dbName: 'LinguaChat',
      maxPoolSize : 10,
      minPoolSize : 2,
    });
    console.log("MongoDB connected");

  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  } catch (error) {
    console.error("MongoDB disconnection error:", error);
  }
};
