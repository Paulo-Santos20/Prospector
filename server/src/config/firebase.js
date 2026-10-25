import fs from 'node:fs';
import admin from 'firebase-admin';
import { env, hasFirebaseCredentials, localFirebasePath } from './env.js';

const buildServiceAccount = () => {
  if (env.FIREBASE_JSON) {
    return JSON.parse(env.FIREBASE_JSON);
  }

  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    return {
      project_id: env.FIREBASE_PROJECT_ID,
      client_email: env.FIREBASE_CLIENT_EMAIL,
      private_key: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  if (fs.existsSync(localFirebasePath)) {
    return JSON.parse(fs.readFileSync(localFirebasePath, 'utf8'));
  }

  return null;
};

const serviceAccount = hasFirebaseCredentials ? buildServiceAccount() : null;

if (!admin.apps.length) {
  admin.initializeApp(
    serviceAccount
      ? { credential: admin.credential.cert(serviceAccount) }
      : { projectId: env.FIREBASE_PROJECT_ID || 'demo-prospector' }
  );
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
