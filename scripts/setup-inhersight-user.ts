/**
 * Setup InHerSight User Script
 * Creates Grace's account with proper company isolation and demo permissions
 *
 * Usage: npx tsx scripts/setup-inhersight-user.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupInHerSightUser() {
  try {
    console.log('🚀 Starting InHerSight user setup...\n');

    // ============================================================================
    // STEP 1: Create or get InHerSight company
    // ============================================================================
    console.log('📊 Step 1: Setting up InHerSight company...');

    const { data: companyData, error: companyFetchError } = await supabase
      .from('companies')
      .select('*')
      .eq('domain', 'inhersight.com')
      .single();

    if (companyFetchError && companyFetchError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch company: ${companyFetchError.message}`);
    }

    let company = companyData;
    if (!company) {
      const { data: newCompany, error: companyCreateError } = await supabase
        .from('companies')
        .insert({
          name: 'InHerSight',
          domain: 'inhersight.com'
        })
        .select()
        .single();

      if (companyCreateError) {
        throw new Error(`Failed to create company: ${companyCreateError.message}`);
      }

      company = newCompany;
      console.log(`✅ Created InHerSight company: ${company.id}`);
    } else {
      console.log(`✅ Found existing InHerSight company: ${company.id}`);
    }

    // ============================================================================
    // STEP 2: Create Grace's user account
    // ============================================================================
    console.log('\n👤 Step 2: Creating Grace\'s user account...');

    const graceEmail = 'grace@inhersight.com';
    const temporaryPassword = generateSecurePassword();

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const graceExists = existingUser.users.find(u => u.email === graceEmail);

    let userId: string;

    if (graceExists) {
      console.log(`⚠️  User ${graceEmail} already exists`);
      userId = graceExists.id;

      // Update user to ensure proper setup
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            full_name: 'Grace Chen',
            company_name: 'InHerSight',
            auth_type: 'local'
          }
        }
      );

      if (updateError) {
        console.error('⚠️  Failed to update user metadata:', updateError.message);
      }
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: graceEmail,
        password: temporaryPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: 'Grace Chen',
          company_name: 'InHerSight',
          auth_type: 'local'
        }
      });

      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      userId = newUser.user.id;
      console.log(`✅ Created user: ${graceEmail}`);
      console.log(`🔑 Temporary password: ${temporaryPassword}`);
      console.log(`⚠️  IMPORTANT: Save this password - it won't be shown again!`);
    }

    // ============================================================================
    // STEP 3: Update profile with company assignment and permissions
    // ============================================================================
    console.log('\n⚙️  Step 3: Configuring profile...');

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        company_id: company.id,
        full_name: 'Grace Chen',
        company_name: 'InHerSight',
        role: 'Customer Success Manager',
        auth_type: 'local',
        demo_godmode: true,
        status: 2 // Pending - requires password reset
      })
      .eq('id', userId);

    if (profileError) {
      throw new Error(`Failed to update profile: ${profileError.message}`);
    }

    console.log('✅ Profile configured with:');
    console.log('   - Company: InHerSight');
    console.log('   - Demo Godmode: Enabled');
    console.log('   - Status: 2 (Password reset required)');

    // ============================================================================
    // STEP 4: Send password reset email
    // ============================================================================
    console.log('\n📧 Step 4: Sending password reset email...');

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      graceEmail,
      {
        redirectTo: `${SUPABASE_URL.replace('//', '//').split('//')[1].split(':')[0]}/auth/reset-password`
      }
    );

    if (resetError) {
      console.error('⚠️  Failed to send reset email:', resetError.message);
      console.log('   Grace can manually request password reset from login page');
    } else {
      console.log('✅ Password reset email sent to grace@inhersight.com');
    }

    // ============================================================================
    // SUMMARY
    // ============================================================================
    console.log('\n' + '='.repeat(70));
    console.log('✨ InHerSight User Setup Complete!');
    console.log('='.repeat(70));
    console.log(`
📋 Account Details:
   Email: ${graceEmail}
   Company: InHerSight (${company.id})
   User ID: ${userId}

🔐 Authentication:
   ${graceExists ? 'Existing password retained' : `Temporary Password: ${temporaryPassword}`}
   Status: Password reset required on first login
   Reset email sent: ${!resetError ? 'Yes' : 'No (manual reset required)'}

🎯 Permissions:
   Demo Godmode: Enabled
   Company Isolation: Enforced
   Can reset demo data: Yes

📝 Next Steps:
   1. Grace should check email for password reset link
   2. Set new password via reset link
   3. Login at your application URL
   4. Import test CSV data
   5. Run 90-day renewal workflow

💡 Notes:
   - All data Grace creates will be isolated to InHerSight company
   - Demo godmode allows her to reset test data safely
   - User status=2 forces password change on first auth
    `);

    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    process.exit(1);
  }
}

/**
 * Generate a secure random password
 */
function generateSecurePassword(): string {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';

  // Ensure at least one of each type
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)];

  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Run setup
setupInHerSightUser();
