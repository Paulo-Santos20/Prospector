import { db } from '../config/firebase.js';

export const getGlobalStats = async (req, res, next) => {
  try {
    const [crmSnapshot, proposalsCount] = await Promise.all([
      db.collection('crm_leads').where('ownerUid', '==', req.user.uid).get(),
      db.collection('proposals').where('ownerUid', '==', req.user.uid).count().get(),
    ]);

    const leads = crmSnapshot.docs.map((doc) => doc.data());
    const contacted = leads.filter((lead) => lead.status && lead.status !== 'SAVED').length;
    const won = leads.filter((lead) => lead.status === 'WON').length;
    const rate = contacted > 0 ? Math.round((won / contacted) * 1000) / 10 : 0;

    res.json({
      totalLeads: leads.length,
      totalProposals: proposalsCount.data().count,
      rate,
      contacted,
      won,
    });
  } catch (error) {
    next(error);
  }
};
