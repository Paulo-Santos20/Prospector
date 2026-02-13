export const EMAIL_REGEX = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g;

export const SOCIAL_PATTERNS = {
  facebook: /facebook\.com/i,
  instagram: /instagram\.com/i,
  linkedin: /linkedin\.com/i,
  twitter: /twitter\.com|x\.com/i,
  youtube: /youtube\.com/i
};

// Detecta anos no rodapé (ex: "2019", "2018-2022")
export const YEAR_REGEX = /(?:©|copyright|all rights reserved).*?(20\d{2})/i;