# Founder OS MCP Server - Setup Script for Windows
# Run this script on a new machine to configure Claude Desktop

$ErrorActionPreference = "Stop"

Write-Host "Founder OS MCP Server Setup" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# Get the directory where this script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ExePath = Join-Path $ScriptDir "founder-os-mcp.exe"

# Check if exe exists
if (-not (Test-Path $ExePath)) {
    Write-Host "ERROR: founder-os-mcp.exe not found in script directory" -ForegroundColor Red
    Write-Host "Make sure founder-os-mcp.exe is in the same folder as this script" -ForegroundColor Yellow
    exit 1
}

Write-Host "Found executable: $ExePath" -ForegroundColor Green
Write-Host ""

# Claude Desktop config location
$ClaudeConfigDir = Join-Path $env:APPDATA "Claude"
$ClaudeConfigPath = Join-Path $ClaudeConfigDir "claude_desktop_config.json"

# Create config directory if it doesn't exist
if (-not (Test-Path $ClaudeConfigDir)) {
    Write-Host "Creating Claude config directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $ClaudeConfigDir -Force | Out-Null
}

# Prompt for configuration values
Write-Host "Configuration" -ForegroundColor Cyan
Write-Host "-------------" -ForegroundColor Cyan
Write-Host ""

$DefaultSupabaseUrl = "https://zulowgscotdrqlccomht.supabase.co"
$SupabaseUrl = Read-Host "Supabase URL [$DefaultSupabaseUrl]"
if ([string]::IsNullOrWhiteSpace($SupabaseUrl)) {
    $SupabaseUrl = $DefaultSupabaseUrl
}

$SupabaseKey = Read-Host "Supabase Service Role Key (required)"
if ([string]::IsNullOrWhiteSpace($SupabaseKey)) {
    Write-Host "ERROR: Supabase Service Role Key is required" -ForegroundColor Red
    exit 1
}

$DefaultUserId = "justin"
$UserId = Read-Host "Human OS User ID [$DefaultUserId]"
if ([string]::IsNullOrWhiteSpace($UserId)) {
    $UserId = $DefaultUserId
}

$DefaultLayer = "founder:$UserId"
$Layer = Read-Host "Human OS Layer [$DefaultLayer]"
if ([string]::IsNullOrWhiteSpace($Layer)) {
    $Layer = $DefaultLayer
}

# Build the config
$Config = @{
    mcpServers = @{
        "founder-os" = @{
            command = $ExePath
            args = @()
            env = @{
                SUPABASE_URL = $SupabaseUrl
                SUPABASE_SERVICE_ROLE_KEY = $SupabaseKey
                HUMAN_OS_USER_ID = $UserId
                HUMAN_OS_LAYER = $Layer
            }
        }
    }
}

# Check if config already exists
if (Test-Path $ClaudeConfigPath) {
    Write-Host ""
    Write-Host "Existing Claude Desktop config found." -ForegroundColor Yellow
    $Backup = Read-Host "Create backup before modifying? (Y/n)"
    if ($Backup -ne "n" -and $Backup -ne "N") {
        $BackupPath = "$ClaudeConfigPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item $ClaudeConfigPath $BackupPath
        Write-Host "Backup created: $BackupPath" -ForegroundColor Green
    }

    # Read existing config and merge
    try {
        $ExistingConfig = Get-Content $ClaudeConfigPath -Raw | ConvertFrom-Json -AsHashtable
        if ($ExistingConfig.mcpServers) {
            $ExistingConfig.mcpServers["founder-os"] = $Config.mcpServers["founder-os"]
            $Config = $ExistingConfig
        }
    } catch {
        Write-Host "Could not parse existing config, will overwrite" -ForegroundColor Yellow
    }
}

# Write the config
$ConfigJson = $Config | ConvertTo-Json -Depth 10
$ConfigJson | Out-File -FilePath $ClaudeConfigPath -Encoding UTF8

Write-Host ""
Write-Host "Configuration saved to: $ClaudeConfigPath" -ForegroundColor Green
Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart Claude Desktop" -ForegroundColor White
Write-Host "2. The founder-os MCP server should now be available" -ForegroundColor White
Write-Host ""

# Show the config
Write-Host "Generated config:" -ForegroundColor Cyan
Write-Host $ConfigJson -ForegroundColor Gray
