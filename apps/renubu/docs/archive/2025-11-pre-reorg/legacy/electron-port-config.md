# Electron App Port Configuration

## Recommended Configuration

For the Electron app running from `@/renubu/guyforthat/`, please configure it to use **port 4000**.

## Port Assignment

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Next.js App** | 3000+ (auto-increment) | `http://localhost:3000` | Main web application |
| **Electron App** | 4000 | `http://localhost:4000` | Desktop wrapper |
| **Supabase** | 54321 | `http://localhost:54321` | Database |

## Next.js Behavior

- **Primary port**: 3000
- **Auto-increment**: If 3000 is busy, Next.js will automatically use 3001, 3002, etc.
- **No manual configuration needed**: Next.js handles port conflicts automatically

## Electron App Configuration

Update your Electron app to use port 4000:

```javascript
// In your Electron main process
const mainWindow = new BrowserWindow({
  // ... other options
  webPreferences: {
    // ... other options
    nodeIntegration: false,
    contextIsolation: true,
  }
});

// Configure the server to run on port 4000
const server = http.createServer(app);
server.listen(4000, () => {
  console.log('Electron app running on port 4000');
});
```

## Benefits

1. **No conflicts**: Each service has its dedicated port range
2. **Automatic handling**: Next.js handles port conflicts automatically
3. **Simple configuration**: Only Electron app needs manual port configuration
4. **Clear separation**: Easy to identify which service is running on which port
