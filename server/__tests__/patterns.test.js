import * as cheerio from 'cheerio';
import {
  EMAIL_REGEX,
  THIRD_PARTY_DOMAINS,
  THIRD_PARTY_PATH_PATTERNS,
  SUSPICIOUS_TLDS,
  PLATFORM_SUBDOMAINS,
  CONTACT_PATHS,
  INVALID_EMAIL_PATTERNS,
  DISCARDABLE_EMAIL_CONTAINS,
  extractEmailsFromText,
  extractEmailsFromMailtos,
  isThirdPartyUrl
} from '../src/utils/patterns.js';

describe('patterns.js', () => {
  describe('EMAIL_REGEX', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'contact@empresa.com.br',
      'name+tag@domain.io',
      'a@b.co',
      'test_email@sub.domain.com',
      'carlos@museu.photography',
      'contato@empresa.solutions',
      'admin@company.technology',
      ' contato@with-space.com '
    ];

    const invalidEmails = [
      'invalid',
      '@nodomain.com',
      'noat.com',
      'test@',
      '@test.com'
    ];

    test.each(validEmails)('should match valid email: %s', (email) => {
      const cleanEmail = email.trim();
      const matches = cleanEmail.match(EMAIL_REGEX);
      expect(matches).toBeTruthy();
    });

    test.each(invalidEmails)('should not match invalid email: %s', (email) => {
      const matches = email.match(EMAIL_REGEX);
      expect(matches).toBeNull();
    });
  });

  describe('THIRD_PARTY_DOMAINS', () => {
    test('should include major social networks', () => {
      expect(THIRD_PARTY_DOMAINS).toContain('instagram.com');
      expect(THIRD_PARTY_DOMAINS).toContain('facebook.com');
      expect(THIRD_PARTY_DOMAINS).toContain('twitter.com');
      expect(THIRD_PARTY_DOMAINS).toContain('x.com');
      expect(THIRD_PARTY_DOMAINS).toContain('tiktok.com');
      expect(THIRD_PARTY_DOMAINS).toContain('linkedin.com');
      expect(THIRD_PARTY_DOMAINS).toContain('youtube.com');
    });

    test('should include delivery platforms', () => {
      expect(THIRD_PARTY_DOMAINS).toContain('ifood.com.br');
      expect(THIRD_PARTY_DOMAINS).toContain('ubereats.com');
      expect(THIRD_PARTY_DOMAINS).toContain('rappi.com');
      expect(THIRD_PARTY_DOMAINS).toContain('zomato.com');
    });

    test('should include link-in-bio platforms', () => {
      expect(THIRD_PARTY_DOMAINS).toContain('linktr.ee');
      expect(THIRD_PARTY_DOMAINS).toContain('carrd.co');
      expect(THIRD_PARTY_DOMAINS).toContain('about.me');
      expect(THIRD_PARTY_DOMAINS).toContain('beacon.by');
      expect(THIRD_PARTY_DOMAINS).toContain('bio.link');
    });

    test('should include website builders', () => {
      expect(THIRD_PARTY_DOMAINS).toContain('wix.com');
      expect(THIRD_PARTY_DOMAINS).toContain('squarespace.com');
      expect(THIRD_PARTY_DOMAINS).toContain('wordpress.com');
      expect(THIRD_PARTY_DOMAINS).toContain('shopify.com');
      expect(THIRD_PARTY_DOMAINS).toContain('webflow.io');
      expect(THIRD_PARTY_DOMAINS).toContain('framer.app');
    });
  });

  describe('THIRD_PARTY_PATH_PATTERNS', () => {
    test.each([
      ['https://instagram.com/p/abc123', true],
      ['https://instagram.com/@username', true],
      ['https://facebook.com/pages/name/123', true],
      ['https://youtube.com/shorts/xyz', true],
      ['https://youtube.com/watch?v=abc', true],
      ['https://legitbusiness.com/company/test', false],
      ['https://legitbusiness.com/products', false],
      ['https://legitbusiness.com/about', false],
      ['https://notsocial.com/promo', false]
    ])('path pattern detection: %s => isThirdParty: %s', (url, expected) => {
      const result = isThirdPartyUrl(url);
      if (expected) {
        expect(result.isThirdParty).toBe(true);
      } else {
        expect(result.isThirdParty).toBe(false);
      }
    });
  });

  describe('SUSPICIOUS_TLDS', () => {
    test.each([
      ['http://somesite.tk', true],
      ['https://free.xyz', true],
      ['https://link.top', true],
      ['https://site.click', true],
      ['https://company.com', false],
      ['https://business.org', false],
      ['https://myshop.business', false]
    ])('suspicious TLD detection: %s => suspicious: %s', (url, expected) => {
      const result = isThirdPartyUrl(url);
      expect(result.isThirdParty).toBe(expected);
    });
  });

  describe('isThirdPartyUrl', () => {
    describe('domain-based detection', () => {
      test('should detect Instagram as third-party', () => {
        const result = isThirdPartyUrl('https://instagram.com/businesspage');
        expect(result.isThirdParty).toBe(true);
        expect(result.reason).toContain('domain:');
      });

      test('should detect Facebook as third-party', () => {
        const result = isThirdPartyUrl('https://facebook.com/somepage');
        expect(result.isThirdParty).toBe(true);
      });

      test('should detect iFood as third-party', () => {
        const result = isThirdPartyUrl('https://ifood.com.br/restaurant/x');
        expect(result.isThirdParty).toBe(true);
      });

      test('should detect business.site as third-party', () => {
        const result = isThirdPartyUrl('https://business.site/mycompany');
        expect(result.isThirdParty).toBe(true);
      });

      test('should NOT flag legitimate business domains', () => {
        const legitimateUrls = [
          'https://empresa.com.br',
          'https://meusite.com',
          'https://companysite.net',
          'https://business.io',
          'https://mycompany.co.uk',
          'https://lojaonline.com.br',
          'https://site.photography',
          'https://design.solutions'
        ];

        legitimateUrls.forEach(url => {
          const result = isThirdPartyUrl(url);
          expect(result.isThirdParty).toBe(false);
        });
      });
    });

    describe('subdomain-based detection', () => {
      test('should detect m.wix.com as third-party', () => {
        const result = isThirdPartyUrl('https://m.wix.com/some-site');
        expect(result.isThirdParty).toBe(true);
      });

      test('should detect shop.name.com as platform subdomain', () => {
        const result = isThirdPartyUrl('https://shop.legitbusiness.com');
        expect(result.isThirdParty).toBe(true);
      });

      test('should NOT flag legitimate subdomains', () => {
        const result = isThirdPartyUrl('https://blog.realempresa.com');
        expect(result.isThirdParty).toBe(true); // blog. is in PLATFORM_SUBDOMAINS
      });

      test('should NOT flag www as platform subdomain', () => {
        const result = isThirdPartyUrl('https://www.legitbusiness.com');
        expect(result.isThirdParty).toBe(false);
      });
    });

    describe('path-based detection', () => {
      test('should detect Instagram profile path', () => {
        const result = isThirdPartyUrl('https://some-site.com/@username');
        expect(result.isThirdParty).toBe(true);
      });

      test('should detect social media post paths', () => {
        expect(isThirdPartyUrl('https://site.com/p/some-post').isThirdParty).toBe(true);
        expect(isThirdPartyUrl('https://site.com/reels/some-video').isThirdParty).toBe(true);
        expect(isThirdPartyUrl('https://site.com/shorts/123').isThirdParty).toBe(true);
      });
    });

    describe('edge cases', () => {
      test('should return isThirdParty false for null/undefined', () => {
        expect(isThirdPartyUrl(null).isThirdParty).toBe(false);
        expect(isThirdPartyUrl(undefined).isThirdParty).toBe(false);
        expect(isThirdPartyUrl('').isThirdParty).toBe(false);
      });

      test('should handle URLs without protocol', () => {
        expect(isThirdPartyUrl('instagram.com/page').isThirdParty).toBe(true);
        expect(isThirdPartyUrl('legitbusiness.com').isThirdParty).toBe(false);
      });

      test('should be case insensitive', () => {
        expect(isThirdPartyUrl('HTTPS://INSTAGRAM.COM/PAGE').isThirdParty).toBe(true);
        expect(isThirdPartyUrl('https://Instagram.Com/Page').isThirdParty).toBe(true);
      });
    });
  });

  describe('extractEmailsFromText', () => {
    test('should extract emails from text', () => {
      const text = 'Contact us at contato@empresa.com.br or call 123456';
      const emails = extractEmailsFromText(text);
      expect(emails).toContain('contato@empresa.com.br');
    });

    test('should extract multiple emails', () => {
      const text = 'Email: john@test.com and jane@domain.co.uk';
      const emails = extractEmailsFromText(text);
      expect(emails).toHaveLength(2);
      expect(emails).toContain('john@test.com');
      expect(emails).toContain('jane@domain.co.uk');
    });

    test('should filter out invalid emails', () => {
      const text = 'valid@real.com and noreply@company.com and no-reply@test.com';
      const emails = extractEmailsFromText(text);
      expect(emails).not.toContain('noreply@company.com');
      expect(emails).not.toContain('no-reply@test.com');
      expect(emails).toContain('valid@real.com');
    });

    test('should return empty array for text without emails', () => {
      const emails = extractEmailsFromText('No emails here');
      expect(emails).toHaveLength(0);
    });

    test('should return empty array for null/undefined', () => {
      expect(extractEmailsFromText(null)).toHaveLength(0);
      expect(extractEmailsFromText(undefined)).toHaveLength(0);
    });

    test('should filter emails containing discardable patterns', () => {
      const text = 'real@company.com and noreply@spam.com and webmaster@test.com';
      const emails = extractEmailsFromText(text);
      expect(emails).toContain('real@company.com');
      expect(emails).not.toContain('noreply@spam.com');
      expect(emails).not.toContain('webmaster@test.com');
    });
  });

  describe('extractEmailsFromMailtos', () => {
    test('should extract emails from mailto links', () => {
      const html = `
        <html>
          <body>
            <a href="mailto:contato@empresa.com.br">Email</a>
            <a href="mailto:suporte@site.com">Support</a>
          </body>
        </html>
      `;
      const $ = cheerio.load(html);
      const emails = extractEmailsFromMailtos($);
      expect(emails).toContain('contato@empresa.com.br');
      expect(emails).toContain('suporte@site.com');
      expect(emails).toHaveLength(2);
    });

    test('should handle mailto without email', () => {
      const html = '<a href="mailto:">Empty</a>';
      const $ = cheerio.load(html);
      const emails = extractEmailsFromMailtos($);
      expect(emails).toHaveLength(0);
    });

    test('should deduplicate emails', () => {
      const html = `
        <a href="mailto:contato@site.com">1</a>
        <a href="mailto:contato@site.com">2</a>
      `;
      const $ = cheerio.load(html);
      const emails = extractEmailsFromMailtos($);
      expect(emails).toHaveLength(1);
    });

    test('should strip query params from mailto', () => {
      const html = '<a href="mailto:test@site.com?subject=Help">Email</a>';
      const $ = cheerio.load(html);
      const emails = extractEmailsFromMailtos($);
      expect(emails).toContain('test@site.com');
    });
  });

  describe('CONTACT_PATHS', () => {
    test('should include common contact paths in multiple languages', () => {
      const expectedPaths = [
        '/contato',
        '/contact',
        '/fale-conosco',
        '/about',
        '/sobre',
        '/suporte',
        '/support'
      ];

      expectedPaths.forEach(path => {
        expect(CONTACT_PATHS).toContain(path);
      });
    });

    test('should have reasonable number of paths', () => {
      expect(CONTACT_PATHS.length).toBeGreaterThan(20);
    });
  });
});