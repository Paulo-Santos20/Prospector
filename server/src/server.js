import express from 'express';
import cors from 'cors';
import { getLeads } from './controllers/leadsController.js';
import { getGlobalStats } from './controllers/statsController.js'; // Importe o novo controller

const app = express();
app.use(cors());
app.use(express.json());

// Rotas
app.post('/api/leads/search', getLeads);
app.get('/api/stats', getGlobalStats); // ADICIONE ESTA LINHA PARA TIRAR O ERRO 404

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server rodando na porta ${PORT}`);
});