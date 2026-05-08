class MockGroq {
  constructor() {
    this.chat = {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                ownerName: 'Test User',
                mainPainPoint: 'Test pain',
                featuredItem: 'Test item',
                designStrategy: {
                  style: 'Modern',
                  primaryColor: '#333333',
                  secondaryColor: '#666666',
                  typography: { heading: 'Arial', body: 'Helvetica' },
                  designReasoning: 'Test reasoning',
                  referenceSite: 'https://behance.net'
                }
              })
            }
          }]
        })
      }
    };
  }
}

export default MockGroq;