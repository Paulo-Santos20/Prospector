import admin from 'firebase-admin';
import { db } from '../config/firebase.js';

const crmDocId = (uid, leadId) => `${uid}_${leadId}`;

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const leadSnapshot = (lead) => ({
  displayName: lead.displayName || null,
  formattedAddress: lead.formattedAddress || '',
  internationalPhoneNumber: lead.internationalPhoneNumber || '',
  nationalPhoneNumber: lead.nationalPhoneNumber || '',
  websiteUri: lead.websiteUri || '',
  rating: lead.rating ?? null,
  userRatingCount: lead.userRatingCount ?? 0,
  priceLevel: lead.priceLevel ?? null,
  analysis: {
    status: lead.analysis?.status || 'UNKNOWN',
    opportunityScore: lead.analysis?.opportunityScore ?? 0,
  },
});

const buildUpdate = (body) => {
  const update = {};
  for (const field of ['status', 'notes', 'tags', 'dealValue', 'followUpAt', 'proposalData']) {
    if (body[field] !== undefined) update[field] = body[field];
  }
  return update;
};

export const saveToCRM = async (req, res, next) => {
  try {
    const { leadId } = req.body;
    const leadDoc = await db.collection('leads').doc(leadId).get();

    if (!leadDoc.exists) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    const ref = db.collection('crm_leads').doc(crmDocId(req.user.uid, leadId));
    const existing = await ref.get();
    const now = admin.firestore.FieldValue.serverTimestamp();

    const payload = {
      ownerUid: req.user.uid,
      leadId,
      snapshot: leadSnapshot(leadDoc.data()),
      updatedAt: now,
    };

    if (!existing.exists) {
      Object.assign(payload, {
        status: 'SAVED',
        notes: '',
        tags: [],
        dealValue: null,
        followUpAt: null,
        createdAt: now,
      });
    }

    await ref.set(payload, { merge: true });
    const saved = await ref.get();

    res.status(200).json({ id: saved.id, ...saved.data() });
  } catch (error) {
    next(error);
  }
};

export const getCRMLeads = async (req, res, next) => {
  try {
    const snapshot = await db
      .collection('crm_leads')
      .where('ownerUid', '==', req.user.uid)
      .limit(500)
      .get();

    const leads = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));

    res.status(200).json(leads);
  } catch (error) {
    next(error);
  }
};

export const updateCRMLead = async (req, res, next) => {
  try {
    const ref = db.collection('crm_leads').doc(req.params.id);
    const snapshot = await ref.get();

    if (!snapshot.exists || snapshot.data().ownerUid !== req.user.uid) {
      return res.status(404).json({ error: 'Lead do CRM não encontrado' });
    }

    const update = buildUpdate(req.body);
    await ref.update({
      ...update,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ id: ref.id, ...(await ref.get()).data() });
  } catch (error) {
    next(error);
  }
};

export const updateCRMLeadByLeadId = async (req, res, next) => {
  try {
    const ref = db
      .collection('crm_leads')
      .doc(crmDocId(req.user.uid, req.params.leadId));
    const snapshot = await ref.get();

    if (!snapshot.exists || snapshot.data().ownerUid !== req.user.uid) {
      return res.status(404).json({ error: 'Lead do CRM não encontrado' });
    }

    const update = buildUpdate(req.body);
    await ref.update({
      ...update,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ id: ref.id, ...(await ref.get()).data() });
  } catch (error) {
    next(error);
  }
};

export const deleteCRMLead = async (req, res, next) => {
  try {
    const ref = db.collection('crm_leads').doc(req.params.id);
    const snapshot = await ref.get();

    if (!snapshot.exists || snapshot.data().ownerUid !== req.user.uid) {
      return res.status(404).json({ error: 'Lead do CRM não encontrado' });
    }

    await ref.delete();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
