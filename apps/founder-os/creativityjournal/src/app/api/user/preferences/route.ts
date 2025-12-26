import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user preferences from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        userToken: true, // We can use this field to store JSON preferences
        wordTarget: true, // Include wordTarget
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse preferences from userToken field (temporary solution)
    let preferences = {};
    if (user.userToken) {
      try {
        preferences = JSON.parse(user.userToken);
      } catch (error) {
        console.error('Error parsing user preferences:', error);
        preferences = {};
      }
    }

    return NextResponse.json({ 
      preferences,
      wordTarget: user.wordTarget || 500 
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { preferences, wordTarget } = await request.json();

    // Handle wordTarget separately if provided
    if (wordTarget !== undefined) {
      const targetValue = parseInt(wordTarget);
      if (isNaN(targetValue) || targetValue < 1 || targetValue > 10000) {
        return NextResponse.json({ error: 'Word target must be between 1 and 10000' }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          wordTarget: targetValue,
        },
      });

      return NextResponse.json({ 
        message: 'Word target updated successfully',
        wordTarget: targetValue 
      });
    }

    // Handle other preferences
    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json({ error: 'Invalid preferences data' }, { status: 400 });
    }

    // Get current user preferences
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        userToken: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Merge with existing preferences
    let existingPreferences = {};
    if (user.userToken) {
      try {
        existingPreferences = JSON.parse(user.userToken);
      } catch (error) {
        console.error('Error parsing existing preferences:', error);
        existingPreferences = {};
      }
    }

    const updatedPreferences = {
      ...existingPreferences,
      ...preferences,
    };

    // Update user preferences in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        userToken: JSON.stringify(updatedPreferences),
      },
    });

    return NextResponse.json({ 
      message: 'Preferences updated successfully',
      preferences: updatedPreferences 
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 