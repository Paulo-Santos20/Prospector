import { db } from '../config/firebase.js';

export const getGlobalStats = async (req, res) => {
  try {
    // Busca o total real de documentos na coleção 'leads'
    const leadsSnapshot = await db.collection('leads').count().get();
    const totalLeads = leadsSnapshot.data().count;

    // Simulando propostas (em breve criaremos a coleção de proposals)
    const totalProposals = Math.floor(totalLeads * 0.4); 

    res.json({
      totalLeads: totalLeads || 0,
      totalProposals: totalProposals || 0,
      rate: 12.5
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};