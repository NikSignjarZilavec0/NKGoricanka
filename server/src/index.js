import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { runSeed } from './seed/seed.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nkgoricanka';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-me';
const SITE_URL = (process.env.SITE_URL || `http://localhost:${PORT}`).replace(/\/$/, '');

async function start() {
  try {
    await connectDB(MONGO_URI);
    await runSeed(); // idempotent: admin + content only if empty

    const app = createApp({ mongoUri: MONGO_URI, sessionSecret: SESSION_SECRET, siteUrl: SITE_URL });
    app.listen(PORT, () => {
      console.log(`[server] NK Goričanka running on ${SITE_URL} (port ${PORT})`);
    });
  } catch (err) {
    console.error('[server] Failed to start:', err);
    process.exit(1);
  }
}

start();
