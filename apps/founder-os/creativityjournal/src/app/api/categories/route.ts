import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || '';
    const includeCount = searchParams.get('includeCount') === 'true';
    
    console.log('Categories API called with parameters:', { type, includeCount });
    
    // Build where clause for filtering
    const whereClause: any = {
      isActive: true
    };
    
    if (type && type !== 'all') {
      whereClause.categoryType = type;
    }
    
    // Fetch categories
    const categories = await prisma.category.findMany({
      where: whereClause,
      include: includeCount ? {
        moodCategories: {
          select: {
            id: true
          }
        }
      } : {},
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    console.log(`Found ${categories.length} categories`);
    
    // Process and enrich the results
    const enrichedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      color: category.colorHex,
      iconName: category.iconName,
      type: category.categoryType,
      parentId: category.parentCategoryId,
      displayOrder: category.displayOrder,
      isActive: category.isActive,
      emotionCount: includeCount ? category.moodCategories?.length || 0 : undefined,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }));
    
    // Group by type for easier consumption
    const groupedByType = enrichedCategories.reduce((acc, category) => {
      if (!acc[category.type]) {
        acc[category.type] = [];
      }
      acc[category.type].push(category);
      return acc;
    }, {} as Record<string, typeof enrichedCategories>);

    return NextResponse.json({
      categories: enrichedCategories,
      groupedByType,
      total: enrichedCategories.length,
      filters: {
        type: type || 'all',
        includeCount
      }
    });

  } catch (error) {
    console.error('Categories fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
} 