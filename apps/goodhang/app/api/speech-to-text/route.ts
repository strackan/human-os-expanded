/**
 * POST /api/speech-to-text
 *
 * Fallback speech-to-text endpoint using OpenAI Whisper API
 * Used when browser doesn't support Web Speech API
 *
 * Request: multipart/form-data with audio file
 * Response: { text: string }
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get audio file from form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'OpenAI API key not configured',
          details: 'Set OPENAI_API_KEY in environment variables to enable Whisper fallback',
        },
        { status: 500 }
      );
    }

    // Prepare form data for Whisper API
    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile);
    whisperFormData.append('model', 'whisper-1');
    whisperFormData.append('language', 'en'); // Can be made dynamic
    whisperFormData.append('response_format', 'json');

    // Call OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: whisperFormData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Whisper API error:', error);
      return NextResponse.json(
        { error: 'Transcription failed', details: error },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      text: result.text,
      duration: result.duration,
    });
  } catch (error: unknown) {
    console.error('Speech-to-text error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
