import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import leadsRoutes from './routes/leadsRoutes.js'; // Importante o .js no final

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Rotas
app.use('/api/leads', leadsRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'Lead Scout API v1' });
});

export default app;