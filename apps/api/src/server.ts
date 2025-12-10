/**
 * Human OS API Gateway
 *
 * REST API server providing endpoints for:
 * - Context operations
 * - Knowledge graph operations
 * - Entity operations
 * - Voice pack operations
 * - Expert profile operations
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {
  createSupabaseClient,
  ContextEngine,
  KnowledgeGraph,
  type Viewer,
} from '@human-os/core';

import { createAuthMiddleware } from './middleware/auth.js';
import { rateLimit } from './middleware/rate-limit.js';
import { createContextRoutes } from './routes/v1/context.js';
import { createGraphRoutes } from './routes/v1/graph.js';
import { createEntitiesRoutes } from './routes/v1/entities.js';
import { createVoiceRoutes } from './routes/v1/voice.js';
import { createExpertsRoutes } from './routes/v1/experts.js';

/**
 * Environment configuration
 */
const PORT = process.env['PORT'] || 3000;
const SUPABASE_URL = process.env['SUPABASE_URL'];
const SUPABASE_SERVICE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'];

/**
 * Main server setup
 */
async function main() {
  // Validate required environment variables
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
    process.exit(1);
  }

  // Base config for core classes
  const baseConfig = {
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_SERVICE_KEY,
  };

  // Initialize Supabase client
  const supabase = createSupabaseClient(baseConfig);

  // Create default viewer (will be overridden by auth middleware)
  const viewer: Viewer = {};

  // Initialize core services
  const contextEngine = new ContextEngine({ ...baseConfig, viewer });
  const knowledgeGraph = new KnowledgeGraph({ ...baseConfig });

  // Create Express app
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Health check (no auth required)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: '0.1.0' });
  });

  // Auth and rate limiting for all /v1 routes
  const authMiddleware = createAuthMiddleware(supabase);
  app.use('/v1', authMiddleware);
  app.use('/v1', rateLimit());

  // Register v1 routes
  app.use('/v1/context', createContextRoutes(contextEngine));
  app.use('/v1/graph', createGraphRoutes(knowledgeGraph));
  app.use('/v1/entities', createEntitiesRoutes(supabase));
  app.use('/v1/voice', createVoiceRoutes(contextEngine));
  app.use('/v1/experts', createExpertsRoutes(supabase, contextEngine));

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Error handler
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`Human OS API Gateway running on port ${PORT}`);
  });
}

// Run the server
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
