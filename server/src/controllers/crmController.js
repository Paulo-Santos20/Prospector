import { db } from '../config/firebase.js';

// Salvar lead no Kanban (Favoritar)
export const saveToCRM = async (req, res) => {
  try {
    const { lead } = req.body;
    const crmRef = db.collection('crm_leads').doc(lead.id);
    
    await crmRef.set({
      ...lead,
      crmStatus: 'SAVED', // SAVED, PROPOSAL, NEGOTIATION, CLOSED
      notes: '',
      savedAt: new Date().toISOString()
    });

    res.status(200).json({ message: 'Lead adicionado ao CRM com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Listar todos os leads do Kanban
export const getCRMLeads = async (req, res) => {
  try {
    const snapshot = await db.collection('crm_leads').get();
    const leads = snapshot.docs.map(doc => doc.data());
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Atualizar a coluna do Kanban ou as Anotações
export const updateCRMLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { crmStatus, notes } = req.body;
    
    const updateData = {};
    if (crmStatus) updateData.crmStatus = crmStatus;
    if (notes !== undefined) updateData.notes = notes;

    await db.collection('crm_leads').doc(id).update(updateData);
    
    res.status(200).json({ message: 'CRM atualizado com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};