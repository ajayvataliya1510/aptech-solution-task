import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';

import authRoutes from './routes/auth.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Basic health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date() });
});

// App Routes
app.use('/api/auth', authRoutes);

app.use(errorHandler);

const PORT = env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
