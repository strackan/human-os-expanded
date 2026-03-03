const path = require('path');
const here = (...p) => path.resolve(__dirname, ...p);

module.exports = {
  apps: [
    // =========================================================================
    // RENUBU FAMILY (4000–4099)
    // =========================================================================
    {
      name: 'renubu:renubu-web',
      cwd: here('human-os/core/apps/renubu'),
      script: 'node_modules/next/dist/bin/next',
      args: 'dev -p 4000',
      env: { PORT: 4000, NODE_ENV: 'development' },
      env_staging: { PORT: 4010, NODE_ENV: 'staging' },
      env_demo: { PORT: 4020, NODE_ENV: 'demo' },
      namespace: 'renubu',
      autorestart: false,
      watch: false,
    },
    {
      name: 'renubu:renewal-planner',
      cwd: here('human-os/renubu/renewal-planner'),
      script: 'node_modules/next/dist/bin/next',
      args: 'dev --turbopack -p 4001',
      env: { PORT: 4001, NODE_ENV: 'development' },
      env_staging: { PORT: 4011, NODE_ENV: 'staging' },
      env_demo: { PORT: 4021, NODE_ENV: 'demo' },
      namespace: 'renubu',
      autorestart: false,
      watch: false,
    },

    // =========================================================================
    // GOOD HANG FAMILY (4100–4199)
    // =========================================================================
    {
      name: 'goodhang:goodhang-web',
      cwd: here('human-os/core/apps/goodhang'),
      script: 'node_modules/next/dist/bin/next',
      args: 'dev -p 4100',
      env: { PORT: 4100, NODE_ENV: 'development' },
      env_staging: { PORT: 4110, NODE_ENV: 'staging' },
      env_demo: { PORT: 4120, NODE_ENV: 'demo' },
      namespace: 'goodhang',
      autorestart: false,
      watch: false,
    },
    {
      name: 'goodhang:roadtrip',
      cwd: here('human-os/goodhang/roadtrip'),
      script: 'node_modules/next/dist/bin/next',
      args: 'dev -p 4101',
      env: { PORT: 4101, NODE_ENV: 'development' },
      env_staging: { PORT: 4111, NODE_ENV: 'staging' },
      env_demo: { PORT: 4121, NODE_ENV: 'demo' },
      namespace: 'goodhang',
      autorestart: false,
      watch: false,
    },
    {
      name: 'goodhang:goodhang-desktop',
      cwd: here('human-os/core/apps/goodhang-desktop'),
      script: 'node_modules/vite/bin/vite.js',
      args: '--port 4102',
      env: { PORT: 4102, NODE_ENV: 'development' },
      env_staging: { PORT: 4112, NODE_ENV: 'staging' },
      env_demo: { PORT: 4122, NODE_ENV: 'demo' },
      namespace: 'goodhang',
      autorestart: false,
      watch: false,
    },

    // =========================================================================
    // FANCY ROBOT / ARI FAMILY (4200–4299)
    // =========================================================================
    {
      name: 'fancyrobot:fancy-robot',
      cwd: here('human-os/core/apps/fancy-robot'),
      script: 'node_modules/next/dist/bin/next',
      args: 'dev -p 4200',
      env: { PORT: 4200, NODE_ENV: 'development' },
      env_staging: { PORT: 4210, NODE_ENV: 'staging' },
      env_demo: { PORT: 4220, NODE_ENV: 'demo' },
      namespace: 'fancyrobot',
      autorestart: false,
      watch: false,
    },
    {
      name: 'fancyrobot:ari-frontend',
      cwd: here('human-os/core/apps/ari/frontend'),
      script: 'node_modules/vite/bin/vite.js',
      args: '--port 4202',
      env: { PORT: 4202, NODE_ENV: 'development' },
      env_staging: { PORT: 4212, NODE_ENV: 'staging' },
      env_demo: { PORT: 4222, NODE_ENV: 'demo' },
      namespace: 'fancyrobot',
      autorestart: false,
      watch: false,
    },
    {
      name: 'fancyrobot:ari-backend',
      cwd: here('human-os/core/apps/ari/backend'),
      script: 'python',
      args: '-m uvicorn app.main:app --reload --port 4250',
      interpreter: 'none',
      env: { PORT: 4250 },
      env_staging: { PORT: 4260 },
      env_demo: { PORT: 4270 },
      namespace: 'fancyrobot',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      watch: false,
    },

    // =========================================================================
    // POWERPAK / MCP WORLD (4300–4399)
    // =========================================================================
    {
      name: 'powerpak:powerpak-demo',
      cwd: here('human-os/powerpak/packages/better-chatbot'),
      script: '../../node_modules/next/dist/bin/next',
      args: 'dev -p 4300',
      env: { PORT: 4300, NODE_ENV: 'development' },
      env_staging: { PORT: 4310, NODE_ENV: 'staging' },
      env_demo: { PORT: 4320, NODE_ENV: 'demo' },
      namespace: 'powerpak',
      autorestart: false,
      watch: false,
    },
    // TODO: gtm-adventure is migrating into goodhang-web as a route group.
    // Once merged, remove this entry — adventure will be served by goodhang:goodhang-web on 4100.
    {
      name: 'powerpak:gtm-adventure',
      cwd: here('gtm.consulting/adventure'),
      script: 'node_modules/vite/bin/vite.js',
      args: '--port 4301',
      env: { PORT: 4301, NODE_ENV: 'development' },
      env_staging: { PORT: 4311, NODE_ENV: 'staging' },
      env_demo: { PORT: 4321, NODE_ENV: 'demo' },
      namespace: 'powerpak',
      autorestart: false,
      watch: false,
    },

    // =========================================================================
    // HUMAN OS / FOUNDER-OS (4400–4499)
    // =========================================================================
    {
      name: 'humanos:founder-os-web',
      cwd: here('human-os/core/apps/founder-os/web'),
      script: 'node_modules/next/dist/bin/next',
      args: 'dev -p 4400',
      env: { PORT: 4400, NODE_ENV: 'development' },
      env_staging: { PORT: 4410, NODE_ENV: 'staging' },
      env_demo: { PORT: 4420, NODE_ENV: 'demo' },
      namespace: 'humanos',
      autorestart: false,
      watch: false,
    },
    {
      name: 'humanos:api',
      cwd: here('human-os/core/apps/api'),
      script: 'node_modules/tsx/dist/cli.mjs',
      args: 'watch src/server.ts',
      env: { PORT: 4401, NODE_ENV: 'development' },
      env_staging: { PORT: 4411, NODE_ENV: 'staging' },
      env_demo: { PORT: 4421, NODE_ENV: 'demo' },
      namespace: 'humanos',
      autorestart: false,
      watch: false,
    },

    // =========================================================================
    // GFT FAMILY (4500–4599)
    // =========================================================================
    {
      name: 'gft:gft-crm',
      cwd: here('human-os/gft/crm-web'),
      script: 'node_modules/next/dist/bin/next',
      args: 'dev -p 4502',
      env: { PORT: 4502, NODE_ENV: 'development' },
      env_staging: { PORT: 4512, NODE_ENV: 'staging' },
      env_demo: { PORT: 4522, NODE_ENV: 'demo' },
      namespace: 'gft',
      autorestart: false,
      watch: false,
    },

    // =========================================================================
    // STANDALONE / PERSONAL / TOOLS (4500–4599)
    // =========================================================================
    {
      name: 'standalone:justinstrackany',
      cwd: here('justinstrackany'),
      script: 'node_modules/next/dist/bin/next',
      args: 'dev -p 4500',
      env: { PORT: 4500, NODE_ENV: 'development' },
      env_staging: { PORT: 4510, NODE_ENV: 'staging' },
      env_demo: { PORT: 4520, NODE_ENV: 'demo' },
      namespace: 'standalone',
      autorestart: false,
      watch: false,
    },
    {
      name: 'standalone:creativity-journal',
      cwd: here('creativity-journal/creativityjournal'),
      script: 'node_modules/next/dist/bin/next',
      args: 'dev -p 4501',
      env: { PORT: 4501, NODE_ENV: 'development' },
      env_staging: { PORT: 4511, NODE_ENV: 'staging' },
      env_demo: { PORT: 4521, NODE_ENV: 'demo' },
      namespace: 'standalone',
      autorestart: false,
      watch: false,
    },

    // =========================================================================
    // AI / CREATIVE TOOLS (7860+)
    // =========================================================================
    {
      name: 'standalone:deforum',
      cwd: 'C:\\Users\\TriCityPC\\stable-diffusion-webui',
      script: 'venv/Scripts/python.exe',
      args: 'launch.py --skip-install',
      interpreter: 'none',
      env: { SD_WEBUI_RESTART: 'tmp/restart', ERROR_REPORTING: 'FALSE' },
      namespace: 'standalone',
      autorestart: false,
      watch: false,
    },
    {
      name: 'standalone:sd-webui',
      cwd: 'C:\\Users\\TriCityPC\\stable-diffusion-webui',
      script: 'venv/Scripts/python.exe',
      args: 'launch.py --skip-install',
      interpreter: 'none',
      env: { SD_WEBUI_RESTART: 'tmp/restart', ERROR_REPORTING: 'FALSE' },
      namespace: 'standalone',
      autorestart: false,
      watch: false,
    },

    // =========================================================================
    // DEV INFRASTRUCTURE
    // =========================================================================
    {
      name: 'dev:proxy',
      cwd: here('.'),
      script: 'proxy.js',
      namespace: 'dev',
      autorestart: false,
      watch: false,
    },
  ],
};
