import admin from 'firebase-admin';
import { db } from '../config/firebase.js';
import { getUsage } from '../services/usageService.js';

const defaultAgency = (email) => ({
  name: 'Minha Agência',
  logoUrl: '',
  phone: '',
  email: email || '',
  website: '',
  tone: '',
});

const serializeProfile = (uid, data, user) => ({
  uid,
  email: data?.email || user.email || '',
  displayName: data?.displayName || user.name || '',
  agency: { ...defaultAgency(user.email), ...(data?.agency || {}) },
});

export const getMe = async (req, res, next) => {
  try {
    const ref = db.collection('users').doc(req.user.uid);
    const snapshot = await ref.get();
    const now = admin.firestore.FieldValue.serverTimestamp();

    if (!snapshot.exists) {
      await ref.set({
        email: req.user.email,
        displayName: req.user.name || '',
        agency: defaultAgency(req.user.email),
        createdAt: now,
        updatedAt: now,
      });
    } else if (req.user.email && snapshot.data().email !== req.user.email) {
      await ref.set({ email: req.user.email, updatedAt: now }, { merge: true });
    }

    const data = (await ref.get()).data();
    const usage = await getUsage(req.user.uid);

    res.json({ ...serializeProfile(req.user.uid, data, req.user), usage });
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const ref = db.collection('users').doc(req.user.uid);
    const snapshot = await ref.get();
    const current = snapshot.data() || {};
    const now = admin.firestore.FieldValue.serverTimestamp();

    const update = {
      updatedAt: now,
      ...(req.body.displayName !== undefined ? { displayName: req.body.displayName } : {}),
      ...(req.body.agency !== undefined
        ? {
            agency: {
              ...defaultAgency(req.user.email),
              ...(current.agency || {}),
              ...req.body.agency,
            },
          }
        : {}),
    };

    await ref.set(update, { merge: true });
    const data = (await ref.get()).data();

    res.json(serializeProfile(req.user.uid, data, req.user));
  } catch (err) {
    next(err);
  }
};

export const getUsageHandler = async (req, res, next) => {
  try {
    res.json(await getUsage(req.user.uid));
  } catch (err) {
    next(err);
  }
};
