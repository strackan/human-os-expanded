# Release Notes API Documentation

## Overview

Public API endpoint for fetching Renubu release notes. This endpoint is designed to be consumed by the marketing website at `renubu.com/release-notes` while the data is managed in the main application database.

## Endpoint

```
GET https://app.renubu.com/api/release-notes
```

or for local development:
```
GET http://localhost:3000/api/release-notes
```

## Authentication

No authentication required. This is a public endpoint with CORS enabled for cross-origin requests.

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 10 | Maximum number of releases to return (1-100) |
| `version` | string | - | Filter by specific version (e.g., "0.1.6") |
| `includeUnreleased` | boolean | false | Include releases without `actual_shipped` date |

## Response Format

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "version": "0.1.6",
      "name": "Workflow Templates",
      "description": "Database-driven workflow template system...",
      "release_notes": "Full markdown release notes...",
      "planned_start": "2025-11-17",
      "planned_end": "2025-11-17",
      "actual_shipped": "2025-11-17T00:00:00+00:00",
      "phase_number": null,
      "status_id": "uuid",
      "created_at": "2025-11-18T14:05:36.006316+00:00"
    }
  ],
  "count": 3
}
```

## Example Usage

### JavaScript/TypeScript (Client-Side)

```javascript
async function fetchReleaseNotes() {
  try {
    const response = await fetch('https://app.renubu.com/api/release-notes?limit=5');
    const result = await response.json();

    if (result.success) {
      console.log(`Found ${result.count} releases`);
      result.data.forEach(release => {
        console.log(`${release.version}: ${release.name}`);
      });
    }
  } catch (error) {
    console.error('Failed to fetch release notes:', error);
  }
}
```

### React Component Example

```tsx
import { useEffect, useState } from 'react';

interface Release {
  id: string;
  version: string;
  name: string;
  description: string;
  release_notes: string | null;
  actual_shipped: string;
}

export function ReleaseNotes() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReleases() {
      try {
        const response = await fetch('https://app.renubu.com/api/release-notes?limit=10');
        const result = await response.json();

        if (result.success) {
          setReleases(result.data);
        }
      } catch (error) {
        console.error('Error loading releases:', error);
      } finally {
        setLoading(false);
      }
    }

    loadReleases();
  }, []);

  if (loading) return <div>Loading release notes...</div>;

  return (
    <div>
      <h1>Release Notes</h1>
      {releases.map(release => (
        <div key={release.id}>
          <h2>{release.version}: {release.name}</h2>
          <p>{release.description}</p>
          <small>Released: {new Date(release.actual_shipped).toLocaleDateString()}</small>
          {release.release_notes && (
            <div dangerouslySetInnerHTML={{ __html: release.release_notes }} />
          )}
        </div>
      ))}
    </div>
  );
}
```

### HTML + Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <title>Renubu Release Notes</title>
  <style>
    .release {
      border: 1px solid #ddd;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .version {
      color: #0066cc;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>Renubu Release Notes</h1>
  <div id="releases"></div>

  <script>
    async function loadReleaseNotes() {
      const response = await fetch('https://app.renubu.com/api/release-notes?limit=10');
      const result = await response.json();

      const container = document.getElementById('releases');

      result.data.forEach(release => {
        const div = document.createElement('div');
        div.className = 'release';
        div.innerHTML = `
          <div class="version">${release.version}</div>
          <h2>${release.name}</h2>
          <p>${release.description}</p>
          <small>Released: ${new Date(release.actual_shipped).toLocaleDateString()}</small>
        `;
        container.appendChild(div);
      });
    }

    loadReleaseNotes();
  </script>
</body>
</html>
```

## CORS Configuration

The endpoint includes the following CORS headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

This allows cross-origin requests from any domain. If you need to restrict this to specific domains (e.g., only `renubu.com`), update the API route code:

```typescript
headers.set('Access-Control-Allow-Origin', 'https://renubu.com');
```

## Caching

Responses are cached for 5 minutes:

```
Cache-Control: public, max-age=300
```

## Error Handling

Error responses:

```json
{
  "error": "Failed to fetch release notes"
}
```

HTTP status codes:
- `200`: Success
- `500`: Server error

## Deployment Notes

### For Marketing Site Integration

1. **Production URL**: Use `https://app.renubu.com/api/release-notes`
2. **Staging URL**: Use `https://staging.app.renubu.com/api/release-notes` (if applicable)
3. **Local Development**: Use `http://localhost:3000/api/release-notes`

### Environment Variables Required

The API endpoint requires these environment variables in the Next.js application:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Alternative: Reverse Proxy Setup

If you want `renubu.com/release-notes` to serve the same content transparently:

**Vercel Configuration** (`vercel.json`):
```json
{
  "rewrites": [
    {
      "source": "/release-notes/:path*",
      "destination": "https://app.renubu.com/api/release-notes/:path*"
    }
  ]
}
```

**Nginx Configuration**:
```nginx
location /release-notes/ {
    proxy_pass https://app.renubu.com/api/release-notes/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## Database Schema Reference

The `releases` table structure:

```sql
CREATE TABLE releases (
  id UUID PRIMARY KEY,
  version TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  release_notes TEXT,
  planned_start DATE,
  planned_end DATE,
  actual_shipped TIMESTAMPTZ,
  phase_number INTEGER,
  status_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## Support

For issues or questions about this API, contact the development team or create an issue in the project repository.
