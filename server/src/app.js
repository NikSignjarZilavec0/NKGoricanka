import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import MongoStore from 'connect-mongo';

import apiRoutes from './routes/index.js';
import { apiNotFound, errorHandler } from './middleware/errorHandler.js';
import { UPLOAD_DIR } from './middleware/upload.js';
import { createSeoMiddleware } from './seo/seoRenderer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp({ mongoUri, sessionSecret, siteUrl }) {
  const app = express();
  app.set('trust proxy', 1); // correct client IP / secure cookies behind a proxy

  // --- Security headers (CSP tuned to allow the SPA + OpenStreetMap embed) ---
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          connectSrc: ["'self'"],
          frameSrc: ['https://www.openstreetmap.org'],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // --- Sessions stored in MongoDB (survive restarts) ---
  app.use(
    session({
      name: 'nkg.sid',
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: mongoUri, ttl: 7 * 24 * 60 * 60 }),
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        // Behind an HTTPS reverse proxy (Caddy) set SECURE_COOKIES=true in .env.
        secure: process.env.SECURE_COOKIES === 'true',
      },
    })
  );

  // --- Uploaded images (mounted as a Docker volume) ---
  app.use(
    '/uploads',
    express.static(UPLOAD_DIR, {
      maxAge: '7d',
      setHeaders: (res) => res.set('Cross-Origin-Resource-Policy', 'same-origin'),
    })
  );

  // --- API ---
  app.use('/api', apiRoutes);
  app.use('/api', apiNotFound); // unknown /api/* → JSON 404

  // --- Serve the built React client + SEO-aware index.html fallback ---
  const clientDist = path.resolve(__dirname, '..', 'client-dist');
  const indexHtml = path.join(clientDist, 'index.html');

  if (fs.existsSync(indexHtml)) {
    // Static assets (hashed files) — long cache, but never the HTML shell.
    app.use(
      express.static(clientDist, {
        index: false,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
        },
      })
    );

    const seo = createSeoMiddleware({ templatePath: indexHtml, siteUrl });
    // All non-API GET routes → SPA shell with injected SEO tags.
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
      return seo(req, res, next);
    });
  } else {
    // Dev mode (Vite serves the client). Provide a tiny hint at the root.
    app.get('/', (req, res) =>
      res.json({ message: 'NK Goričanka API. Client je v dev načinu (Vite na 5173).' })
    );
  }

  app.use(errorHandler);
  return app;
}
