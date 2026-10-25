import { jest } from '@jest/globals';

const mockAnalyzeLeadWithAI = jest.fn();
const mockSafeFetch = jest.fn();

jest.unstable_mockModule('../src/services/aiService.js', () => ({
  analyzeLeadWithAI: mockAnalyzeLeadWithAI,
}));

jest.unstable_mockModule('../src/services/safeFetch.js', () => ({
  safeFetch: mockSafeFetch,
}));

const { analyzeWebsite } = await import('../src/services/analyzerService.js');

const mockHtmlWithEmails = `
  <html>
    <head>
      <meta name="viewport" content="width=device-width">
    </head>
    <body>
      <h1>My Business</h1>
      <p>Contact us at contato@empresa.com.br</p>
      <a href="mailto:suporte@empresa.com.br">Support</a>
      <a href="https://facebook.com/mybusiness">Facebook</a>
      <a href="https://instagram.com/mybusiness">Instagram</a>
    </body>
  </html>
`;

const aiResponse = {
  mainPainPoint: 'Falta de presença digital',
  urgency: 'high',
  conversionOpportunity: 'A',
  featuredItem: 'Serviços de Design',
  designStrategy: {
    style: 'Minimalista',
    primaryColor: '#333333',
    secondaryColor: '#666666',
    typography: { heading: 'Arial', body: 'Helvetica' },
    designReasoning: 'Clean and professional',
    referenceSite: 'https://behance.net',
  },
};

const fetchResult = (text = mockHtmlWithEmails) => ({
  text,
  finalUrl: 'https://legitbusiness.com/',
  status: 200,
  headers: {},
});

describe('analyzerService.js', () => {
  beforeEach(() => {
    mockAnalyzeLeadWithAI.mockReset().mockResolvedValue(aiResponse);
    mockSafeFetch.mockReset().mockResolvedValue(fetchResult());
  });

  describe('URL classification', () => {
    test.each([
      'https://instagram.com/somebusiness',
      'https://facebook.com/somebusiness',
      'https://ifood.com.br/restaurant/someplace',
      'https://business.site/somecompany',
      'https://m.wixsite.com/mysite',
      'https://linktr.ee/myprofile',
      'https://mysite.tk',
    ])('should classify %s as third-party', async (url) => {
      const result = await analyzeWebsite(url, 'Some Business');
      expect(result.isThirdParty).toBe(true);
      expect(result.status).toBe('NO_WEBSITE');
    });

    test('should NOT classify legitimate business URLs as third-party', async () => {
      const legitimateUrls = [
        'https://empresa.com.br',
        'https://meusite.com',
        'https://companysite.net',
        'https://business.io',
        'https://myshop.com.br',
        'https://site.com.br/p/some-post',
      ];

      for (const url of legitimateUrls) {
        mockSafeFetch.mockResolvedValueOnce(fetchResult());
        const result = await analyzeWebsite(url, 'Test Business');
        expect(result.isThirdParty).toBe(false);
      }
    });
  });

  describe('website analysis with scraping', () => {
    test('should extract emails from website content', async () => {
      const result = await analyzeWebsite('https://legitbusiness.com', 'Legit Business');

      expect(result.emails).toContain('contato@empresa.com.br');
      expect(result.emails).toContain('suporte@empresa.com.br');
    });

    test('should detect SSL security', async () => {
      const result = await analyzeWebsite('https://securebusiness.com', 'Secure Business');
      expect(result.isSecure).toBe(true);
    });

    test('should detect lack of SSL', async () => {
      const result = await analyzeWebsite('http://insecure.com', 'Insecure Site');
      expect(result.isSecure).toBe(false);
    });

    test('should detect responsive design via viewport meta tag', async () => {
      const result = await analyzeWebsite('https://responsive.com', 'Responsive Site');
      expect(result.isResponsive).toBe(true);
    });

    test('should extract social links', async () => {
      const result = await analyzeWebsite('https://legitbusiness.com', 'Legit Business');
      expect(result.socialLinks.length).toBeGreaterThan(0);
    });

    test('should calculate opportunity score based on deficiencies', async () => {
      mockSafeFetch.mockResolvedValueOnce(
        fetchResult('<html><body>Insecure and not responsive</body></html>')
      );

      const result = await analyzeWebsite('http://nosecure.com', 'No Secure Site');

      expect(result.opportunityScore).toBeGreaterThan(0);
      expect(result.status).toBe('HIGH_OPPORTUNITY');
    });
  });

  describe('scraping error handling', () => {
    test('should handle timeout errors gracefully', async () => {
      mockSafeFetch.mockRejectedValueOnce(new Error('Timeout'));

      const result = await analyzeWebsite('https://slowsite.com', 'Slow Site');

      expect(result.status).toBe('ERROR_ACCESSING');
      expect(result.opportunityScore).toBeGreaterThan(0);
    });

    test('should handle 404 errors gracefully', async () => {
      mockSafeFetch.mockRejectedValueOnce(new Error('HTTP 404'));

      const result = await analyzeWebsite('https://notfound.com', 'Not Found');
      expect(result.status).toBe('ERROR_ACCESSING');
    });

    test('should handle network errors gracefully', async () => {
      mockSafeFetch.mockRejectedValueOnce(new Error('Network Error'));

      const result = await analyzeWebsite('https://offline.com', 'Offline');
      expect(result.status).toBe('ERROR_ACCESSING');
    });
  });

  describe('opportunity scoring', () => {
    test('should calculate high score for no website', async () => {
      const result = await analyzeWebsite('', 'No Website Business');
      expect(result.status).toBe('NO_WEBSITE');
      expect(result.opportunityScore).toBe(70);
    });

    test('should increase score for business with many reviews', async () => {
      const result = await analyzeWebsite('', 'Popular Business', 150, 1);
      expect(result.opportunityScore).toBe(85);
    });

    test('should increase score for premium price level', async () => {
      const result = await analyzeWebsite('', 'Premium Business', 0, 3);
      expect(result.opportunityScore).toBe(85);
    });

    test('should cap score at 100', async () => {
      const result = await analyzeWebsite('', 'Top Business', 200, 4);
      expect(result.opportunityScore).toBe(100);
    });
  });

  describe('AI integration', () => {
    test('should call AI service even for third-party URLs', async () => {
      const result = await analyzeWebsite('https://instagram.com/business', 'Instagram Business');

      expect(result.aiData).toBeTruthy();
      expect(result.aiData.designStrategy.primaryColor).toBe('#333333');
    });

    test('should call AI service for legitimate websites', async () => {
      const result = await analyzeWebsite('https://legitsite.com', 'Legit Site');
      expect(result.aiData).toBeTruthy();
    });

    test('should include design strategy in AI data', async () => {
      const result = await analyzeWebsite('https://somebusiness.com', 'Some Business');

      expect(result.aiData.designStrategy).toBeTruthy();
      expect(result.aiData.designStrategy.primaryColor).toBe('#333333');
    });
  });

  describe('edge cases', () => {
    test('should handle null URL', async () => {
      const result = await analyzeWebsite(null, 'Null Business');
      expect(result.isThirdParty).toBe(false);
      expect(result.status).toBe('NO_WEBSITE');
    });

    test('should handle undefined URL', async () => {
      const result = await analyzeWebsite(undefined, 'Undefined Business');
      expect(result.status).toBe('NO_WEBSITE');
    });

    test('should handle empty URL', async () => {
      const result = await analyzeWebsite('', 'Empty Business');
      expect(result.status).toBe('NO_WEBSITE');
    });

    test('should normalize URL before processing', async () => {
      const result = await analyzeWebsite('  HTTPS://SITE.COM  ', 'Spaced Site');
      expect(result.url).toBe('https://site.com/');
    });

    test('should preserve case in URL path', async () => {
      const result = await analyzeWebsite('https://site.com/MinhaPagina', 'Case Site');
      expect(result.url).toBe('https://site.com/MinhaPagina');
    });

    test('should handle URL with trailing slash', async () => {
      const result = await analyzeWebsite('https://site.com/', 'Trailing Slash');
      expect(result.url).toBe('https://site.com/');
    });
  });
});
