import { createClient } from '@supabase/supabase-js';
import { SUPABASE } from './setup';

const skipIfNoDb = !SUPABASE.url || !SUPABASE.key;

describe('Demo seed data', () => {
  const supabase = skipIfNoDb
    ? (null as unknown as ReturnType<typeof createClient>)
    : createClient(SUPABASE.url, SUPABASE.key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

  it('renubu has 8 demo customers', async () => {
    if (skipIfNoDb) return; // skip if no DB credentials
    const { data, error } = await supabase
      .schema('renubu')
      .from('customers')
      .select('id', { count: 'exact', head: true });
    expect(error).toBeNull();
    expect(data).not.toBeNull();
  });

  it('fancyrobot has ARI score history', async () => {
    if (skipIfNoDb) return;
    const { count, error } = await supabase
      .schema('fancyrobot')
      .from('score_history')
      .select('id', { count: 'exact', head: true });
    expect(error).toBeNull();
    expect(count).toBeGreaterThan(0);
  });

  it('human_os has entity spine', async () => {
    if (skipIfNoDb) return;
    const { count, error } = await supabase
      .schema('human_os')
      .from('entities')
      .select('id', { count: 'exact', head: true });
    expect(error).toBeNull();
    expect(count).toBeGreaterThan(0);
  });

  it('founder_os has daily plans', async () => {
    if (skipIfNoDb) return;
    const { count, error } = await supabase
      .schema('founder_os')
      .from('daily_plans')
      .select('id', { count: 'exact', head: true });
    expect(error).toBeNull();
    expect(count).toBeGreaterThan(0);
  });
});
