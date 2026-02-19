import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

let serviceAccount;

// O servidor vai procurar a chave nestes 3 lugares automaticamente:
const pathsToCheck = [
  path.resolve(process.cwd(), 'src/config/firebase-service-account.json'), // 1. Onde fica no seu PC local
  path.resolve(process.cwd(), 'firebase-service-account.json'), // 2. Onde o Render joga o Secret File por padrão
  '/etc/secrets/firebase-service-account.json' // 3. Pasta alternativa de segurança do Render
];

let foundPath = null;
for (const p of pathsToCheck) {
  if (existsSync(p)) {
    foundPath = p;
    break;
  }
}

try {
  if (foundPath) {
    serviceAccount = JSON.parse(readFileSync(foundPath, 'utf8'));
    console.log(`✅ Chave do Firebase encontrada em: ${foundPath}`);
  } else {
    throw new Error('Arquivo JSON do Firebase não encontrado em nenhum caminho!');
  }

  // Inicializa o Firebase apenas se ele ainda não estiver rodando
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