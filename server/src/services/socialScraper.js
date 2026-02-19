import axios from 'axios';
import * as cheerio from 'cheerio';

// Aumentamos para 15 segundos para evitar o erro de timeout em conexões lentas
const TIMEOUT_MS = 15000; 

const AXIOS_CONFIG = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'pt-BR,pt;q=0.9'
  },
  timeout: TIMEOUT_MS
};

// MOTOR 1: GOOGLE (Prioridade por precisão)
const searchGoogle = async (query) => {
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&gbv=1`;
    const { data } = await axios.get(url, AXIOS_CONFIG);
    const $ = cheerio.load(data);
    const links = [];
    $('a').each((i, el) => {
      let href = $(el).attr('href') || '';
      if (href.startsWith('/url?q=')) {
        links.push(decodeURIComponent(href.split('/url?q=')[1].split('&')[0]));
      }
    });
    return links;
  } catch (err) {
    console.log(`⚠️ Google falhou/bloqueou: ${err.message}`);
    return [];
  }
};

// MOTOR 2: DUCKDUCKGO (Reserva caso o Google dê timeout ou bloqueie)
const searchDuckDuckGo = async (query) => {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url, AXIOS_CONFIG);
    const $ = cheerio.load(data);
    const links = [];
    $('.result__a').each((i, el) => links.push($(el).attr('href')));
    return links;
  } catch (err) {
    console.log(`⚠️ DuckDuckGo falhou: ${err.message}`);
    return [];
  }
};

export const findSocialLinks = async (companyName, address) => {
  const city = address ? address.split(',').slice(-2).join(' ') : '';
  const query = `"${companyName}" ${city} instagram facebook ifood`;
  
  // TENTATIVA 1: GOOGLE
  let rawLinks = await searchGoogle(query);

  // TENTATIVA 2: Se o Google não trouxe nada (ou deu timeout), tenta o DuckDuckGo
  if (rawLinks.length === 0) {
    console.log(`🔄 Google falhou para "${companyName}", tentando DuckDuckGo...`);
    rawLinks = await searchDuckDuckGo(query);
  }

  const foundLinks = [];
  const addLink = (network, url) => {
    if (!foundLinks.find(l => l.network === network)) {
      foundLinks.push({ network, url: url.split('?')[0] });
    }
  };

  rawLinks.forEach(link => {
    const l = link.toLowerCase();
    if (l.includes('instagram.com/') && !l.includes('/p/') && !l.includes('/explore/')) addLink('instagram', link);
    if (l.includes('facebook.com/') && !l.includes('/sharer')) addLink('facebook', link);
    if (l.includes('ifood.com.br/')) addLink('ifood', link);
  });

  return foundLinks;
};