/**
 * Add MCP Phase 1 Feature to Database
 *
 * Adds Release 0.1.7 "MCP Foundation" feature to features table
 */

// @ts-expect-error - pg types not available in this context
import { Pool } from 'pg';

const STAGING_DATABASE_URL = process.env.STAGING_DATABASE_URL || '';

if (!STAGING_DATABASE_URL) {
  console.error('❌ STAGING_DATABASE_URL environment variable not set');
  process.exit(1);
}

async function addMCPPhase1Feature() {
  console.log('🚀 Adding MCP Phase 1 feature to database...\n');

  // Create PostgreSQL client
  const pool = new Pool({
    connectionString: STAGING_DATABASE_URL,
  });

  try {
    // 1. Get status IDs
    const statusResult = await pool.query(
      `SELECT id, slug FROM feature_statuses WHERE slug = 'underway'`
    );

    const underwayStatus = statusResult.rows[0];

    if (!underwayStatus) {
      throw new Error('Underway status not found');
    }

    console.log('✅ Found status IDs');

    // 2. Get category IDs
    const categoryResult = await pool.query(
      `SELECT id, slug FROM feature_categories WHERE slug IN ('infrastructure', 'ai')`
    );

    const infrastructureCategory = categoryResult.rows.find((c: any) => c.slug === 'infrastructure');
    const aiCategory = categoryResult.rows.find((c: any) => c.slug === 'ai');

    if (!infrastructureCategory || !aiCategory) {
      throw new Error('Categories not found');
    }

    console.log('✅ Found category IDs');

    // 3. Get or create release 0.1.7
    const releaseResult = await pool.query(
      `SELECT id FROM releases WHERE version = '0.1.7'`
    );

    let release = releaseResult.rows[0];

    if (!release) {
      console.log('📝 Creating release 0.1.7...');

      const releaseStatusResult = await pool.query(
        `SELECT id FROM release_statuses WHERE slug = 'in_progress'`
      );

      const releaseStatusId = releaseStatusResult.rows[0]?.id;

      const insertReleaseResult = await pool.query(
        `INSERT INTO releases (version, name, status_id, phase_number, planned_start, planned_end, description, release_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          '0.1.7',
          'MCP Foundation',
          releaseStatusId,
          1,
          '2025-11-21',
          '2025-11-22',
          'Model Context Protocol (MCP) Phase 1 - Extensible AI tool integration framework with Supabase, PostgreSQL, Memory, and Sequential Thinking MCPs',
          'https://github.com/Renew-Boo/renubu/blob/main/RELEASE_NOTES.md#release-017---mcp-foundation-november-22-2025',
        ]
      );

      release = insertReleaseResult.rows[0];
      console.log('✅ Created release 0.1.7');
    } else {
      console.log('✅ Found existing release 0.1.7');
    }

    // 4. Insert MCP Phase 1 features
    const features = [
      {
        slug: 'mcp-foundation',
        title: 'Model Context Protocol (MCP) Foundation',
        status_id: underwayStatus.id,
        category_id: infrastructureCategory.id,
        release_id: release.id,
        priority: 1,
        effort_hrs: 24,
        business_case: 'Extensible AI tool integration framework that enables LLMs to interact with databases, analytics, memory, and complex reasoning capabilities. Foundation for all future MCP integrations (Slack, Email, Calendar, GitHub, etc.).',
        technical_approach: 'MCPManager with 4 Phase 1 clients: Supabase MCP (database queries), PostgreSQL MCP (analytics), Memory MCP (conversation context), Sequential Thinking MCP (chain-of-thought reasoning). Feature-flagged architecture with graceful degradation.',
        success_criteria: [
          '10 MCP tools registered and operational',
          'Build succeeds with MCP enabled or disabled',
          'Zero impact on existing workflows when disabled',
          'Health monitoring for all MCP clients',
          'Integration tests passing',
        ],
      },
      {
        slug: 'sequential-thinking-mcp',
        title: 'Sequential Thinking MCP',
        status_id: underwayStatus.id,
        category_id: aiCategory.id,
        release_id: release.id,
        priority: 1,
        effort_hrs: 8,
        business_case: 'Step-by-step reasoning for complex renewal decisions (pricing, risk assessment, contract analysis). Transparent AI decision-making builds trust with CSMs and justifies recommendations.',
        technical_approach: 'SequentialThinkingMCPClient with think(), reflect(), revise() methods. ThinkingProcess UI component with animated visualization. Confidence scoring and complexity assessment.',
        success_criteria: [
          'Reasoning steps displayed with confidence scores',
          'Use cases: renewal strategies, pricing decisions, risk assessments',
          'ThinkingProcess component renders animated steps',
          'Conclusion generated with overall confidence',
        ],
      },
      {
        slug: 'mcp-health-monitoring',
        title: 'MCP Health Monitoring',
        status_id: underwayStatus.id,
        category_id: infrastructureCategory.id,
        release_id: release.id,
        priority: 2,
        effort_hrs: 4,
        business_case: 'Automatic health checks for MCP servers ensure reliability and early detection of issues. Metrics tracking enables performance optimization and cost monitoring.',
        technical_approach: 'MCPManager runs health checks every 60 seconds. API endpoints: /api/mcp/health, /api/mcp/tools, /api/mcp/query. Comprehensive logging and metrics collection.',
        success_criteria: [
          'Health checks run every 60 seconds',
          'Unhealthy clients logged with warnings',
          'Metrics tracked: request count, success rate, latency',
          'API endpoints return proper health status',
        ],
      },
    ];

    console.log(`\n📝 Inserting ${features.length} features...`);

    for (const feature of features) {
      // Check if feature already exists
      const existingResult = await pool.query(
        `SELECT id, slug FROM features WHERE slug = $1`,
        [feature.slug]
      );

      if (existingResult.rows.length > 0) {
        console.log(`⏭️  Skipping ${feature.slug} (already exists)`);
        continue;
      }

      try {
        await pool.query(
          `INSERT INTO features (slug, title, status_id, category_id, release_id, priority, effort_hrs, business_case, technical_approach, success_criteria)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            feature.slug,
            feature.title,
            feature.status_id,
            feature.category_id,
            feature.release_id,
            feature.priority,
            feature.effort_hrs,
            feature.business_case,
            feature.technical_approach,
            JSON.stringify(feature.success_criteria),
          ]
        );

        console.log(`✅ Inserted ${feature.slug}`);
      } catch (error) {
        console.error(`❌ Error inserting ${feature.slug}:`, error);
      }
    }

    console.log('\n✅ MCP Phase 1 features added successfully!');
    console.log('\nSummary:');
    console.log('- Release: 0.1.7 "MCP Foundation"');
    console.log(`- Features added: ${features.length}`);
    console.log('- Status: Underway');
    console.log('- Total effort: 36 hours');

    await pool.end();
  } catch (error) {
    console.error('\n❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

addMCPPhase1Feature();
