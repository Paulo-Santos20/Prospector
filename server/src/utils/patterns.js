export const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

export const SOCIAL_PATTERNS = {
  facebook: /facebook\.com/i,
  instagram: /instagram\.com/i,
  linkedin: /linkedin\.com/i,
  twitter: /twitter\.com|x\.com/i,
  youtube: /youtube\.com/i
};

export const YEAR_REGEX = /(?:©|copyright|all rights reserved).*?(20\d{2})/i;

export const THIRD_PARTY_DOMAINS = [
  'instagram.com',
  'facebook.com',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'pinterest.com',
  'linkedin.com',
  'flickr.com',
  'youtube.com',
  'threads.net',
  'telegram.org',

  'ifood.com.br',
  'ubereats.com',
  'rappi.com',
  'mercadolivre.com.br',
  'olx.com.br',
  'amazon.com.br',
  'delivery.com',
  'zomato.com',
  'restaurapp.com.br',
  '99food.com.br',
  'banca.com.br',

  'linktr.ee',
  'carrd.co',
  'about.me',
  'bio.link',
  'beacon.by',
  'linkbio.co',
  'taplink.cc',
  'hey.link',
  'lnk.bio',
  'linkin.bio',

  'business.site',
  'site.google.com',
  'business.google.com',

  'yelp.com',
  'tripadvisor.com',
  'optables.com',

  'wix.com',
  'squarespace.com',
  'wordpress.com',
  'shopify.com',
  'weebly.com',
  'webflow.io',
  'framer.app',
  'bubble.io',
  'wixsite.com',
  'shopify.io',

  'globo.com',
  'uol.com.br',
  'terra.com.br',
  'ig.com.br',
  'outlook.com',
  'live.com',

  'wa.me',
  'whatsapp.com',
  'telegram.me',
  'discord.com',
  'discord.gg',
  'zoom.us',
  'meet.google.com',

  'deliverymaniac.com',
  'goomer.app',
  'menudino.com',

  'youtu.be',
  'vimeo.com',
  'dailymotion.com',
  'twitch.tv',

  'kwai.com',
  'likee.video',
  'snackvideo.com',

  'substack.com',
  'medium.com',
  'blogspot.com',
  'tumblr.com',

  'enjoei.com.br',
  'markt.com',
  'shpock.com',
  'willhaben.at',

  'eventim.com.br',
  'sympla.com.br',
  'ingresso.com',
  'eventbrite.com',

  'g.page',
  'go.page',
  'plus.google.com',

  'feedly.com',
  'flipboard.com',
  'mix.com',

  'bit.ly',
  'tinyurl.com',
  'short.io',
  't.ly',
  'cutt.ly',
  'rebrand.ly',

  'canva.com',
  'pasteboard.co',
  'prntscr.com',
  'gyazo.com',

  'soundcloud.com',
  'spotify.com',
  'mixcloud.com',

  'etsy.com',
  'shopee.com.br',
  'magalu.com.br',
  'casasbahia.com.br',

  'olx.com',
  'vivanuncios.com',

  'airbnb.com',
  'booking.com',
  'expedia.com',
  'hotels.com',

  'glassdoor.com',
  'indeed.com',
  'curriculum.com',
  'vagascerta.com',
  'trampos.co',

  'carrefour.com.br',
  'dia.com.br',

  'gov.br',
  'org.br',
  'edu.br'
];

export const THIRD_PARTY_PATH_PATTERNS = [
  /\/p\//i,
  /\/pg\//i,
  /\/profile\//i,
  /\/pages\//i,
  /\/@/i,
  /\/shorts\//i,
  /\/reels\//i,
  /\/v\//i,
  /\/watch\//i,
  /\/channel\//i,
  /\/explore\//i,
  /\/tags\//i,
  /\/follow\//i,
  /\/messages\//i,
  /\/events\//i,
  /\/groups\//i,
  /\/marketplace\//i,
  /\/shopping\//i,
  /\/cart\//i,
  /\/checkout\//i,
  /\/orders\//i,
  /\/account\//i,
  /\/settings\//i,
  /\/login\//i,
  /\/signup\//i,
  /\/register\//i,
  /\/auth\//i,
  /\/oauth\//i,
  /\/callback\//i,
  /\/api\//i,
  /\/cdn-cgi\//i,
  /\/wp-content\//i,
  /\/wp-includes\//i,
  /\/wp-admin\//i,
  /\/ghost\//i,
  /\/preview\//i,
  /\/public\//i,
  /\/media\//i,
  /\/assets\//i,
  /\/static\//i,
  /\/storage\//i,
  /\/uploads\//i,
  /\/images\//i,
  /\/img\//i,
  /\/photo\//i,
  /\/picture\//i,
  /\/album\//i,
  /\/video\//i,
  /\/embed\//i,
  /\/player\//i,
  /\/feed\//i,
  /\/rss\//i,
  /\/sitemap\//i,
  /\/robots\//i,
  /\/favicon\//i,
  /\/apple-touch-icon\//i,
  /\/browserconfig\//i,
  /\/manifest\//i,
  /\/og-image\//i,
  /\/og-video\//i,
  /\/twitter-card\//i,
  /\/facebook-card\//i
];

export const SUSPICIOUS_TLDS = [
  '.tk',
  '.ml',
  '.ga',
  '.cf',
  '.gq',
  '.xyz',
  '.top',
  '.click',
  '.link',
  '.work',
  '.win',
  '.download',
  '.stream',
  '.gdn',
  '.bid',
  '.trade',
  '.webcam',
  '.party',
  '.science',
  '.accountant',
  '.cricket',
  '.faith',
  '.zip',
  '.rental',
  '.date',
  '.racing',
  '.loan',
  '.vip',
  '.fun',
  '.pro',
  '.cc',
  '.su',
  '.pn',
  '.ph',
  '.ng',
  '.ke',
  '.rw',
  '.online',
  '.site',
  '.pdf'
];

export const PLATFORM_SUBDOMAINS = [
  'm.', 'mobile.', 'shop.', 'store.', 'blog.', 'cms.', 'admin.',
  'vendor.', 'seller.', 'merchant.', 'buyer.', 'auth.',
  'mail.', 'webmail.', 'smtp.', 'pop.',
  'ftp.', 'ssh.', 'sftp.', 'cdn.', 'static.', 'assets.',
  'img.', 'images.', 'media.', 'video.',
  'api.', 'app.', 'client.', 'public.',
  'dev.', 'test.', 'staging.', 'demo.', 'preview.',
  'beta.', 'alpha.', 'old.', 'new.', 'latest.',
  'support.', 'help.', 'docs.', 'documentation.',
  'forum.', 'community.', 'members.', 'account.'
];

export const CONTACT_PATHS = [
  '/contato',
  '/contact',
  '/fale-conosco',
  '/fale',
  '/sobre',
  '/about',
  '/about-us',
  '/sobre-nos',
  '/quem-somos',
  '/empresa',
  '/company',
  '/team',
  '/staff',
  '/help',
  '/suporte',
  '/support',
  '/ajuda',
  '/help-center',
  '/faq',
  '/contact-us',
  '/get-in-touch',
  '/touch',
  '/connect',
  '/reach',
  '/write',
  '/email',
  '/mail',
  '/telefone',
  '/phone',
  '/tel',
  '/address',
  '/localization',
  '/location',
  '/where',
  '/map',
  '/directions'
];

export const INVALID_EMAIL_PATTERNS = [
  /^test/i,
  /^example/i,
  /^fake/i,
  /^null/i,
  /^noreply/i,
  /^no-reply/i,
  /^spam/i,
  /^contato\s*$/i,
  /^email\s*$/i,
  /^mail\s*$/i,
  /^undefined/i,
  /^null$/i,
  /^none$/i
];

export const DISCARDABLE_EMAIL_CONTAINS = [
  'noreply',
  'no-reply',
  'no_reply',
  'spam',
  'example',
  'fake',
  'null',
  'undefined',
  'admin',
  'webmaster',
  'hostmaster',
  'postmaster'
];

export const extractEmailsFromText = (text) => {
  if (!text) return [];
  const matches = text.match(EMAIL_REGEX);
  if (!matches) return [];

  return matches
    .map(e => e.toLowerCase().trim())
    .filter(e => e.length > 5 && e.length < 100)
    .filter(e => !INVALID_EMAIL_PATTERNS.some(pattern => pattern.test(e)))
    .filter(e => {
      const localPart = e.split('@')[0];
      return !DISCARDABLE_EMAIL_CONTAINS.some(bad => localPart.includes(bad));
    });
};

export const extractEmailsFromMailtos = (cheerioStatic) => {
  const emails = new Set();
  cheerioStatic('a[href^="mailto:"]').each((_, el) => {
    const href = cheerioStatic(el).attr('href');
    if (href) {
      const email = href.replace(/^mailto:/i, '').split('?')[0].trim();
      EMAIL_REGEX.lastIndex = 0;
      if (email && EMAIL_REGEX.test(email)) {
        emails.add(email.toLowerCase());
      }
    }
  });
  return Array.from(emails);
};

export const isThirdPartyUrl = (url) => {
  if (!url) return { isThirdParty: false, reason: null };

  const urlLower = url.toLowerCase();

  try {
    const urlObj = new URL(urlLower.startsWith('http') ? urlLower : 'https://' + urlLower);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname;

    for (const domain of THIRD_PARTY_DOMAINS) {
      const domainLower = domain.toLowerCase();
      if (hostname === domainLower || hostname.endsWith('.' + domainLower)) {
        return { isThirdParty: true, reason: `domain:${domain}` };
      }
    }

    for (const pattern of THIRD_PARTY_PATH_PATTERNS) {
      if (pattern.test(pathname)) {
        return { isThirdParty: true, reason: `path:${pattern}` };
      }
    }

    for (const tld of SUSPICIOUS_TLDS) {
      if (hostname.endsWith(tld)) {
        return { isThirdParty: true, reason: `suspicious_tld:${tld}` };
      }
    }

    for (const subdomain of PLATFORM_SUBDOMAINS) {
      if (hostname.startsWith(subdomain) || hostname.includes('.' + subdomain)) {
        return { isThirdParty: true, reason: `platform_subdomain:${subdomain}` };
      }
    }
  } catch {
    for (const domain of THIRD_PARTY_DOMAINS) {
      if (urlLower.includes(domain)) {
        return { isThirdParty: true, reason: `domain:${domain}` };
      }
    }
  }

  return { isThirdParty: false, reason: null };
};