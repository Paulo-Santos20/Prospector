import axios from 'axios';
import * as cheerio from 'cheerio';

export const findInstagramProfile = async (companyName, address) => {
  try {
    // Pega só a cidade/estado para a busca não ficar confusa
    const city = address ? address.split(',').slice(-2).join(' ') : '';
    
    // Cria uma busca "Dorking" (Força o buscador a achar APENAS perfis do Instagram)
    const query = `site:instagram.com "${companyName}" ${city}`;
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    // Disfarça a requisição para o servidor achar que é um navegador real
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 5000 // Cancela se demorar mais de 5s para não travar o seu site
    });

    const $ = cheerio.load(response.data);
    let instaLink = null;

    // Vasculha os resultados
    $('.result__url').each((i, el) => {
      const linkText = $(el).text().trim();
      
      // Se achou um link do insta que não seja página de hashtag (/explore) ou post específico (/p/)
      if (linkText.includes('instagram.com') && !linkText.includes('/explore/') && !linkText.includes('/p/')) {
        // Limpa o link para entregar a URL perfeita
        instaLink = `https://${linkText.replace(/ /g, '')}`;
        return false; // Para a busca no primeiro resultado válido (o mais relevante)
      }
    });

    return instaLink;
  } catch (error) {
    console.warn(`⚠️ Aviso: Falha ao buscar Instagram de ${companyName} -`, error.message);
    return null;
  }
};