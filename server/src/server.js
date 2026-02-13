import app from './app.js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const PORT = process.env.PORT || 5000;

// O servidor só fica vivo por causa desta função listen
app.listen(PORT, () => {
  console.log(`
  ################################################
  🚀 Server listening on port: ${PORT}
  👉 http://localhost:${PORT}
  ################################################
  `);
});