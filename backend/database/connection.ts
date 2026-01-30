import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

export async function connectToDatabase() {
  try {
    
    if (!MONGODB_URI) throw new Error("MONGODB_URI is not defined in the environment variables")
    
    if (mongoose.connections[0].readyState) return

    await mongoose.connect(MONGODB_URI);
    console.log("Connected to database")
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[connectToDatabase error]: ${message}`);
    throw new Error(message);
  }
}
