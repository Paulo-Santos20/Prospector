import axios from 'axios';
import * as cheerio from 'cheerio';

export const findSocialLinks = async (companyName, address) => {
  try {
    const city = address ? address.split(',').slice(-2).join(' ') : '';
    // Query expandida para as 3 plataformas
    const query = `"${companyName}" ${city} (site:instagram.com OR site:facebook.com OR site:ifood.com.br)`;
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      },
      timeout: 5000
    });

    const $ = cheerio.load(response.data);
    const links = [];

    $('.result__url').each((i, el) => {
      const linkText = $(el).text().trim().toLowerCase();
      
      // Captura Instagram
      if (linkText.includes('instagram.com') && !linkText.includes('/p/') && !links.find(l => l.network === 'instagram')) {
        links.push({ network: 'instagram', url: `https://${linkText.replace(/\s/g, '')}` });
      }
      
      // Captura Facebook
      if (linkText.includes('facebook.com') && !linkText.includes('/sharer') && !links.find(l => l.network === 'facebook')) {
        links.push({ network: 'facebook', url: `https://${linkText.replace(/\s/g, '')}` });
      }
      
      // Captura iFood
      if (linkText.includes('ifood.com.br') && !links.find(l => l.network === 'ifood')) {
        links.push({ network: 'ifood', url: `https://${linkText.replace(/\s/g, '')}` });
      }
    });

    return links;
  } catch (error) {
    console.error('Erro ao buscar redes sociais:', error.message);
    return [];
  }
};