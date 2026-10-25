import admin from 'firebase-admin';
import { db } from '../src/config/firebase.js';
import { env } from '../src/config/env.js';

const ownerUid = process.argv[2] || env.OWNER_UID;
const dryRun = process.argv.includes('--dry-run');

if (!ownerUid) {
  console.error('Uso: node scripts/migrate-owner.js <OWNER_UID> [--dry-run]');
  process.exit(1);
}

const snapshotFor = (data, leadId) =>
  data.snapshot || {
    displayName: data.displayName || null,
    formattedAddress: data.formattedAddress || '',
    internationalPhoneNumber: data.internationalPhoneNumber || '',
    nationalPhoneNumber: data.nationalPhoneNumber || '',
    websiteUri: data.websiteUri || '',
    rating: data.rating ?? null,
    userRatingCount: data.userRatingCount ?? 0,
    priceLevel: data.priceLevel ?? null,
    analysis: {
      status: data.analysis?.status || 'UNKNOWN',
      opportunityScore: data.analysis?.opportunityScore ?? 0,
    },
  };

const run = async () => {
  const crmSnapshot = await db.collection('crm_leads').get();
  const now = admin.firestore.Timestamp.now();
  let migrated = 0;
  let skipped = 0;

  for (const doc of crmSnapshot.docs) {
    const data = doc.data();

    if (data.ownerUid) {
      skipped += 1;
      continue;
    }

    const leadId = data.leadId || doc.id;
    const payload = {
      ownerUid,
      leadId,
      status: data.status || data.crmStatus || 'SAVED',
      notes: data.notes || '',
      tags: data.tags || [],
      dealValue: data.dealValue ?? null,
      followUpAt: data.followUpAt ?? null,
      snapshot: snapshotFor(data, leadId),
      createdAt: data.createdAt || data.savedAt || now,
      updatedAt: data.updatedAt || now,
    };

    if (data.proposalData !== undefined) payload.proposalData = data.proposalData;

    console.log(
      `${dryRun ? '[dry-run] ' : ''}${doc.id} -> ${ownerUid}_${leadId} (${payload.status})`
    );

    if (!dryRun) {
      await db
        .collection('crm_leads')
        .doc(`${ownerUid}_${leadId}`)
        .set(payload, { merge: true });
    }

    migrated += 1;
  }

  console.log(
    `\nMigração ${dryRun ? 'simulada' : 'concluída'}: ${migrated} migrados, ${skipped} já possuíam ownerUid.`
  );
  console.log('Documentos antigos foram mantidos; eles não aparecem mais por causa do filtro ownerUid.');
};

run().catch((error) => {
  console.error('Falha na migração:', error);
  process.exit(1);
});
