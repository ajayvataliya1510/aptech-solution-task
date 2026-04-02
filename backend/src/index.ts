import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { connectDatabase } from './config/prisma';
import { redis } from './config/redis';
import routes from './routes';

// Initialize Background Workers
import './jobs/export.worker';

const app = express();

// 1. CORS Configuration & Header Hardening
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Dynamic Origin Reflection
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle Preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// 2. Security & Utilities
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json());
app.use(morgan('dev'));

// 3. Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date() });
});

// 4. App Routes (Consolidated)
app.use('/api', routes);

// 5. Error Handling
app.use(errorHandler);

const PORT = env.PORT || 4000;

const startServer = async () => {
  // Connect to DB first — exit if it fails
  await connectDatabase();

  // Check Redis connectivity
  try {
    await redis.ping();
    console.log('✅ Redis connected successfully');
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
  });
};

startServer();
