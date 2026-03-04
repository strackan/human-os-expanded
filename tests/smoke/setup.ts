/**
 * Smoke test setup — base URLs from env vars, fetch helpers.
 */

export const BASE_URLS = {
  renubu: process.env.DEMO_RENUBU_URL || 'http://localhost:4000',
  goodhang: process.env.DEMO_GOODHANG_URL || 'http://localhost:4100',
  fancyRobot: process.env.DEMO_FANCY_ROBOT_URL || 'http://localhost:4200',
};

export const SUPABASE = {
  url: process.env.DEMO_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  key: process.env.DEMO_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

export async function fetchJson(url: string): Promise<{ status: number; body: unknown }> {
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}
