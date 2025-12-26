import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

interface UsageTrackingData {
  moodId: number;
  usageContext?: string;
  sessionId?: string;
  entryId?: number;
}

interface UsageAnalyticsQuery {
  period?: 'day' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
  limit?: number;
  groupBy?: 'mood' | 'category' | 'date';
}

// POST - Track mood usage
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { moodId, usageContext, sessionId, entryId } = body as UsageTrackingData;

    if (!moodId) {
      return NextResponse.json({ error: 'moodId is required' }, { status: 400 });
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
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

    // Track usage in analytics table
    const usageRecord = await prisma.moodUsageAnalytics.create({
      data: {
        userId: user.id,
        moodId: moodId,
        usageContext: usageContext || 'unknown',
        sessionId: sessionId,
        entryId: entryId,
        usageDate: new Date()
      }
    });

    // Update or create user mood preferences with usage count
    const now = new Date();
    const preference = await prisma.userMoodPreferences.upsert({
      where: {
        userId_moodId: {
          userId: user.id,
          moodId: moodId
        }
      },
      update: {
        usageCount: {
          increment: 1
        },
        lastUsedAt: now,
        updatedAt: now
      },
      create: {
        userId: user.id,
        moodId: moodId,
        isPinned: false,
        isHidden: false,
        pinOrder: null,
        usageCount: 1,
        firstUsedAt: now,
        lastUsedAt: now
      },
      include: {
        mood: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      usageRecord,
      preference,
      message: 'Mood usage tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking mood usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get usage analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') as 'day' | 'week' | 'month' | 'year' || 'month';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const groupBy = searchParams.get('groupBy') as 'mood' | 'category' | 'date' || 'mood';

    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate date range
    const endDateTime = endDate ? new Date(endDate) : new Date();
    let startDateTime: Date;
    
    if (startDate) {
      startDateTime = new Date(startDate);
    } else {
      startDateTime = new Date(endDateTime);
      switch (period) {
        case 'day':
          startDateTime.setDate(startDateTime.getDate() - 1);
          break;
        case 'week':
          startDateTime.setDate(startDateTime.getDate() - 7);
          break;
        case 'month':
          startDateTime.setMonth(startDateTime.getMonth() - 1);
          break;
        case 'year':
          startDateTime.setFullYear(startDateTime.getFullYear() - 1);
          break;
      }
    }

    // Build base query
    const whereClause = {
      userId: user.id,
      usageDate: {
        gte: startDateTime,
        lte: endDateTime
      }
    };

    // Get usage analytics based on groupBy
    let analytics;
    
    if (groupBy === 'mood') {
      analytics = await prisma.moodUsageAnalytics.groupBy({
        by: ['moodId'],
        where: whereClause,
        _count: true,
        orderBy: {
          _count: {
            moodId: 'desc'
          }
        },
        take: limit
      });

      // Enrich with mood details
      const moodIds = analytics.map(a => a.moodId);
      const moods = await prisma.mood.findMany({
        where: {
          id: { in: moodIds }
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

      analytics = analytics.map(a => {
        const mood = moods.find(m => m.id === a.moodId);
        return {
          moodId: a.moodId,
          moodName: mood?.name || 'Unknown',
          usageCount: a._count,
          mood: mood
        };
      });
    } else if (groupBy === 'category') {
      // Get usage by category
      const rawUsage = await prisma.moodUsageAnalytics.findMany({
        where: whereClause,
        include: {
          mood: {
            include: {
              moodCategories: {
                include: {
                  category: true
                }
              }
            }
          }
        }
      });

      // Group by category
      const categoryUsage = new Map();
      rawUsage.forEach(usage => {
        usage.mood.moodCategories.forEach(mc => {
          const categoryId = mc.category.id;
          const existing = categoryUsage.get(categoryId) || {
            categoryId,
            categoryName: mc.category.name,
            categorySlug: mc.category.slug,
            categoryColor: mc.category.colorHex,
            usageCount: 0
          };
          existing.usageCount += 1;
          categoryUsage.set(categoryId, existing);
        });
      });

      analytics = Array.from(categoryUsage.values())
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, limit);
    } else if (groupBy === 'date') {
      // Get usage by date
      const rawUsage = await prisma.moodUsageAnalytics.findMany({
        where: whereClause,
        orderBy: {
          usageDate: 'desc'
        },
        take: limit
      });

      // Group by date
      const dateUsage = new Map();
      rawUsage.forEach(usage => {
        const dateKey = usage.usageDate.toISOString().split('T')[0];
        const existing = dateUsage.get(dateKey) || {
          date: dateKey,
          usageCount: 0
        };
        existing.usageCount += 1;
        dateUsage.set(dateKey, existing);
      });

      analytics = Array.from(dateUsage.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    // Get summary statistics
    const totalUsage = await prisma.moodUsageAnalytics.count({
      where: whereClause
    });

    const uniqueMoods = await prisma.moodUsageAnalytics.groupBy({
      by: ['moodId'],
      where: whereClause,
      _count: true
    });

    const mostUsedMood = await prisma.moodUsageAnalytics.groupBy({
      by: ['moodId'],
      where: whereClause,
      _count: true,
      orderBy: {
        _count: {
          moodId: 'desc'
        }
      },
      take: 1
    });

    let mostUsedMoodDetails = null;
    if (mostUsedMood.length > 0) {
      mostUsedMoodDetails = await prisma.mood.findUnique({
        where: { id: mostUsedMood[0].moodId },
        select: {
          id: true,
          name: true
        }
      });
    }

    return NextResponse.json({
      analytics,
      summary: {
        totalUsage,
        uniqueMoods: uniqueMoods.length,
        mostUsedMood: mostUsedMoodDetails ? {
          ...mostUsedMoodDetails,
          usageCount: mostUsedMood[0]._count
        } : null,
        period,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        groupBy
      }
    });
  } catch (error) {
    console.error('Error fetching usage analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 