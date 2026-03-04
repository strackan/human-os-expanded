import { BASE_URLS, fetchJson } from './setup';

describe('Key API endpoints', () => {
  it('renubu /api/health returns expected shape', async () => {
    const { status, body } = await fetchJson(`${BASE_URLS.renubu}/api/health`);
    expect(status).toBe(200);
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('timestamp');
  });

  it('goodhang /api/health returns expected shape', async () => {
    const { status, body } = await fetchJson(`${BASE_URLS.goodhang}/api/health`);
    expect(status).toBe(200);
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('timestamp');
  });

  it('fancy-robot /api/health returns expected shape', async () => {
    const { status, body } = await fetchJson(`${BASE_URLS.fancyRobot}/api/health`);
    expect(status).toBe(200);
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('timestamp');
  });
});
