import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';

// Import cache clearing function (we'll need to add this)
const clearMoodCache = () => {
  // This will clear the server-side cache in the /api/moods route
  // We'll use a simple approach - just set a timestamp that the cache can check
  global.moodCacheInvalidatedAt = Date.now();
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { emotionName, valence, similarWord, plutchikEmotions, plutchikOther } = data;

    // Validate input
    if (!emotionName || !valence || !similarWord || !plutchikEmotions) {
      return NextResponse.json({ 
        error: 'Missing required fields: emotionName, valence, similarWord, plutchikEmotions' 
      }, { status: 400 });
    }

    // Check if user already has this mood
    const existingMood = await prisma.userMood.findFirst({
      where: {
        userId: session.user.id,
        moodName: emotionName.toLowerCase().trim()
      }
    });

    if (existingMood) {
      return NextResponse.json({ 
        error: 'You already have a mood with this name' 
      }, { status: 409 });
    }

    // Create the UserMood
    const userMood = await prisma.userMood.create({
      data: {
        userId: session.user.id,
        moodName: emotionName.toLowerCase().trim(),
        status: 'private', // Start as private
        description: `Similar to: ${similarWord}. Emotions: ${plutchikEmotions.join(', ')}${plutchikOther ? `, ${plutchikOther}` : ''}`,
        // You can expand this with more detailed properties later
      }
    });

    // Clear the mood cache so the new mood appears immediately
    clearMoodCache();
    console.log('[UserMood Create] Cache invalidated after creating mood:', userMood.moodName);

    return NextResponse.json({
      message: 'Custom mood created successfully!',
      mood: userMood
    });

  } catch (error) {
    console.error('Error creating custom mood:', error);
    return NextResponse.json({ 
      error: 'Failed to create custom mood' 
    }, { status: 500 });
  }
} 