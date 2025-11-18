#!/usr/bin/env npx tsx
/**
 * Populate Features Table
 * Maps all features from RELEASE_NOTES.md to database with proper release associations
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateFeatures() {
  console.log('🚀 Populating Features Table...\n');

  try {
    // Get reference IDs
    console.log('📊 Getting reference IDs...');
    const { data: statuses } = await supabase.from('feature_statuses').select('id, slug');
    const { data: categories } = await supabase.from('feature_categories').select('id, slug');
    const { data: releases } = await supabase.from('releases').select('id, version');

    const getStatusId = (slug: string) => statuses?.find(s => s.slug === slug)?.id;
    const getCategoryId = (slug: string) => categories?.find(c => c.slug === slug)?.id;
    const getReleaseId = (version: string) => releases?.find(r => r.version === version)?.id;

    const completeId = getStatusId('complete')!;
    const workflowCat = getCategoryId('workflow')!;
    const integrationCat = getCategoryId('integration')!;
    const aiCat = getCategoryId('ai')!;
    const uxCat = getCategoryId('ux')!;
    const infraCat = getCategoryId('infrastructure')!;
    const artifactsCat = getCategoryId('artifacts')!;
    const dashboardsCat = getCategoryId('views_dashboards')!;

    console.log('✅ Reference IDs loaded\n');

    // Delete existing features
    console.log('🗑️  Clearing existing features...');
    const { error: deleteError } = await supabase
      .from('features')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) console.warn('⚠️  Delete warning:', deleteError.message);
    else console.log('✅ Features cleared\n');

    // Define all features
    const features = [
      // 0.0.1 - Genesis
      {
        slug: 'renewals-hq-dashboard',
        title: 'Renewals HQ Dashboard',
        business_case: 'Initial dashboard for renewal management with customer list and basic workflow tracking',
        status_id: completeId,
        category_id: dashboardsCat,
        release_id: getReleaseId('0.0.1'),
        shipped_at: '2025-04-29',
        priority: 1,
        effort_hrs: 40
      },
      {
        slug: 'timeline-toggle',
        title: 'Timeline Toggle View',
        business_case: 'Toggle between list and timeline views for renewal tracking',
        status_id: completeId,
        category_id: uxCat,
        release_id: getReleaseId('0.0.1'),
        shipped_at: '2025-04-29',
        priority: 2,
        effort_hrs: 8
      },

      // 0.0.2 - Dashboard Core
      {
        slug: 'workflow-snoozing',
        title: 'Workflow Snoozing',
        business_case: 'Snooze renewals and workflows with date-based wake conditions',
        status_id: completeId,
        category_id: workflowCat,
        release_id: getReleaseId('0.0.2'),
        shipped_at: '2025-05-03',
        priority: 1,
        effort_hrs: 24
      },
      {
        slug: 'actions-dropdown',
        title: 'Actions Dropdown',
        business_case: 'Contextual actions menu for workflow items',
        status_id: completeId,
        category_id: uxCat,
        release_id: getReleaseId('0.0.2'),
        shipped_at: '2025-05-03',
        priority: 2,
        effort_hrs: 12
      },
      {
        slug: 'resizable-columns',
        title: 'Resizable Columns',
        business_case: 'User-adjustable column widths in dashboard tables',
        status_id: completeId,
        category_id: uxCat,
        release_id: getReleaseId('0.0.2'),
        shipped_at: '2025-05-03',
        priority: 3,
        effort_hrs: 6
      },
      {
        slug: 'contracts-page',
        title: 'Contracts Page',
        business_case: 'Dedicated page for contract management and viewing',
        status_id: completeId,
        category_id: dashboardsCat,
        release_id: getReleaseId('0.0.2'),
        shipped_at: '2025-05-03',
        priority: 2,
        effort_hrs: 16
      },

      // 0.0.3 - Workflow Experiments
      {
        slug: 'planning-workflow-alpha',
        title: 'Planning Workflow Alpha',
        business_case: 'First iteration of AI-powered planning workflows',
        status_id: completeId,
        category_id: aiCat,
        release_id: getReleaseId('0.0.3'),
        shipped_at: '2025-05-24',
        priority: 1,
        effort_hrs: 32
      },
      {
        slug: 'customer-page-modular',
        title: 'Modular Customer Page',
        business_case: 'Component-based customer detail pages',
        status_id: completeId,
        category_id: uxCat,
        release_id: getReleaseId('0.0.3'),
        shipped_at: '2025-05-24',
        priority: 2,
        effort_hrs: 20
      },

      // 0.0.4 - Authentication Battle
      {
        slug: 'supabase-integration',
        title: 'Supabase Integration',
        business_case: 'Backend integration with Supabase for database and auth',
        status_id: completeId,
        category_id: infraCat,
        release_id: getReleaseId('0.0.4'),
        shipped_at: '2025-07-28',
        priority: 1,
        effort_hrs: 60
      },
      {
        slug: 'google-oauth',
        title: 'Google OAuth',
        business_case: 'Single sign-on with Google authentication',
        status_id: completeId,
        category_id: infraCat,
        release_id: getReleaseId('0.0.4'),
        shipped_at: '2025-07-28',
        priority: 1,
        effort_hrs: 24
      },
      {
        slug: 'event-handling-system',
        title: 'Event Handling System',
        business_case: 'Core event system for workflow triggers and actions',
        status_id: completeId,
        category_id: infraCat,
        release_id: getReleaseId('0.0.4'),
        shipped_at: '2025-07-28',
        priority: 1,
        effort_hrs: 40
      },

      // 0.0.5 - Backend Breakthrough
      {
        slug: 'supabase-cloud-migration',
        title: 'Supabase Cloud Migration',
        business_case: 'Migration from local to cloud-hosted Supabase',
        status_id: completeId,
        category_id: infraCat,
        release_id: getReleaseId('0.0.5'),
        shipped_at: '2025-08-27',
        priority: 1,
        effort_hrs: 32
      },
      {
        slug: 'customers-page',
        title: 'Customers Page',
        business_case: 'Main customers list and management interface',
        status_id: completeId,
        category_id: dashboardsCat,
        release_id: getReleaseId('0.0.5'),
        shipped_at: '2025-08-27',
        priority: 1,
        effort_hrs: 24
      },
      {
        slug: 'customer-360-view',
        title: 'Customer 360 View',
        business_case: 'Comprehensive customer profile with all related data',
        status_id: completeId,
        category_id: dashboardsCat,
        release_id: getReleaseId('0.0.5'),
        shipped_at: '2025-08-27',
        priority: 1,
        effort_hrs: 40
      },
      {
        slug: 'activepieces-integration',
        title: 'ActivePieces Integration',
        business_case: 'Integration with ActivePieces automation platform',
        status_id: completeId,
        category_id: integrationCat,
        release_id: getReleaseId('0.0.5'),
        shipped_at: '2025-08-27',
        priority: 2,
        effort_hrs: 16
      },
      {
        slug: 'demo-mode',
        title: 'Demo Mode',
        business_case: 'Force-enable demo mode with visual indicator for testing',
        status_id: completeId,
        category_id: uxCat,
        release_id: getReleaseId('0.0.5'),
        shipped_at: '2025-08-27',
        priority: 2,
        effort_hrs: 8
      },
      {
        slug: 'api-routes-83',
        title: '83 New API Routes',
        business_case: 'Comprehensive REST API coverage for all major entities',
        status_id: completeId,
        category_id: infraCat,
        release_id: getReleaseId('0.0.5'),
        shipped_at: '2025-08-27',
        priority: 1,
        effort_hrs: 120
      },

      // 0.0.6 - Artifact Engine
      {
        slug: 'artifact-components-100',
        title: '100+ Artifact Components',
        business_case: 'Reusable UI components for workflow artifacts',
        status_id: completeId,
        category_id: artifactsCat,
        release_id: getReleaseId('0.0.6'),
        shipped_at: '2025-09-28',
        priority: 1,
        effort_hrs: 160
      },
      {
        slug: 'config-driven-workflows',
        title: 'Configuration-Driven Workflows',
        business_case: 'JSON-based workflow definitions with dynamic rendering',
        status_id: completeId,
        category_id: workflowCat,
        release_id: getReleaseId('0.0.6'),
        shipped_at: '2025-09-28',
        priority: 1,
        effort_hrs: 80
      },
      {
        slug: 'template-groups',
        title: 'Template Groups',
        business_case: 'Organized artifact templates by category and use case',
        status_id: completeId,
        category_id: artifactsCat,
        release_id: getReleaseId('0.0.6'),
        shipped_at: '2025-09-28',
        priority: 2,
        effort_hrs: 24
      },
      {
        slug: 'dynamic-artifact-loading',
        title: 'Dynamic Artifact Loading',
        business_case: 'Lazy-loaded artifact components for performance',
        status_id: completeId,
        category_id: infraCat,
        release_id: getReleaseId('0.0.6'),
        shipped_at: '2025-09-28',
        priority: 2,
        effort_hrs: 16
      },
      {
        slug: 'progress-tracker',
        title: 'Workflow Progress Tracker',
        business_case: 'Visual progress indicator for multi-step workflows',
        status_id: completeId,
        category_id: uxCat,
        release_id: getReleaseId('0.0.6'),
        shipped_at: '2025-09-28',
        priority: 2,
        effort_hrs: 12
      },

      // 0.0.7 - Orchestrator Birth
      {
        slug: 'step-workflow-system',
        title: 'Step-Based Workflow System',
        business_case: 'Multi-step workflow engine with state management',
        status_id: completeId,
        category_id: workflowCat,
        release_id: getReleaseId('0.0.7'),
        shipped_at: '2025-10-27',
        priority: 1,
        effort_hrs: 80
      },
      {
        slug: 'workflow-registry',
        title: 'Workflow Registry',
        business_case: 'Central registry for all workflow definitions',
        status_id: completeId,
        category_id: infraCat,
        release_id: getReleaseId('0.0.7'),
        shipped_at: '2025-10-27',
        priority: 1,
        effort_hrs: 32
      },
      {
        slug: 'workflow-engine-component',
        title: 'WorkflowEngine Component',
        business_case: 'React component for rendering and executing workflows',
        status_id: completeId,
        category_id: workflowCat,
        release_id: getReleaseId('0.0.7'),
        shipped_at: '2025-10-27',
        priority: 1,
        effort_hrs: 48
      },
      {
        slug: 'database-driven-launches',
        title: 'Database-Driven Launches',
        business_case: 'Workflow launches stored and managed in database',
        status_id: completeId,
        category_id: infraCat,
        release_id: getReleaseId('0.0.7'),
        shipped_at: '2025-10-27',
        priority: 1,
        effort_hrs: 40
      },
      {
        slug: '7day-snooze-enforcement',
        title: '7-Day Snooze Enforcement',
        business_case: 'Automatic enforcement of 7-day minimum snooze periods',
        status_id: completeId,
        category_id: workflowCat,
        release_id: getReleaseId('0.0.7'),
        shipped_at: '2025-10-27',
        priority: 2,
        effort_hrs: 8
      },

      // 0.0.8 - Labs Launch
      {
        slug: 'renubu-labs-multidomain',
        title: 'Renubu Labs Multi-Domain',
        business_case: 'Multi-domain proof of concept for Renubu Labs',
        status_id: completeId,
        category_id: infraCat,
        release_id: getReleaseId('0.0.8'),
        shipped_at: '2025-10-31',
        priority: 1,
        effort_hrs: 40
      },
      {
        slug: 'weekly-planner-workflow',
        title: 'Weekly Planner Workflow',
        business_case: 'AI-powered weekly planning workflow prototype',
        status_id: completeId,
        category_id: aiCat,
        release_id: getReleaseId('0.0.8'),
        shipped_at: '2025-10-31',
        priority: 2,
        effort_hrs: 60
      },
      {
        slug: 'email-orchestration-prototype',
        title: 'Email Orchestration Prototype',
        business_case: 'Email-based workflow triggers and actions',
        status_id: completeId,
        category_id: integrationCat,
        release_id: getReleaseId('0.0.8'),
        shipped_at: '2025-10-31',
        priority: 2,
        effort_hrs: 32
      },

      // 0.0.9 - Pre-Production Polish
      {
        slug: 'code-consolidation',
        title: 'Code Consolidation',
        business_case: 'Refactoring and cleanup of legacy code',
        status_id: completeId,
        category_id: infraCat,
        release_id: getReleaseId('0.0.9'),
        shipped_at: '2025-11-06',
        priority: 1,
        effort_hrs: 40
      },
      {
        slug: 'architecture-documentation',
        title: 'Architecture Documentation',
        business_case: 'Comprehensive technical architecture docs',
        status_id: completeId,
        category_id: infraCat,
        release_id: getReleaseId('0.0.9'),
        shipped_at: '2025-11-06',
        priority: 1,
        effort_hrs: 24
      },
      {
        slug: 'build-optimization',
        title: 'Build Configuration Optimization',
        business_case: 'Optimized build process for faster deployments',
        status_id: completeId,
        category_id: infraCat,
        release_id: getReleaseId('0.0.9'),
        shipped_at: '2025-11-06',
        priority: 2,
        effort_hrs: 16
      },

      // 0.1.0 - Zen Dashboard
      {
        slug: 'zen-dashboard-modernization',
        title: 'Zen Dashboard Modernization',
        business_case: 'Complete UI/UX overhaul with modern design system',
        status_id: completeId,
        category_id: uxCat,
        release_id: getReleaseId('0.1.0'),
        shipped_at: '2025-11-06',
        priority: 1,
        effort_hrs: 80
      },
      {
        slug: 'chat-integration-ui',
        title: 'Chat Integration UI',
        business_case: 'In-app chat interface for AI assistance',
        status_id: completeId,
        category_id: aiCat,
        release_id: getReleaseId('0.1.0'),
        shipped_at: '2025-11-06',
        priority: 1,
        effort_hrs: 40
      },
      {
        slug: 'living-documentation-system',
        title: 'Living Documentation System',
        business_case: 'Auto-updating documentation from codebase',
        status_id: completeId,
        category_id: infraCat,
        release_id: getReleaseId('0.1.0'),
        shipped_at: '2025-11-06',
        priority: 2,
        effort_hrs: 32
      },
      {
        slug: 'github-projects-integration',
        title: 'GitHub Projects Integration',
        business_case: 'Sync features and releases with GitHub Projects',
        status_id: completeId,
        category_id: integrationCat,
        release_id: getReleaseId('0.1.0'),
        shipped_at: '2025-11-06',
        priority: 2,
        effort_hrs: 24
      },
      {
        slug: 'production-build-system',
        title: 'Production Build System',
        business_case: 'Robust production build and deployment pipeline',
        status_id: completeId,
        category_id: infraCat,
        release_id: getReleaseId('0.1.0'),
        shipped_at: '2025-11-06',
        priority: 1,
        effort_hrs: 40
      },

      // 0.1.1 - Multi-Tenancy
      {
        slug: 'workspace-authentication',
        title: 'Workspace Authentication',
        business_case: 'Company-based isolation with workspace context',
        status_id: completeId,
        category_id: infraCat,
        release_id: getReleaseId('0.1.1'),
        shipped_at: '2025-11-08',
        priority: 1,
        effort_hrs: 60
      },
      {
        slug: 'workspace-invitations',
        title: 'Workspace Invitation System',
        business_case: 'Invite users to workspaces with role management',
        status_id: completeId,
        category_id: uxCat,
        release_id: getReleaseId('0.1.1'),
        shipped_at: '2025-11-08',
        priority: 1,
        effort_hrs: 32
      },
      {
        slug: 'multidomain-workflow-support',
        title: 'Multi-Domain Workflow Support',
        business_case: 'Workflows that work across different product domains',
        status_id: completeId,
        category_id: workflowCat,
        release_id: getReleaseId('0.1.1'),
        shipped_at: '2025-11-08',
        priority: 2,
        effort_hrs: 40
      },

      // 0.1.2 - MCP Foundation
      {
        slug: 'mcp-registry-infrastructure',
        title: 'MCP Registry Infrastructure',
        business_case: 'Model Context Protocol server registry and management',
        status_id: completeId,
        category_id: infraCat,
        release_id: getReleaseId('0.1.2'),
        shipped_at: '2025-11-12',
        priority: 1,
        effort_hrs: 48
      },
      {
        slug: 'google-calendar-oauth',
        title: 'Google Calendar OAuth',
        business_case: 'OAuth integration for Google Calendar access',
        status_id: completeId,
        category_id: integrationCat,
        release_id: getReleaseId('0.1.2'),
        shipped_at: '2025-11-12',
        priority: 1,
        effort_hrs: 16
      },
      {
        slug: 'gmail-oauth',
        title: 'Gmail OAuth',
        business_case: 'OAuth integration for Gmail access',
        status_id: completeId,
        category_id: integrationCat,
        release_id: getReleaseId('0.1.2'),
        shipped_at: '2025-11-12',
        priority: 1,
        effort_hrs: 16
      },
      {
        slug: 'slack-oauth',
        title: 'Slack OAuth',
        business_case: 'OAuth integration for Slack workspace access',
        status_id: completeId,
        category_id: integrationCat,
        release_id: getReleaseId('0.1.2'),
        shipped_at: '2025-11-12',
        priority: 1,
        effort_hrs: 16
      },
      {
        slug: 'email-orchestration',
        title: 'Email Orchestration',
        business_case: 'Email-based workflow triggers and notifications',
        status_id: completeId,
        category_id: workflowCat,
        release_id: getReleaseId('0.1.2'),
        shipped_at: '2025-11-12',
        priority: 2,
        effort_hrs: 32
      },
      {
        slug: 'feature-tracking-system',
        title: 'Feature Tracking System',
        business_case: 'Database registry for feature management and roadmap',
        status_id: completeId,
        category_id: infraCat,
        release_id: getReleaseId('0.1.2'),
        shipped_at: '2025-11-12',
        priority: 1,
        effort_hrs: 24
      },

      // 0.1.3 - Parking Lot System
      {
        slug: 'parking-lot-dashboard',
        title: 'Parking Lot Dashboard',
        business_case: 'Dashboard for tracking parked workflow items',
        status_id: completeId,
        category_id: dashboardsCat,
        release_id: getReleaseId('0.1.3'),
        shipped_at: '2025-11-15',
        priority: 1,
        effort_hrs: 32
      },
      {
        slug: 'ai-workflow-event-detection',
        title: 'AI Workflow Event Detection',
        business_case: 'LLM-powered detection of workflow events and anomalies',
        status_id: completeId,
        category_id: aiCat,
        release_id: getReleaseId('0.1.3'),
        shipped_at: '2025-11-15',
        priority: 1,
        effort_hrs: 40
      },
      {
        slug: 'llm-analysis-claude',
        title: 'LLM Analysis with Claude Sonnet 4.5',
        business_case: 'Integration with Claude AI for workflow analysis',
        status_id: completeId,
        category_id: aiCat,
        release_id: getReleaseId('0.1.3'),
        shipped_at: '2025-11-15',
        priority: 1,
        effort_hrs: 24
      },
      {
        slug: 'workflow-health-scoring',
        title: 'Workflow Health Scoring',
        business_case: 'Automated health scores for workflow executions',
        status_id: completeId,
        category_id: workflowCat,
        release_id: getReleaseId('0.1.3'),
        shipped_at: '2025-11-15',
        priority: 2,
        effort_hrs: 16
      },

      // 0.1.4 - Skip & Review Systems
      {
        slug: 'skip-trigger-system',
        title: 'Skip Trigger System',
        business_case: 'Four trigger conventions for skipping workflow steps',
        status_id: completeId,
        category_id: workflowCat,
        release_id: getReleaseId('0.1.4'),
        shipped_at: '2025-11-15',
        priority: 1,
        effort_hrs: 24
      },
      {
        slug: 'review-trigger-system',
        title: 'Review Trigger System',
        business_case: 'Approval workflow system with review gates',
        status_id: completeId,
        category_id: workflowCat,
        release_id: getReleaseId('0.1.4'),
        shipped_at: '2025-11-15',
        priority: 1,
        effort_hrs: 32
      },
      {
        slug: 'flow-control-modals',
        title: 'Enhanced Flow Control Modals',
        business_case: 'Improved UI for skip and review decisions',
        status_id: completeId,
        category_id: uxCat,
        release_id: getReleaseId('0.1.4'),
        shipped_at: '2025-11-15',
        priority: 2,
        effort_hrs: 16
      },

      // 0.1.5 - String-Tie & Optimization
      {
        slug: 'string-tie-reminders',
        title: 'String-Tie Natural Language Reminders',
        business_case: 'AI-powered natural language reminder system',
        status_id: completeId,
        category_id: aiCat,
        release_id: getReleaseId('0.1.5'),
        shipped_at: '2025-11-16',
        priority: 1,
        effort_hrs: 48
      },
      {
        slug: 'voice-dictation',
        title: 'Voice Dictation',
        business_case: 'Voice input for reminders and workflow actions',
        status_id: completeId,
        category_id: uxCat,
        release_id: getReleaseId('0.1.5'),
        shipped_at: '2025-11-16',
        priority: 2,
        effort_hrs: 24
      },
      {
        slug: 'feature-flag-infrastructure',
        title: 'Feature Flag Infrastructure',
        business_case: 'System for toggling features per workspace/user',
        status_id: completeId,
        category_id: infraCat,
        release_id: getReleaseId('0.1.5'),
        shipped_at: '2025-11-16',
        priority: 1,
        effort_hrs: 20
      },
      {
        slug: 'code-optimization-phase1',
        title: 'Code Optimization Phase 1',
        business_case: 'Performance improvements and code cleanup',
        status_id: completeId,
        category_id: infraCat,
        release_id: getReleaseId('0.1.5'),
        shipped_at: '2025-11-16',
        priority: 2,
        effort_hrs: 32
      },

      // 0.1.6 - Workflow Templates
      {
        slug: 'workflow-template-system',
        title: 'Database-Driven Workflow Template System',
        business_case: 'Template system with scope-based inheritance',
        status_id: completeId,
        category_id: workflowCat,
        release_id: getReleaseId('0.1.6'),
        shipped_at: '2025-11-17',
        priority: 1,
        effort_hrs: 60
      },
      {
        slug: 'scope-inheritance',
        title: 'Scope-Based Inheritance',
        business_case: 'Hierarchical template inheritance (global → workspace → customer)',
        status_id: completeId,
        category_id: workflowCat,
        release_id: getReleaseId('0.1.6'),
        shipped_at: '2025-11-17',
        priority: 1,
        effort_hrs: 40
      },
      {
        slug: 'workflow-compilation-service',
        title: 'Workflow Compilation Service',
        business_case: 'Service to compile templates into executable workflows',
        status_id: completeId,
        category_id: workflowCat,
        release_id: getReleaseId('0.1.6'),
        shipped_at: '2025-11-17',
        priority: 1,
        effort_hrs: 48
      },
      {
        slug: 'inhersight-integration',
        title: 'InHerSight Integration',
        business_case: 'Integration testing with InHerSight customer workflows',
        status_id: completeId,
        category_id: integrationCat,
        release_id: getReleaseId('0.1.6'),
        shipped_at: '2025-11-17',
        priority: 2,
        effort_hrs: 24
      },
    ];

    console.log(`📦 Inserting ${features.length} features...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const feature of features) {
      const { error } = await supabase.from('features').insert(feature);

      if (error) {
        console.error(`❌ ${feature.slug}:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ ${feature.slug}`);
        successCount++;
      }
    }

    console.log(`\n🎉 Created ${successCount}/${features.length} features!`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} errors encountered`);
    }

    // Verify
    console.log('\n🔍 Verifying...');
    const { data: allFeatures, error: verifyError } = await supabase
      .from('features')
      .select('slug, title, release_id')
      .order('slug');

    if (verifyError) throw verifyError;

    console.log(`✅ Total features in database: ${allFeatures?.length}\n`);

    // Summary
    console.log('━'.repeat(60));
    console.log('📋 Features Population Summary');
    console.log('━'.repeat(60));
    console.log(`✅ ${successCount} features created`);
    console.log('✅ Features mapped to releases 0.0.1 through 0.1.6');
    console.log(`✅ Total features: ${allFeatures?.length}`);
    console.log('\n📝 Next steps:');
    console.log('1. Run: npm run roadmap (to regenerate with features)');
    console.log('2. Verify features at /features (if page exists)');
    console.log('━'.repeat(60));

  } catch (error) {
    console.error('\n❌ Population failed:', error);
    process.exit(1);
  }
}

populateFeatures()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
