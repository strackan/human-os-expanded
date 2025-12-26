import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Get the session token from cookies
    const sessionToken = request.cookies.get('next-auth.session-token')?.value;
    
    if (sessionToken) {
      // Delete the session from the database
      await prisma.session.deleteMany({
        where: { sessionToken }
      });
    }

    // Create response and clear the session cookie
    const response = NextResponse.json({ success: true });
    
    response.cookies.set('next-auth.session-token', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Signout error:', error);
    return NextResponse.json({ error: 'Signout failed' }, { status: 500 });
  }
} 