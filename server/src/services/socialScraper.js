import axios from 'axios';
import * as cheerio from 'cheerio';

export const findSocialLinks = async (companyName, address) => {
  try {
    const city = address ? address.split(',').slice(-2).join(' ') : '';
    // Query ultra-refinada para o Google
    const query = `${companyName} ${city} instagram facebook ifood`;
    
    // Utilizamos a versão "gbv=1" do Google (versão leve sem JS, ideal para scraping)
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&gbv=1&lr=lang_pt`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,xml;q=0.9,image/avif,webp,*/*;q=0.8'
      },
      timeout: 7000
    });

    const $ = cheerio.load(response.data);
    const links = [];

    // No Google Lite, os links ficam dentro de tags <a> simples
    $('a').each((i, el) => {
      let href = $(el).attr('href') || '';
      
      // O Google mascara os links externos: /url?q=https://instagram.com/perfil
      if (href.startsWith('/url?q=')) {
        href = href.split('/url?q=')[1].split('&')[0];
        href = decodeURIComponent(href);
      }

      const urlLower = href.toLowerCase();

      // Regra para Instagram
      if (urlLower.includes('instagram.com/') && !urlLower.includes('/p/') && !urlLower.includes('/explore/')) {
        if (!links.find(l => l.network === 'instagram')) {
          links.push({ network: 'instagram', url: href.split('?')[0] });
        }
      }
      
      // Regra para Facebook
      if (urlLower.includes('facebook.com/') && !urlLower.includes('/sharer') && !urlLower.includes('/pages/')) {
        if (!links.find(l => l.network === 'facebook')) {
          links.push({ network: 'facebook', url: href.split('?')[0] });
        }
      }

      // Regra para iFood
      if (urlLower.includes('ifood.com.br/') && !links.find(l => l.network === 'ifood')) {
        links.push({ network: 'ifood', url: href.split('?')[0] });
      }
    });

    return links;
  } catch (error) {
    console.error(`⚠️ Erro no Google Scraper para ${companyName}:`, error.message);
    return [];
  }
};