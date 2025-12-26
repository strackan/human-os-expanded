import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
}

export async function getCustomSession(request: NextRequest): Promise<AuthSession | null> {
  try {
    // Get the session token from cookies
    const sessionToken = request.cookies.get('next-auth.session-token')?.value;
    
    if (!sessionToken) {
      return null;
    }

    // Find the session and user
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
      return null;
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      }
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
} 