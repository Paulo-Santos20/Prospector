export const analyzeLeadWithAI = jest.fn().mockResolvedValue({
  ownerName: 'João Silva',
  mainPainPoint: 'Falta de presença digital',
  featuredItem: 'Serviços de Design',
  designStrategy: {
    style: 'Minimalista',
    primaryColor: '#333333',
    secondaryColor: '#666666',
    typography: { heading: 'Arial', body: 'Helvetica' },
    designReasoning: 'Clean and professional',
    referenceSite: 'https://behance.net'
  }
});