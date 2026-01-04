/**
 * PowerPoint Export API
 *
 * Generates a PowerPoint presentation from slide data and returns as download.
 * Server-side only because pptxgenjs requires Node.js modules.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generatePptxBlob } from '@/lib/export/PresentationExportService';
import type { PresentationSlide } from '@/components/artifacts/PresentationArtifact';

interface PptxExportRequest {
  slides: PresentationSlide[];
  customerName: string;
  fileName?: string;
}

/**
 * POST /api/export/pptx
 *
 * Generate and download PowerPoint presentation
 */
export async function POST(request: NextRequest) {
  try {
    const body: PptxExportRequest = await request.json();
    const { slides, customerName, fileName } = body;

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

    // Generate PowerPoint blob
    const pptxBlob = await generatePptxBlob(slides, customerName);

    // Generate filename
    const finalFileName = fileName || `${customerName.replace(/\s+/g, '-')}_QBR_${new Date().toISOString().split('T')[0]}.pptx`;

    // Convert Blob to ArrayBuffer then to Buffer
    const arrayBuffer = await pptxBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return as downloadable file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${finalFileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[PPTX Export API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate PowerPoint' },
      { status: 500 }
    );
  }
}
