#!/usr/bin/env node
/**
 * Justin's Founder OS MCP Server
 *
 * Personalized executive management system for Justin Strackany.
 */

import { startFounderOSServer } from '@human-os/founder-os-base';

// Justin's configuration
const JUSTIN_USER_ID = process.env.JUSTIN_USER_ID || 'justin';
const JUSTIN_LAYER = 'founder:justin';

// Start the server
startFounderOSServer({
  userId: JUSTIN_USER_ID,
  layer: JUSTIN_LAYER,
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
