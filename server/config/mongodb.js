import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pre-load environment configuration
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

let isConnected = false;

export async function connectMongoDB() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gym2';

  if (isConnected && mongoose.connection.readyState === 1) return true;

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });

    isConnected = true;
    const sanitizedUri = mongoUri.includes('@') ? mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') : mongoUri;
    
    console.log(`====================================================`);
    console.log(`🍃 MONGODB ATLAS DATABASE CONNECTED SUCCESSFULLY`);
    console.log(`📡 CONNECTION URI: ${sanitizedUri}`);
    console.log(`====================================================`);

    // Dynamically trigger MongoDB database sync once connected
    const { syncWithMongoDB } = await import('./db.js');
    await syncWithMongoDB();

    return true;
  } catch (err) {
    console.warn(`====================================================`);
    console.warn(`⚠️ MONGODB CONNECTION WARNING: ${err.message}`);
    console.warn(`🔄 ACTIVE FALLBACK: FILE-BASED DUAL JSON DATABASE ACTIVE (db.json)`);
    console.warn(`====================================================`);
    return false;
  }
}

export function isMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

