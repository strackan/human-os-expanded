const { Client } = require('pg');

// Use AWS RDS pooler URL
const connectionString = 'postgresql://postgres.amugmkrihnjsxlpwdzcy:lYjjq0p76p9h6dFB@aws-0-us-west-1.pooler.supabase.com:6543/postgres';

async function verifyRLS() {
  const client = new Client({ connectionString });

  try {
    console.log('Connecting to staging database via pooler...');
    await client.connect();
    console.log('✅ Connected');

    console.log('\nChecking RLS policies on profiles table...');
    const result = await client.query(`
      SELECT
        policyname,
        cmd,
        qual
      FROM pg_policies
      WHERE tablename = 'profiles'
      ORDER BY policyname;
    `);

    console.log(`\nFound ${result.rows.length} policies:`);
    result.rows.forEach((row, idx) => {
      console.log(`\n${idx + 1}. Policy: ${row.policyname}`);
      console.log(`   Command: ${row.cmd}`);
      console.log(`   Expression: ${row.qual}`);
    });

    // Check specifically for our fix
    const fixedPolicy = result.rows.find(r =>
      r.policyname === 'Users can view their own profile and company profiles'
    );

    if (fixedPolicy) {
      console.log('\n✅ GOOD: Fixed RLS policy exists!');
      console.log('Checking if it breaks the circular dependency...');

      if (fixedPolicy.qual && fixedPolicy.qual.includes('id = auth.uid()')) {
        console.log('✅ GOOD: Policy checks auth.uid() FIRST (breaks circular dependency)');
      } else {
        console.log('⚠️  WARNING: Policy may not break circular dependency correctly');
      }
    } else {
      console.log('\n❌ BAD: Fixed RLS policy NOT found!');
      console.log('The circular dependency issue still exists.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\nDisconnected from database');
  }
}

verifyRLS().then(() => {
  console.log('\nVerification complete');
  process.exit(0);
}).catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
