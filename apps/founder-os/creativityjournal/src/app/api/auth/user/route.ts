import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('next-auth.session-token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ user: null });
    }

    // Find the session and include the user data
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true }
    });

    if (!session || !session.user || session.expires < new Date()) {
      // Clean up expired session
      if (session) {
        await prisma.session.delete({
          where: { sessionToken }
        });
      }
      return NextResponse.json({ user: null });
    }

    // Return user data
    return NextResponse.json({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        wordTarget: session.user.wordTarget || 500,
      }
    });

  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json({ user: null });
  }
}