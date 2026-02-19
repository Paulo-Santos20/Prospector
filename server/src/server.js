import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getLeads, getSocials } from './controllers/leadsController.js';
import { getGlobalStats } from './controllers/statsController.js';
import { saveToCRM, getCRMLeads, updateCRMLead } from './controllers/crmController.js'; 

dotenv.config();
const app = express();

// --- CORREÇÃO DO CORS: Link exato, sem barra "/" no final ---
const allowedOrigins = [
  'http://localhost:5173', 
  'https://prospector-dun.vercel.app' 
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado pelo CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// Rotas Antigas
app.post('/api/leads/search', getLeads);
app.post('/api/leads/socials', getSocials);
app.get('/api/stats', getGlobalStats);

// NOVAS ROTAS DE CRM
app.post('/api/crm', saveToCRM);
app.get('/api/crm', getCRMLeads);
app.put('/api/crm/:id', updateCRMLead);

app.get('/', (req, res) => {
  res.status(200).json({ status: 'Online', message: 'Prospector API 🚀' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server rodando na porta ${PORT}`));