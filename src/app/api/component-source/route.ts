import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const componentPath = searchParams.get('path');

    if (!componentPath) {
      return NextResponse.json({ error: 'Component path is required' }, { status: 400 });
    }

    // Convert the path to a file system path
    let filePath: string;
    
    if (componentPath.startsWith('@/')) {
      // Convert @/ to src/
      filePath = componentPath.replace('@/', 'src/');
    } else if (componentPath.startsWith('/src/')) {
      // Remove leading slash
      filePath = componentPath.substring(1);
    } else {
      // Assume it's already a relative path
      filePath = componentPath;
    }

    // Add .tsx extension if not present
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) {
      filePath += '.tsx';
    }

    // Construct the full path
    const fullPath = join(process.cwd(), filePath);

    // Read the file
    const sourceCode = await readFile(fullPath, 'utf-8');

    return new NextResponse(sourceCode, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Error reading component source:', error);
    return NextResponse.json(
      { error: 'Failed to read component source' },
      { status: 500 }
    );
  }
}
