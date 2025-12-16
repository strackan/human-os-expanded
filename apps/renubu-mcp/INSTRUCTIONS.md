# Renubu Integration MCP Server

External enrichment and relationship context service for Renubu CS workflows.

## Purpose

This MCP server provides **public/external intelligence** from Human-OS to Renubu:

- **Contact enrichment**: LinkedIn profile data, recent posts, activity signals
- **Company enrichment**: Industry, size, known contacts, company info
- **Relationship context**: Private opinions/notes about contacts (layer-scoped)
- **Skills files**: Tool and program definitions in Anthropic's format
- **Triangulation hints**: Shared connections, relationship signals

## Permission Boundary

This server enforces strict data boundaries:

### ✅ Accessible
- `gft.contacts` - LinkedIn profiles, headlines, about sections
- `gft.companies` - Company information, industry data
- `gft.li_posts` - Public LinkedIn posts and engagement
- `gft.activities` - Interaction history
- `relationship_context` - Layer-scoped opinions (renubu:* layers only)
- `context_files` - Skills files in permitted layers
- `skills_tools` / `skills_programs` - Tool/program definitions

### ❌ NOT Accessible
- `founder_os.*` - Personal tasks, goals, check-ins
- `powerpak.*` - Expert configurations
- `founder:*` layer files - Personal context files
- Private identity information

## Tools

### Enrichment Tools

#### `enrich_contact`
Look up a contact by name, email, or LinkedIn URL.

```json
{
  "contact_name": "Jane Smith",
  "company_name": "Acme Corp"
}
```

Returns: LinkedIn data, recent posts, activity summary

#### `enrich_company`
Look up a company by name, domain, or LinkedIn URL.

```json
{
  "company_name": "Acme Corp"
}
```

Returns: Company info, known contacts at company

#### `get_full_enrichment`
Complete enrichment for CS workflow prep.

```json
{
  "contact_name": "Jane Smith",
  "company_name": "Acme Corp"
}
```

Returns: Contact + Company + Triangulation hints

### Relationship Context Tools

#### `get_contact_opinions`
Get all opinions/notes about a contact.

```json
{
  "contact_entity_id": "uuid-here",
  "layer": "renubu:tenant-acme"
}
```

Returns: Array of opinions with type, content, sentiment, confidence

#### `upsert_opinion`
Create or update an opinion about a contact.

```json
{
  "contact_entity_id": "uuid-here",
  "opinion_type": "work_style",
  "content": "Prefers data-driven conversations, responds well to ROI metrics",
  "sentiment": "positive",
  "confidence": "high",
  "layer": "renubu:tenant-acme"
}
```

Opinion types: `general`, `work_style`, `communication`, `trust`, `negotiation`, `decision_making`, `responsiveness`, `relationship_history`

#### `delete_opinion`
Delete an opinion by ID.

```json
{
  "opinion_id": "uuid-here",
  "layer": "renubu:tenant-acme"
}
```

#### `search_opinions`
Search opinions by keyword across contacts.

```json
{
  "query": "budget conscious",
  "layer": "renubu:tenant-acme",
  "limit": 20
}
```

#### `get_opinion_summary`
Get a quick summary of opinions before a call.

```json
{
  "contact_entity_id": "uuid-here",
  "layer": "renubu:tenant-acme"
}
```

Returns: Has opinions, opinion types, overall sentiment, key points

### Skills File Tools

#### `list_skills_files`
List skills files by layer and source system.

```json
{
  "layer": "public",
  "source_system": "renubu",
  "limit": 100
}
```

#### `get_skills_file`
Get detailed skills file with tools and programs.

```json
{
  "file_id": "uuid-here"
}
```

Returns: File info, frontmatter, tools array, programs array

#### `search_skills_by_tool`
Find skills files that define a specific tool.

```json
{
  "tool_name": "renewal_playbook",
  "layer": "renubu:tenant-acme"
}
```

#### `get_entity_skills`
Get skills files linked to a person/expert.

```json
{
  "entity_id": "uuid-here"
}
```

#### `list_available_tools`
List all available tools across skills files.

```json
{
  "layer": "public",
  "limit": 50
}
```

## Usage Pattern

### Triangulation Flow

```
Renubu Internal Data          Human-OS (this MCP)
─────────────────────         ─────────────────────
User says: "stingy"    +      GFT says: "Just raised $50M"
Agent notes: "slow"    +      LinkedIn: "Promoted to VP"
                       │
                       ▼
              Triangulated insight:
              "Budget constraints may have lifted.
               New role = expansion opportunity."
```

### Workflow Initialization

```typescript
// Before starting a CS workflow
async function prepareWorkflow(contactId: string) {
  // 1. Get internal opinions
  const opinions = await mcp.call('get_contact_opinions', {
    contact_entity_id: contactId,
    layer: 'renubu:tenant-acme'
  });

  // 2. Get external enrichment
  const enrichment = await mcp.call('get_full_enrichment', {
    contact_name: 'Jane Smith',
    company_name: 'Acme Corp'
  });

  // 3. Combine for triangulated context
  return { opinions, enrichment };
}
```

## Configuration

Required environment variables:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key
DEFAULT_OWNER_ID=uuid-for-opinion-ownership  # Optional
```

## Installation

```bash
# From human-os root
pnpm install
pnpm --filter @human-os/renubu-mcp build
```

## Claude Desktop Config

```json
{
  "mcpServers": {
    "renubu-integration": {
      "command": "node",
      "args": ["/path/to/human-os/apps/renubu-mcp/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-key"
      }
    }
  }
}
```

## API Key Scoping

For production, create a scoped API key (see `027_renubu_api_key.sql`):

```sql
INSERT INTO api_keys (id, name, scopes, ...) VALUES (
  'hk_live_renubu_xxx',
  'Renubu Production',
  ARRAY[
    'gft:contacts:read',
    'gft:companies:read',
    'relationship:renubu:*:read',
    'relationship:renubu:*:write',
    'skills:public:read',
    'skills:renubu:*:read'
  ]
);
```

This ensures Renubu can only access permitted data layers.
