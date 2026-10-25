import admin from 'firebase-admin';
import { db } from '../config/firebase.js';
import { env } from '../config/env.js';
import { usageDateKey, usageDocId } from '../utils/usage.js';

const LIMITS = {
  searches: env.MAX_SEARCHES_PER_DAY,
  analyses: env.MAX_ANALYSES_PER_DAY,
  aiCalls: env.MAX_AI_CALLS_PER_DAY,
};

export const getUsage = async (uid, date = new Date()) => {
  const snapshot = await db.collection('usage').doc(usageDocId(uid, date)).get();
  const data = snapshot.data() || {};

  return {
    date: usageDateKey(date),
    searches: data.searches || 0,
    analyses: data.analyses || 0,
    aiCalls: data.aiCalls || 0,
    limits: LIMITS,
  };
};

export const consumeQuota = async (uid, kind, amount = 1) => {
  const limit = LIMITS[kind];
  if (!limit) throw new Error(`Quota desconhecida: ${kind}`);

  const ref = db.collection('usage').doc(usageDocId(uid));

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const used = snapshot.data()?.[kind] || 0;

    if (used + amount > limit) {
      return { allowed: false, used, limit };
    }

    transaction.set(
      ref,
      {
        ownerUid: uid,
        date: usageDateKey(),
        [kind]: admin.firestore.FieldValue.increment(amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { allowed: true, used: used + amount, limit };
  });
};
