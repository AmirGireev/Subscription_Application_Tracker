import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import subscriptionsRouter from './routes/subscriptions';
import { errorHandler } from './middleware/error';

const app = express();
app.use(cors({
  origin: 'https://subscription-tracker-r2u5.onrender.com'
}));
app.use(express.json());
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use(errorHandler);

export default app;