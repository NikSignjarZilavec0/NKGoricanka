import mongoose from 'mongoose';

/**
 * Connect to MongoDB with a simple retry loop so the app can start before
 * Mongo is fully ready (belt-and-suspenders next to the compose healthcheck).
 */
export async function connectDB(uri, { retries = 10, delayMs = 3000 } = {}) {
  mongoose.set('strictQuery', true);

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await mongoose.connect(uri);
      console.log('[db] Connected to MongoDB');
      return mongoose.connection;
    } catch (err) {
      console.warn(
        `[db] Connection attempt ${attempt}/${retries} failed: ${err.message}`
      );
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
