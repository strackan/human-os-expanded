import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate required fields
    const { emotionName, userDescription, plutchikRatings, granularityRatings, usageContext, demographics, notifyOnReview } = data;
    
    if (!emotionName || !userDescription) {
      return NextResponse.json({ error: 'Emotion name and description are required' }, { status: 400 });
    }

    // Check if this exact emotion already exists
    const existingMood = await prisma.mood.findFirst({
      where: { name: emotionName.toLowerCase().trim() }
    });
    
    const existingUserMood = await prisma.userMood.findFirst({
      where: { 
        userId: session.user.id,
        moodName: emotionName.toLowerCase().trim() 
      }
    });

    if (existingMood) {
      return NextResponse.json({ error: 'This emotion already exists in our database' }, { status: 409 });
    }

    if (existingUserMood) {
      return NextResponse.json({ error: 'You have already suggested this emotion' }, { status: 409 });
    }

    // Create new UserMood and global Mood in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the global mood first
      const globalMood = await tx.mood.create({
        data: {
          name: emotionName.toLowerCase().trim()
        }
      });

      // Create mood properties
      await tx.moodProps.create({
        data: {
          moodId: globalMood.id,
          joyRating: plutchikRatings?.joy || 0,
          trustRating: plutchikRatings?.trust || 0,
          fearRating: plutchikRatings?.fear || 0,
          surpriseRating: plutchikRatings?.surprise || 0,
          sadnessRating: plutchikRatings?.sadness || 0,
          anticipationRating: plutchikRatings?.anticipation || 0,
          angerRating: plutchikRatings?.anger || 0,
          disgustRating: plutchikRatings?.disgust || 0,
          arousalLevel: granularityRatings?.arousal || 5,
          valence: granularityRatings?.valence || 5,
          dominance: granularityRatings?.dominance || 5,
          intensity: granularityRatings?.intensity || 5,
          core: false // User-suggested emotions are not core by default
        }
      });

      // Create the user mood in pending_approval status (yellow state)
      const userMood = await tx.userMood.create({
        data: {
          userId: session.user.id,
          moodName: emotionName.toLowerCase().trim(),
          status: 'pending_approval', // Yellow state
          description: userDescription,
          promotedAt: new Date(),
          joyRating: plutchikRatings?.joy || 0,
          trustRating: plutchikRatings?.trust || 0,
          fearRating: plutchikRatings?.fear || 0,
          surpriseRating: plutchikRatings?.surprise || 0,
          sadnessRating: plutchikRatings?.sadness || 0,
          anticipationRating: plutchikRatings?.anticipation || 0,
          angerRating: plutchikRatings?.anger || 0,
          disgustRating: plutchikRatings?.disgust || 0,
          arousalLevel: granularityRatings?.arousal || 5,
          valence: granularityRatings?.valence || 5,
          dominance: granularityRatings?.dominance || 5,
          intensity: granularityRatings?.intensity || 5
        }
      });

      // Create MoodPromotion record for tracking
      const promotion = await tx.moodPromotion.create({
        data: {
          userMoodId: userMood.id,
          promotedByUserId: session.user.id,
          globalMoodId: globalMood.id,
          status: 'pending'
        }
      });

      return { globalMood, userMood, promotion };
    });

    return NextResponse.json({ 
      message: 'Thank you for suggesting a new emotion! It\'s now available for you to use and will be reviewed by the community.',
      globalMoodId: result.globalMood.id,
      moodName: result.userMood.moodName,
      userMood: result.userMood
    });

  } catch (error) {
    console.error('Error creating emotion suggestion:', error);
    return NextResponse.json({ error: 'Failed to submit suggestion' }, { status: 500 });
  }
}

// GET /api/emotions/suggest - For admin to review suggestions
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has admin role
    const userRole = session.user.role || 'author';
    if (userRole !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    
    const suggestions = await prisma.emotionSuggestion.findMany({
      where: { status },
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: [
        { submissionCount: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error fetching emotion suggestions:', error);
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
} 