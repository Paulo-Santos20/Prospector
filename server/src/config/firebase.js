import admin from 'firebase-admin';
import { readFile } from 'fs/promises';

const serviceAccount = JSON.parse(
  await readFile(new URL('./firebase-service-account.json', import.meta.url))
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // Forçamos o projectId direto do arquivo JSON
    projectId: serviceAccount.project_id 
  });
}

// Exportamos o db garantindo as configurações de silenciar undefineds
export const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

export default admin;