import axios from 'axios';
import * as cheerio from 'cheerio';

export const findSocialLinks = async (companyName, address) => {
  try {
    const city = address ? address.split(',').slice(-2).join(' ') : '';
    // Simplificamos a query para o buscador não se confundir
    const query = `${companyName} ${city} instagram facebook ifood`;
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      },
      timeout: 5000
    });

    const $ = cheerio.load(response.data);
    const links = [];

    // Buscamos em todos os links de resultados (classe .result__a)
    $('a.result__a').each((i, el) => {
      const href = $(el).attr('href') || '';
      const url = href.toLowerCase();
      
      // Captura Instagram
      if (url.includes('instagram.com') && !url.includes('/p/') && !url.includes('/explore/') && !links.find(l => l.network === 'instagram')) {
        links.push({ network: 'instagram', url: href });
      }
      
      // Captura Facebook
      if (url.includes('facebook.com') && !url.includes('/sharer') && !links.find(l => l.network === 'facebook')) {
        links.push({ network: 'facebook', url: href });
      }
      
      // Captura iFood
      if (url.includes('ifood.com.br') && !links.find(l => l.network === 'ifood')) {
        links.push({ network: 'ifood', url: href });
      }
    });

    console.log(`🔎 [SCRAPER] Resultados para ${companyName}:`, links.map(l => l.network));
    return links;
  } catch (error) {
    return [];
  }
};