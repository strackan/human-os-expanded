import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userMoodId = parseInt(params.id);
    if (isNaN(userMoodId)) {
      return NextResponse.json({ error: 'Invalid mood ID' }, { status: 400 });
    }

    // Verify the user mood exists and belongs to the user
    const userMood = await prisma.userMood.findFirst({
      where: {
        id: userMoodId,
        userId: session.user.id,
        status: 'private' // Can only promote private moods
      }
    });

    if (!userMood) {
      return NextResponse.json({ 
        error: 'Private mood not found or cannot be promoted' 
      }, { status: 404 });
    }

    // Check if already promoted
    const existingPromotion = await prisma.moodPromotion.findFirst({
      where: {
        userMoodId: userMoodId,
        status: { in: ['pending', 'approved'] }
      }
    });

    if (existingPromotion) {
      return NextResponse.json({ 
        error: 'Mood is already promoted or pending approval' 
      }, { status: 409 });
    }

    // Update UserMood to pending_approval and create MoodPromotion record
    const result = await prisma.$transaction(async (tx) => {
      // Update UserMood status
      const updatedUserMood = await tx.userMood.update({
        where: { id: userMoodId },
        data: {
          status: 'pending_approval',
          promotedAt: new Date()
        }
      });

      // Create MoodPromotion record
      const promotion = await tx.moodPromotion.create({
        data: {
          userMoodId: userMoodId,
          promotedByUserId: session.user.id,
          status: 'pending'
        }
      });

      return { updatedUserMood, promotion };
    });

    return NextResponse.json({ 
      message: 'Your mood has been submitted for community evaluation!',
      userMood: result.updatedUserMood,
      promotion: result.promotion
    });

  } catch (error) {
    console.error('Error promoting mood:', error);
    return NextResponse.json({ error: 'Failed to promote mood' }, { status: 500 });
  }
} 