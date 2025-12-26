import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';

// Function to clear mood cache
const clearMoodCache = () => {
  global.moodCacheInvalidatedAt = Date.now();
  console.log('[UserMood API] Cache invalidation timestamp set:', global.moodCacheInvalidatedAt);
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereClause: any = {
      userId: session.user.id
    };

    if (status !== 'all') {
      whereClause.status = status;
    }

    const userMoods = await prisma.userMood.findMany({
      where: whereClause,
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });

    const total = await prisma.userMood.count({
      where: whereClause
    });

    return NextResponse.json({
      moods: userMoods,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + userMoods.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching user moods:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      usageContext,
      plutchikMappings = {},
      arousalLevel = 5,
      valence = 5,
      dominance = 5,
      intensity = 5,
      status = 'private', // Default to private if not specified
      demographics = {},
      notifyOnReview = false
    } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Mood name is required' }, { status: 400 });
    }

    const moodName = name.trim();

    // Check if mood already exists for this user
    const existingMood = await prisma.userMood.findUnique({
      where: {
        userId_moodName: {
          userId: session.user.id,
          moodName: moodName
        }
      }
    });

    if (existingMood) {
      return NextResponse.json({ error: 'Mood already exists' }, { status: 409 });
    }

    // Check if global mood with same name exists
    const globalMood = await prisma.mood.findUnique({
      where: { name: moodName }
    });

    if (globalMood) {
      return NextResponse.json({ 
        error: 'A global mood with this name already exists' 
      }, { status: 409 });
    }

    // Create comprehensive description
    let fullDescription = description || '';
    if (usageContext && usageContext.trim()) {
      fullDescription += fullDescription ? `\n\nUsage: ${usageContext}` : usageContext;
    }
    
    // Create the user mood with specified status
    const userMood = await prisma.userMood.create({
      data: {
        userId: session.user.id,
        moodName: moodName,
        description: fullDescription || null,
        status: status, // Use provided status (incomplete, private, pending_approval)
        questionnaireComplete: Object.keys(plutchikMappings).length > 0
      }
    });

    // Create mood properties if any ratings were provided
    if (Object.keys(plutchikMappings).length > 0) {
      await prisma.moodProps.create({
        data: {
          userMoodId: userMood.id,
          joyRating: plutchikMappings.joy || null,
          trustRating: plutchikMappings.trust || null,
          fearRating: plutchikMappings.fear || null,
          surpriseRating: plutchikMappings.surprise || null,
          sadnessRating: plutchikMappings.sadness || null,
          anticipationRating: plutchikMappings.anticipation || null,
          angerRating: plutchikMappings.anger || null,
          disgustRating: plutchikMappings.disgust || null,
          // Use provided values or schema defaults
          arousalLevel: arousalLevel,
          valence: valence,
          dominance: dominance,
          intensity: intensity
        }
      });
    }

    // Create appropriate response message based on status
    let message = 'Custom mood created successfully';
    if (status === 'incomplete') {
      message = 'Mood saved as incomplete (grey pill) - you can add more details later';
    } else if (status === 'private') {
      message = 'Mood saved as private complete definition (red pill)';
    } else if (status === 'pending_approval') {
      message = 'Mood submitted for community evaluation (yellow pill)';
    }

    return NextResponse.json({
      message: message,
      userMood: userMood,
      moodName: userMood.moodName,
      status: userMood.status,
      requiresDefinition: status === 'incomplete' // Only incomplete moods need further definition
    });
  } catch (error) {
    console.error('Error creating user mood:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 