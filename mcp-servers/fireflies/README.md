# Fireflies.ai MCP Server

MCP server wrapper for Fireflies.ai meeting transcription service. This server enables AI assistants to query meeting transcripts via the Model Context Protocol.

## Features

### Tools

- **fireflies_list_transcripts**: List recent meeting transcripts with metadata
- **fireflies_get_transcript**: Get the full transcript by ID including AI summary
- **fireflies_search**: Search across all transcripts

### Resources

- `fireflies://recent` - List of recent transcripts
- `fireflies://transcripts/{id}` - Individual transcript content

## Setup

### Prerequisites

1. Fireflies.ai account with API access
2. API key from [Fireflies Developer Portal](https://app.fireflies.ai/integrations)

### Installation

```bash
cd mcp-servers/fireflies
npm install
npm run build
```

### Configuration

Set your Fireflies API key as an environment variable:

```bash
export FIREFLIES_API_KEY=your_api_key_here
```

### Running

```bash
npm start
```

Or use with MCP client:

```json
{
  "mcpServers": {
    "fireflies": {
      "command": "node",
      "args": ["path/to/mcp-servers/fireflies/dist/index.js"],
      "env": {
        "FIREFLIES_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Usage Examples

### List Recent Transcripts

```json
{
  "tool": "fireflies_list_transcripts",
  "arguments": {
    "limit": 10
  }
}
```

### Get Full Transcript

```json
{
  "tool": "fireflies_get_transcript",
  "arguments": {
    "id": "transcript_id_here"
  }
}
```

### Search Transcripts

```json
{
  "tool": "fireflies_search",
  "arguments": {
    "query": "product roadmap",
    "limit": 5
  }
}
```

## Human OS Integration

This MCP server is designed to integrate with Human OS's multi-source extraction system:

1. User configures Fireflies in Human OS settings
2. Dream sequence queries this MCP server nightly
3. Entities, patterns, and summaries are extracted
4. Raw transcripts stay in Fireflies (MCP-native architecture)

## Rate Limits

Fireflies API has rate limits. The server handles pagination but you should:
- Avoid excessive parallel queries
- Use search instead of listing all transcripts
- Cache results where appropriate

## License

Proprietary - Human OS
