import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get the session token from cookies
    const sessionToken = request.cookies.get('next-auth.session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Find the session and user
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true }
    });

    if (!session || !session.user || session.expires < new Date()) {
      // Clean up expired or invalid session
      if (session) {
        await prisma.session.delete({
          where: { sessionToken }
        });
      }
      
      // Clear the corrupted cookie
      const response = NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      response.cookies.set('next-auth.session-token', '', {
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      return response;
    }

    // Get the "Draft" status ID
    const draftStatus = await prisma.entryStatus.findFirst({
      where: { status: 'Draft' }
    });

    // If no draft status exists, return empty drafts array instead of error
    if (!draftStatus) {
      console.log('Draft status not found in database, returning empty drafts array');
      return NextResponse.json({
        success: true,
        count: 0,
        drafts: []
      });
    }

    // Get all draft entries for the user
    const draftEntries = await prisma.entry.findMany({
      where: {
        ownerId: session.user.id,
        statusId: draftStatus.id
      },
      include: {
        entryProps: true
      },
      orderBy: {
        updatedDate: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      count: draftEntries.length,
      drafts: draftEntries.map(entry => ({
        id: entry.id,
        title: entry.entryProps?.title || '',
        content: entry.entryProps?.content || '',
        sat: entry.entryProps?.sat || 5,
        wordcount: entry.entryProps?.wordcount || 0,
        charcount: entry.entryProps?.charcount || 0,
        createdDate: entry.createdDate.toISOString(),
        updatedDate: entry.updatedDate.toISOString()
      }))
    });

  } catch (error) {
    console.error('Get drafts error:', error);
    
    // If it's a JWT/session error, clear the corrupted cookie
    if (error.message?.includes('JWE') || error.message?.includes('JWT')) {
      const response = NextResponse.json({ 
        error: 'Session corrupted, please log in again',
        needsReauth: true
      }, { status: 401 });
      
      response.cookies.set('next-auth.session-token', '', {
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      
      return response;
    }
    
    // Return empty drafts array instead of 500 error for graceful degradation
    return NextResponse.json({ 
      success: true, 
      count: 0, 
      drafts: [],
      warning: 'Failed to fetch drafts, returning empty array'
    }, { status: 200 });
  }
} 