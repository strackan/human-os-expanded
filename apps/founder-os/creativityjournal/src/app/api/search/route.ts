import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Search in diary entries by subject and content
    const results = await prisma.diaryEntry.findMany({
      where: {
        OR: [
          {
            subject: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            entry: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        subject: true,
        entry: true,
        createdDate: true,
      },
      orderBy: {
        createdDate: 'desc',
      },
      take: 10,
    });

    // Format results for the frontend
    const formattedResults = results.map(entry => ({
      id: entry.id,
      subject: entry.subject,
      content: entry.entry,
      created_date: entry.createdDate,
    }));

    return NextResponse.json({ results: formattedResults });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}