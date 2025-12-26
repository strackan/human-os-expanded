import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Set entry privacy protection
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = request.cookies.get('next-auth.session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true }
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const entryId = parseInt(id);

    if (isNaN(entryId)) {
      return NextResponse.json({ error: 'Invalid entry ID' }, { status: 400 });
    }

    const { password, action } = await request.json();

    if (action === 'set-privacy') {
      if (!password || password.length < 6) {
        return NextResponse.json({ 
          error: 'Password must be at least 6 characters long' 
        }, { status: 400 });
      }

      // Check if entry exists and belongs to user
      const entry = await prisma.entry.findFirst({
        where: {
          id: entryId,
          ownerId: session.user.id
        }
      });

      if (!entry) {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
      }

      // Hash the password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create or update entry security record
      await prisma.entrySecurity.upsert({
        where: { entryId },
        create: {
          entryId,
          isPrivate: true,
          passwordHash,
        },
        update: {
          isPrivate: true,
          passwordHash,
          updatedDate: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Entry privacy protection enabled'
      });
    }

    if (action === 'remove-privacy') {
      if (!password) {
        return NextResponse.json({ 
          error: 'Password required to remove privacy protection' 
        }, { status: 400 });
      }

      // Check if entry exists and belongs to user
      const entry = await prisma.entry.findFirst({
        where: {
          id: entryId,
          ownerId: session.user.id
        },
        include: {
          entrySecurity: true
        }
      });

      if (!entry) {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
      }

      if (!entry.entrySecurity?.isPrivate) {
        return NextResponse.json({ 
          error: 'Entry is not privacy protected' 
        }, { status: 400 });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, entry.entrySecurity.passwordHash || '');
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }

      // Remove privacy protection
      await prisma.entrySecurity.update({
        where: { entryId },
        data: {
          isPrivate: false,
          passwordHash: null,
          breakGlassCode: null,
          breakGlassExpires: null,
          updatedDate: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Entry privacy protection removed'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Privacy protection error:', error);
    return NextResponse.json({ error: 'Failed to update privacy protection' }, { status: 500 });
  }
}

// Unlock private entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = request.cookies.get('next-auth.session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true }
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const entryId = parseInt(id);

    if (isNaN(entryId)) {
      return NextResponse.json({ error: 'Invalid entry ID' }, { status: 400 });
    }

    const { password, action } = await request.json();

    if (action === 'unlock') {
      if (!password) {
        return NextResponse.json({ error: 'Password required' }, { status: 400 });
      }

      // Check if entry exists and belongs to user
      const entry = await prisma.entry.findFirst({
        where: {
          id: entryId,
          ownerId: session.user.id
        },
        include: {
          entrySecurity: true
        }
      });

      if (!entry) {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
      }

      if (!entry.entrySecurity?.isPrivate) {
        return NextResponse.json({ 
          error: 'Entry is not privacy protected' 
        }, { status: 400 });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, entry.entrySecurity.passwordHash || '');
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        message: 'Entry unlocked successfully'
      });
    }

    if (action === 'break-glass') {
      // Check if entry exists and belongs to user
      const entry = await prisma.entry.findFirst({
        where: {
          id: entryId,
          ownerId: session.user.id
        },
        include: {
          entrySecurity: true
        }
      });

      if (!entry) {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
      }

      if (!entry.entrySecurity?.isPrivate) {
        return NextResponse.json({ 
          error: 'Entry is not privacy protected' 
        }, { status: 400 });
      }

      // Generate break glass code
      const breakGlassCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      const breakGlassExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Update entry security with break glass code
      await prisma.entrySecurity.update({
        where: { entryId },
        data: {
          breakGlassCode,
          breakGlassExpires,
          updatedDate: new Date()
        }
      });

      // TODO: Send email with break glass code
      // For now, return the code in the response (for development)
      return NextResponse.json({
        success: true,
        message: 'Break glass code generated. Check your email.',
        breakGlassCode // Remove this in production
      });
    }

    if (action === 'break-glass-verify') {
      const { breakGlassCode } = await request.json();

      if (!breakGlassCode) {
        return NextResponse.json({ error: 'Break glass code required' }, { status: 400 });
      }

      // Check if entry exists and belongs to user
      const entry = await prisma.entry.findFirst({
        where: {
          id: entryId,
          ownerId: session.user.id
        },
        include: {
          entrySecurity: true
        }
      });

      if (!entry) {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
      }

      if (!entry.entrySecurity?.isPrivate) {
        return NextResponse.json({ 
          error: 'Entry is not privacy protected' 
        }, { status: 400 });
      }

      // Verify break glass code
      if (entry.entrySecurity.breakGlassCode !== breakGlassCode.toUpperCase()) {
        return NextResponse.json({ error: 'Invalid break glass code' }, { status: 401 });
      }

      // Check if code is expired
      if (!entry.entrySecurity.breakGlassExpires || entry.entrySecurity.breakGlassExpires < new Date()) {
        return NextResponse.json({ error: 'Break glass code expired' }, { status: 401 });
      }

      // Clear break glass code after successful verification
      await prisma.entrySecurity.update({
        where: { entryId },
        data: {
          breakGlassCode: null,
          breakGlassExpires: null,
          updatedDate: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Break glass verification successful',
        passwordHash: entry.entrySecurity.passwordHash // Return password hash for display
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Privacy unlock error:', error);
    return NextResponse.json({ error: 'Failed to unlock entry' }, { status: 500 });
  }
} 