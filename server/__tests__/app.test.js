import request from 'supertest';
import app from '../src/app.js';

describe('API foundation', () => {
  test('health is public', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.headers['x-request-id']).toBeTruthy();
  });

  test('stats requires authentication', async () => {
    const response = await request(app).get('/api/stats');

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Autenticação');
  });

  test('lead search requires authentication', async () => {
    const response = await request(app)
      .post('/api/leads/search')
      .send({ niche: 'clinica', location: 'Recife' });

    expect(response.status).toBe(401);
  });

  test('lead stream requires authentication', async () => {
    const response = await request(app)
      .post('/api/leads/search/stream')
      .send({ niche: 'clinica', location: 'Recife' });

    expect(response.status).toBe(401);
  });

  test('unknown API routes return JSON 404', async () => {
    const response = await request(app).get('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.error).toContain('Rota');
  });
});
