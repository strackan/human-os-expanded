/**
 * Google Drive Export API
 *
 * Uploads presentation as PowerPoint to user's Google Drive.
 * Requires user to have connected Google Drive integration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OAuthService } from '@/lib/services/OAuthService';
import { generatePptxBlob } from '@/lib/export/PresentationExportService';
import type { PresentationSlide } from '@/components/artifacts/PresentationArtifact';

const GOOGLE_DRIVE_API = 'https://www.googleapis.com/upload/drive/v3/files';
const GOOGLE_DRIVE_METADATA_API = 'https://www.googleapis.com/drive/v3/files';

interface DriveExportRequest {
  slides: PresentationSlide[];
  customerName: string;
  fileName?: string;
  folderId?: string; // Optional: specify a folder to upload to
}

/**
 * POST /api/export/drive
 *
 * Upload presentation to Google Drive
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: DriveExportRequest = await request.json();
    const { slides, customerName, fileName, folderId } = body;

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: slides array is required' },
        { status: 400 }
      );
    }

    if (!customerName) {
      return NextResponse.json(
        { error: 'Invalid request: customerName is required' },
        { status: 400 }
      );
    }

    // Find user's Google Drive integration
    const { data: userIntegration, error: integrationError } = await supabase
      .from('user_integrations')
      .select(`
        id,
        status,
        mcp_integrations!inner(slug, provider)
      `)
      .eq('user_id', user.id)
      .eq('mcp_integrations.slug', 'google-drive')
      .eq('status', 'active')
      .single();

    if (integrationError || !userIntegration) {
      // Check if they have any Google integration we can use
      const { data: googleIntegration } = await supabase
        .from('user_integrations')
        .select(`
          id,
          status,
          mcp_integrations!inner(slug, provider)
        `)
        .eq('user_id', user.id)
        .eq('mcp_integrations.provider', 'google')
        .eq('status', 'active')
        .limit(1)
        .single();

      if (!googleIntegration) {
        return NextResponse.json(
          {
            error: 'Google Drive not connected. Please connect Google Drive in your settings.',
            code: 'GOOGLE_DRIVE_NOT_CONNECTED',
          },
          { status: 403 }
        );
      }

      // Use the available Google integration
      return await uploadToDrive(
        googleIntegration.id,
        slides,
        customerName,
        fileName,
        folderId
      );
    }

    return await uploadToDrive(
      userIntegration.id,
      slides,
      customerName,
      fileName,
      folderId
    );
  } catch (error) {
    console.error('[Drive Export API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload to Google Drive' },
      { status: 500 }
    );
  }
}

/**
 * Upload presentation to Google Drive
 */
async function uploadToDrive(
  userIntegrationId: string,
  slides: PresentationSlide[],
  customerName: string,
  fileName?: string,
  folderId?: string
): Promise<NextResponse> {
  // Get valid access token
  const accessToken = await OAuthService.getValidAccessToken(
    userIntegrationId,
    'google',
    'google-drive'
  );

  // Generate PowerPoint blob
  const pptxBlob = await generatePptxBlob(slides, customerName);

  // Generate filename
  const finalFileName = fileName || `${customerName.replace(/\s+/g, '-')}_QBR_${new Date().toISOString().split('T')[0]}`;

  // Create file metadata
  const metadata: Record<string, unknown> = {
    name: `${finalFileName}.pptx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };

  // Add to specific folder if provided
  if (folderId) {
    metadata.parents = [folderId];
  }

  // Upload using multipart upload
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  // Convert blob to ArrayBuffer
  const arrayBuffer = await pptxBlob.arrayBuffer();
  const fileContent = Buffer.from(arrayBuffer);

  // Build multipart body
  const metadataPart = delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata);

  const filePart = delimiter +
    `Content-Type: ${metadata.mimeType}\r\n` +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    fileContent.toString('base64');

  const multipartBody = metadataPart + filePart + closeDelimiter;

  // Upload to Drive
  const uploadResponse = await fetch(
    `${GOOGLE_DRIVE_API}?uploadType=multipart`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error('[Drive Export] Upload failed:', errorText);
    throw new Error(`Failed to upload to Google Drive: ${uploadResponse.status}`);
  }

  const uploadResult = await uploadResponse.json();

  // Get the web view link
  const fileId = uploadResult.id;
  const webViewLink = `https://docs.google.com/presentation/d/${fileId}/edit`;

  return NextResponse.json({
    success: true,
    fileId,
    fileName: `${finalFileName}.pptx`,
    url: webViewLink,
    webViewLink,
    webContentLink: `https://drive.google.com/uc?id=${fileId}&export=download`,
  });
}

/**
 * GET /api/export/drive
 *
 * Check if user has Google Drive connected
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { connected: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check for Google integration
    const { data: integration } = await supabase
      .from('user_integrations')
      .select(`
        id,
        status,
        mcp_integrations!inner(slug, provider, name)
      `)
      .eq('user_id', user.id)
      .eq('mcp_integrations.provider', 'google')
      .eq('status', 'active')
      .limit(1)
      .single();

    // Extract integration info from the joined data
    // Supabase types infer an array for joined relations, but !inner ensures single object
    const mcpIntegration = integration?.mcp_integrations as unknown as { slug: string; name: string } | null;

    return NextResponse.json({
      connected: !!integration,
      integration: mcpIntegration ? {
        slug: mcpIntegration.slug,
        name: mcpIntegration.name,
      } : null,
    });
  } catch (error) {
    console.error('[Drive Export API] Status check error:', error);
    return NextResponse.json(
      { connected: false, error: 'Failed to check integration status' },
      { status: 500 }
    );
  }
}
