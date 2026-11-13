import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import shipmentRoutes from './routes/shipments.js';
import imageRoutes from './routes/images.js';
import geocodeRoutes from './routes/geocode.js';
import { createSession } from './authStore.js';
import { verifySupabaseConnection } from './supabaseAdmin.js';

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VITE_SUPABASE_URL exists:', !!process.env.VITE_SUPABASE_URL);
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('SUPABASE_SERVICE_ROLE exists:', !!process.env.SUPABASE_SERVICE_ROLE);
console.log('SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY);
console.log('ADMIN_PASSWORD exists:', !!process.env.ADMIN_PASSWORD);

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 8787;

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] RESPONSE ${req.method} ${req.originalUrl} ${res.statusCode}`);
  });
  next();
});

app.use(cors());
app.use(express.json());

app.get('/ping', (req, res) => res.status(200).type('text/plain').send('OK'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

// DEV ONLY: create a temporary admin session token for local testing.
// This endpoint is intentionally available only when not in production.
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/dev/token', (req, res) => {
    const token = createSession();
    res.json({ token });
  });
}

app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/geocode', geocodeRoutes);

app.use((err, req, res, next) => {
  console.error('UNHANDLED ERROR', err);
  const payload = {
    error: err.message || 'Internal Server Error',
  };
  if (process.env.NODE_ENV !== 'production') {
    payload.details = err.details || err.hint || JSON.stringify(err, Object.getOwnPropertyNames(err));
    payload.stack = err.stack;
  }
  res.status(err.status || 500).json(payload);
});

(async () => {
  try {
    await verifySupabaseConnection();
  } catch (err) {
    console.error('Supabase verification failed at startup', err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`ShipTrack API listening on http://localhost:${PORT}`);
  });
})();

// Global error handlers to prevent silent exits and surface useful logs
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
