// imports
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import subscriptionsRouter from './routes/subscriptions';
import { errorHandler } from './middleware/error';

// app
const app = express();
// allowed origins
const allowedOrigins = [
  'https://subscription-tracker-r2u5.onrender.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
];

// cors
app.use(cors({
  origin: function (origin, callback) {
    // no origin
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('Blocked by CORS'), false);
    }
    return callback(null, true);
  }
}));

// json parsing
app.use(express.json());
// health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
// routes
app.use('/api/auth', authRouter);
app.use('/api/subscriptions', subscriptionsRouter);
// error handler
app.use(errorHandler);

export default app;