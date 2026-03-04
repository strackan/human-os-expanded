import { BASE_URLS, fetchJson } from './setup';

describe('Health endpoints', () => {
  const apps = [
    { name: 'renubu', url: BASE_URLS.renubu },
    { name: 'goodhang', url: BASE_URLS.goodhang },
    { name: 'fancy-robot', url: BASE_URLS.fancyRobot },
  ];

  for (const app of apps) {
    it(`${app.name} /api/health responds 200`, async () => {
      const { status, body } = await fetchJson(`${app.url}/api/health`);
      expect(status).toBe(200);
      expect(body).toMatchObject({ status: 'ok', app: app.name });
    });
  }
});
