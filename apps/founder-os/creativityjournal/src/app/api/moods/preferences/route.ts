import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

interface MoodPreference {
  moodId: number;
  isPinned?: boolean;
  isHidden?: boolean;
  pinOrder?: number | null;
}

interface BulkPreferencesUpdate {
  pin?: number[];
  unpin?: number[];
  hide?: number[];
  unhide?: number[];
  reorder?: { moodId: number; pinOrder: number }[];
}

// GET - Fetch user's mood preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeUsageStats = searchParams.get('includeUsageStats') === 'true';
    const includeUnsetPreferences = searchParams.get('includeUnsetPreferences') === 'true';

    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's mood preferences
    const preferences = await prisma.userMoodPreferences.findMany({
      where: { userId: user.id },
      include: {
        mood: {
          include: {
            moodProps: true,
            moodCategories: {
              include: {
                category: true
              }
            }
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { pinOrder: 'asc' },
        { usageCount: 'desc' },
        { mood: { name: 'asc' } }
      ]
    });

    // If requested, include moods that don't have preferences set
    let allMoods = [];
    if (includeUnsetPreferences) {
      const moodIds = preferences.map(p => p.moodId);
      const unsetMoods = await prisma.mood.findMany({
        where: {
          id: {
            notIn: moodIds
          }
        },
        include: {
          moodProps: true,
          moodCategories: {
            include: {
              category: true
            }
          }
        }
      });

      // Create default preferences for unset moods
      const defaultPreferences = unsetMoods.map(mood => ({
        id: 0, // Temporary ID for unset preferences
        userId: user.id,
        moodId: mood.id,
        isPinned: false,
        isHidden: false,
        pinOrder: null,
        usageCount: 0,
        lastUsedAt: null,
        firstUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        mood
      }));

      allMoods = [...preferences, ...defaultPreferences];
    } else {
      allMoods = preferences;
    }

    // Get usage statistics if requested
    let usageStats = null;
    if (includeUsageStats) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      usageStats = await prisma.moodUsageAnalytics.aggregate({
        where: {
          userId: user.id,
          usageDate: {
            gte: thirtyDaysAgo
          }
        },
        _count: true,
        _sum: {
          moodId: true
        }
      });
    }

    return NextResponse.json({
      preferences: allMoods,
      usageStats,
      summary: {
        totalMoods: allMoods.length,
        pinnedMoods: allMoods.filter(p => p.isPinned).length,
        hiddenMoods: allMoods.filter(p => p.isHidden).length,
        mostUsedMoods: allMoods
          .filter(p => p.usageCount > 0)
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, 10)
          .map(p => ({
            moodId: p.moodId,
            moodName: p.mood.name,
            usageCount: p.usageCount,
            lastUsedAt: p.lastUsedAt
          }))
      }
    });
  } catch (error) {
    console.error('Error fetching mood preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create or update individual mood preference
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { moodId, isPinned, isHidden, pinOrder } = body as MoodPreference;

    if (!moodId) {
      return NextResponse.json({ error: 'moodId is required' }, { status: 400 });
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify mood exists
    const mood = await prisma.mood.findUnique({
      where: { id: moodId }
    });

    if (!mood) {
      return NextResponse.json({ error: 'Mood not found' }, { status: 404 });
    }

    // Handle pin order logic
    let finalPinOrder = pinOrder;
    if (isPinned && pinOrder === undefined) {
      // Auto-assign pin order if not specified
      const maxPinOrder = await prisma.userMoodPreferences.findFirst({
        where: { 
          userId: user.id,
          isPinned: true
        },
        orderBy: { pinOrder: 'desc' }
      });
      finalPinOrder = (maxPinOrder?.pinOrder || 0) + 1;
    } else if (!isPinned) {
      finalPinOrder = null;
    }

    // Upsert the preference
    const preference = await prisma.userMoodPreferences.upsert({
      where: {
        userId_moodId: {
          userId: user.id,
          moodId: moodId
        }
      },
      update: {
        isPinned: isPinned ?? undefined,
        isHidden: isHidden ?? undefined,
        pinOrder: finalPinOrder,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        moodId: moodId,
        isPinned: isPinned ?? false,
        isHidden: isHidden ?? false,
        pinOrder: finalPinOrder,
        usageCount: 0
      },
      include: {
        mood: {
          include: {
            moodProps: true,
            moodCategories: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      preference,
      message: 'Mood preference updated successfully'
    });
  } catch (error) {
    console.error('Error updating mood preference:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Bulk update mood preferences
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pin, unpin, hide, unhide, reorder } = body as BulkPreferencesUpdate;

    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const results = [];

    // Process bulk operations in a transaction
    await prisma.$transaction(async (tx) => {
      // Pin moods
      if (pin && pin.length > 0) {
        const maxPinOrder = await tx.userMoodPreferences.findFirst({
          where: { 
            userId: user.id,
            isPinned: true
          },
          orderBy: { pinOrder: 'desc' }
        });
        
        const startPinOrder = (maxPinOrder?.pinOrder || 0) + 1;
        
        for (let i = 0; i < pin.length; i++) {
          const result = await tx.userMoodPreferences.upsert({
            where: {
              userId_moodId: {
                userId: user.id,
                moodId: pin[i]
              }
            },
            update: {
              isPinned: true,
              pinOrder: startPinOrder + i,
              updatedAt: new Date()
            },
            create: {
              userId: user.id,
              moodId: pin[i],
              isPinned: true,
              isHidden: false,
              pinOrder: startPinOrder + i,
              usageCount: 0
            }
          });
          results.push({ action: 'pin', moodId: pin[i], result });
        }
      }

      // Unpin moods
      if (unpin && unpin.length > 0) {
        await tx.userMoodPreferences.updateMany({
          where: {
            userId: user.id,
            moodId: { in: unpin }
          },
          data: {
            isPinned: false,
            pinOrder: null,
            updatedAt: new Date()
          }
        });
        results.push({ action: 'unpin', moodIds: unpin });
      }

      // Hide moods
      if (hide && hide.length > 0) {
        for (const moodId of hide) {
          const result = await tx.userMoodPreferences.upsert({
            where: {
              userId_moodId: {
                userId: user.id,
                moodId: moodId
              }
            },
            update: {
              isHidden: true,
              isPinned: false, // Can't be pinned and hidden
              pinOrder: null,
              updatedAt: new Date()
            },
            create: {
              userId: user.id,
              moodId: moodId,
              isPinned: false,
              isHidden: true,
              pinOrder: null,
              usageCount: 0
            }
          });
          results.push({ action: 'hide', moodId, result });
        }
      }

      // Unhide moods
      if (unhide && unhide.length > 0) {
        await tx.userMoodPreferences.updateMany({
          where: {
            userId: user.id,
            moodId: { in: unhide }
          },
          data: {
            isHidden: false,
            updatedAt: new Date()
          }
        });
        results.push({ action: 'unhide', moodIds: unhide });
      }

      // Reorder pinned moods
      if (reorder && reorder.length > 0) {
        for (const { moodId, pinOrder } of reorder) {
          await tx.userMoodPreferences.update({
            where: {
              userId_moodId: {
                userId: user.id,
                moodId: moodId
              }
            },
            data: {
              pinOrder: pinOrder,
              updatedAt: new Date()
            }
          });
        }
        results.push({ action: 'reorder', updates: reorder });
      }
    });

    return NextResponse.json({
      results,
      message: 'Bulk mood preferences updated successfully'
    });
  } catch (error) {
    console.error('Error bulk updating mood preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 