import axios from 'axios';
import * as cheerio from 'cheerio';
import googleIt from 'google-it';
import { extractEmailsFromText, extractEmailsFromMailtos } from '../utils/patterns.js';

export const findEmailViaSearch = async (businessName, location) => {
  try {
    const query = `"${businessName}" ${location} "contato@" OR "email" OR "e-mail" OR "@"`;
    console.log(`[SEARCH] Pesquisando: ${query}`);

    const results = await googleIt({ query, limit: 10, disableConsole: true });
    const emails = new Set();

    results.forEach((res) => {
      const fullText = `${res.title} ${res.snippet}`;
      const foundEmails = extractEmailsFromText(fullText);
      foundEmails.forEach(e => emails.add(e));
    });

    const found = Array.from(emails);

    if (found.length > 0) {
      console.log(`[SEARCH] E-mails encontrados: ${found.join(', ')}`);
    }
    return found;
  } catch (error) {
    console.error(`[SEARCH] Erro na busca: ${error.message}`);
    return [];
  }
};

export const findEmailsFromDomain = async (domain) => {
  try {
    const url = `https://${domain}/contato`;
    const { data: html } = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(html);
    const emails = extractEmailsFromMailtos($);
    return emails;
  } catch {
    return [];
  }
};