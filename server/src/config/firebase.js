import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

let serviceAccount;

try {
  // 1. TENTA CARREGAR DA NUVEM (Variável de Ambiente do Render)
  if (process.env.FIREBASE_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_JSON);
    console.log("✅ Chave do Firebase carregada da Variável de Ambiente (Render)!");
  } 
  // 2. TENTA CARREGAR DO PC LOCAL (Sua máquina)
  else {
    const localPath = path.resolve(process.cwd(), 'src/config/firebase-service-account.json');
    if (existsSync(localPath)) {
      serviceAccount = JSON.parse(readFileSync(localPath, 'utf8'));
      console.log("✅ Chave do Firebase carregada do arquivo local!");
    } else {
      throw new Error('Credenciais do Firebase não encontradas na Variável nem no Arquivo!');
    }
  }

  // Inicializa o Banco de Dados
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Conexão com Firebase Firestore estabelecida com sucesso!");
  }
} catch (error) {
  console.error("❌ Erro Crítico no Firebase:", error.message);
}

export const db = admin.firestore();