import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get the session token from cookies
    const sessionToken = request.cookies.get('next-auth.session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ user: null });
    }

    // Find the session in the database
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { 
        user: {
          include: {
            entries: {
              where: {
                statusId: 1 // Active/draft status
              },
              include: {
                entryProps: true,
                entryMoods: {
                  include: {
                    mood: true
                  }
                }
              },
              orderBy: {
                updatedDate: 'desc'
              },
              take: 1 // Get the most recent active entry
            }
          }
        }
      }
    });

    if (!session || !session.user || session.expires < new Date()) {
      // Session is invalid or expired, clean it up
      if (session) {
        await prisma.session.delete({
          where: { sessionToken }
        });
      }
      return NextResponse.json({ user: null });
    }

    // Get active entry if it exists
    const activeEntry = session.user.entries[0] || null;

    // Return user information with active entry
    return NextResponse.json({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image
      },
      activeEntry: activeEntry ? {
        id: activeEntry.id,
        title: activeEntry.entryProps?.title || '',
        content: activeEntry.entryProps?.content || '',
        sat: activeEntry.entryProps?.sat || 5,
        wordcount: activeEntry.entryProps?.wordcount || 0,
        charcount: activeEntry.entryProps?.charcount || 0,
        mood: activeEntry.entryMoods[0]?.mood?.name || '',
        moodId: activeEntry.entryMoods[0]?.moodId || null,
        createdDate: activeEntry.createdDate,
        updatedDate: activeEntry.updatedDate
      } : null
    });

  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json({ user: null });
  }
} 