import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import subscriptionsRouter from './routes/subscriptions';
import { errorHandler } from './middleware/error';

const app = express();
const allowedOrigins = [
  'https://subscription-tracker-r2u5.onrender.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Erlaube Anfragen ohne Origin (z.B. Server-to-Server, Postman oder Same-Origin auf Render)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('Blocked by CORS'), false);
    }
    return callback(null, true);
  }
}));

app.use(express.json());
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use(errorHandler);

export default app;