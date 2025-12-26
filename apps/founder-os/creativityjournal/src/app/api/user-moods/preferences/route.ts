import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

interface UserMoodPreference {
  userMoodId: number;
  isPinned?: boolean;
  isHidden?: boolean;
  pinOrder?: number | null;
}

interface BulkUserMoodPreferencesUpdate {
  pin?: number[];
  unpin?: number[];
  hide?: number[];
  unhide?: number[];
  reorder?: { userMoodId: number; pinOrder: number }[];
}

// GET - Fetch user's user mood preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeUsageStats = searchParams.get('includeUsageStats') === 'true';

    // Get the user's user moods with preferences
    const userMoods = await prisma.userMood.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { isPinned: 'desc' },
        { pinOrder: 'asc' },
        { usageCount: 'desc' },
        { moodName: 'asc' }
      ]
    });

    // Get usage statistics if requested
    let usageStats = null;
    if (includeUsageStats) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Count usage in the last 30 days by checking entry_user_moods
      usageStats = await prisma.entryUserMoods.groupBy({
        by: ['userMoodId'],
        where: {
          userMood: {
            userId: session.user.id
          },
          entry: {
            createdDate: {
              gte: thirtyDaysAgo
            }
          }
        },
        _count: {
          userMoodId: true
        }
      });
    }

    return NextResponse.json({
      userMoods,
      usageStats,
      summary: {
        totalUserMoods: userMoods.length,
        pinnedUserMoods: userMoods.filter(um => um.isPinned).length,
        hiddenUserMoods: userMoods.filter(um => um.isHidden).length,
        mostUsedUserMoods: userMoods
          .filter(um => um.usageCount > 0)
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, 10)
          .map(um => ({
            userMoodId: um.id,
            moodName: um.moodName,
            usageCount: um.usageCount,
            lastUsedAt: um.lastUsedAt
          }))
      }
    });
  } catch (error) {
    console.error('Error fetching user mood preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create or update individual user mood preference
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userMoodId, isPinned, isHidden, pinOrder } = body as UserMoodPreference;

    if (!userMoodId) {
      return NextResponse.json({ error: 'userMoodId is required' }, { status: 400 });
    }

    // Verify user mood exists and belongs to the user
    const userMood = await prisma.userMood.findFirst({
      where: { 
        id: userMoodId,
        userId: session.user.id
      }
    });

    if (!userMood) {
      return NextResponse.json({ error: 'User mood not found' }, { status: 404 });
    }

    // Handle pin order logic
    let finalPinOrder = pinOrder;
    if (isPinned && pinOrder === undefined) {
      // Auto-assign pin order if not specified
      const maxPinOrder = await prisma.userMood.findFirst({
        where: { 
          userId: session.user.id,
          isPinned: true
        },
        orderBy: { pinOrder: 'desc' }
      });
      finalPinOrder = (maxPinOrder?.pinOrder || 0) + 1;
    } else if (!isPinned) {
      finalPinOrder = null;
    }

    // Update the user mood
    const updatedUserMood = await prisma.userMood.update({
      where: { id: userMoodId },
      data: {
        isPinned: isPinned ?? undefined,
        isHidden: isHidden ?? undefined,
        pinOrder: finalPinOrder
      }
    });

    return NextResponse.json({
      userMood: updatedUserMood,
      message: 'User mood preference updated successfully'
    });
  } catch (error) {
    console.error('Error updating user mood preference:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Bulk update user mood preferences
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pin, unpin, hide, unhide, reorder } = body as BulkUserMoodPreferencesUpdate;

    const results = [];

    // Process bulk operations in a transaction
    await prisma.$transaction(async (tx) => {
      // Pin user moods
      if (pin && pin.length > 0) {
        const maxPinOrder = await tx.userMood.findFirst({
          where: { 
            userId: session.user.id,
            isPinned: true
          },
          orderBy: { pinOrder: 'desc' }
        });
        
        const startPinOrder = (maxPinOrder?.pinOrder || 0) + 1;
        
        for (let i = 0; i < pin.length; i++) {
          // Verify user mood belongs to the user
          const userMood = await tx.userMood.findFirst({
            where: { 
              id: pin[i],
              userId: session.user.id
            }
          });
          
          if (userMood) {
            const result = await tx.userMood.update({
              where: { id: pin[i] },
              data: {
                isPinned: true,
                pinOrder: startPinOrder + i
              }
            });
            results.push({ action: 'pin', userMoodId: pin[i], result });
          }
        }
      }

      // Unpin user moods
      if (unpin && unpin.length > 0) {
        await tx.userMood.updateMany({
          where: {
            userId: session.user.id,
            id: { in: unpin }
          },
          data: {
            isPinned: false,
            pinOrder: null
          }
        });
        results.push({ action: 'unpin', userMoodIds: unpin });
      }

      // Hide user moods
      if (hide && hide.length > 0) {
        for (const userMoodId of hide) {
          // Verify user mood belongs to the user
          const userMood = await tx.userMood.findFirst({
            where: { 
              id: userMoodId,
              userId: session.user.id
            }
          });
          
          if (userMood) {
            const result = await tx.userMood.update({
              where: { id: userMoodId },
              data: {
                isHidden: true,
                isPinned: false, // Can't be pinned and hidden
                pinOrder: null
              }
            });
            results.push({ action: 'hide', userMoodId, result });
          }
        }
      }

      // Unhide user moods
      if (unhide && unhide.length > 0) {
        await tx.userMood.updateMany({
          where: {
            userId: session.user.id,
            id: { in: unhide }
          },
          data: {
            isHidden: false
          }
        });
        results.push({ action: 'unhide', userMoodIds: unhide });
      }

      // Reorder pinned user moods
      if (reorder && reorder.length > 0) {
        for (const { userMoodId, pinOrder } of reorder) {
          // Verify user mood belongs to the user
          const userMood = await tx.userMood.findFirst({
            where: { 
              id: userMoodId,
              userId: session.user.id
            }
          });
          
          if (userMood) {
            await tx.userMood.update({
              where: { id: userMoodId },
              data: {
                pinOrder: pinOrder
              }
            });
          }
        }
        results.push({ action: 'reorder', updates: reorder });
      }
    });

    return NextResponse.json({
      results,
      message: 'Bulk user mood preferences updated successfully'
    });
  } catch (error) {
    console.error('Error bulk updating user mood preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}