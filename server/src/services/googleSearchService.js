import googleIt from 'google-it';
import { EMAIL_REGEX } from '../utils/patterns.js';

export const findEmailViaSearch = async (businessName, location) => {
  try {
    const searchTerm = `${businessName} ${location} email contato`;
    console.log(`🔎 Fazendo busca profunda no Google para: ${searchTerm}`);
    
    const results = await googleIt({ 
      query: searchTerm, 
      limit: 5,
      disableConsole: true 
    });

    const foundEmails = new Set();

    results.forEach(result => {
      // Procura e-mails no snippet (resumo) do Google
      const matches = result.snippet.match(EMAIL_REGEX);
      if (matches) {
        matches.forEach(email => foundEmails.add(email.toLowerCase()));
      }
    });

    return Array.from(foundEmails);
  } catch (error) {
    console.error('Erro na busca profunda:', error.message);
    return [];
  }
};