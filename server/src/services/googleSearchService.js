import googleIt from 'google-it';

export const findEmailViaSearch = async (businessName, location) => {
  try {
    // Query mais agressiva incluindo o termo "contato@"
    const query = `"${businessName}" ${location} "contato@" OR "email" OR "e-mail"`;
    console.log(`🔎 [SEARCH] Pesquisando: ${query}`);

    const results = await googleIt({ query, limit: 5, disableConsole: true });
    const emails = new Set();
    
    // Regex melhorada
    const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    results.forEach((res) => {
      // Escaneamos o título e o snippet
      const fullText = `${res.title} ${res.snippet}`;
      const matches = fullText.match(EMAIL_REGEX);
      if (matches) {
        matches.forEach(e => emails.add(e.toLowerCase()));
      }
    });

    const found = Array.from(emails);
    if (found.length > 0) {
      console.log(`✨ [SEARCH] E-mails encontrados: ${found.join(', ')}`);
    }
    return found;
  } catch (error) {
    return [];
  }
};