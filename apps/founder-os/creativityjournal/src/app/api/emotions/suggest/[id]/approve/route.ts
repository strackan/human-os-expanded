import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth';
import { prisma } from '@/lib/prisma';
import { ROLES } from '@/lib/roles';

export async function POST(request: Request, { params }: { params: { id: string } }) {
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

    const { adminNotes } = await request.json();
    const suggestionId = parseInt(params.id);

    // Get the suggestion
    const suggestion = await prisma.emotionSuggestion.findUnique({
      where: { id: suggestionId },
      include: { user: true }
    });

    if (!suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    // Start a transaction to create the mood and update the suggestion
    const result = await prisma.$transaction(async (tx) => {
      // Create the new mood
      const newMood = await tx.mood.create({
        data: {
          name: suggestion.emotionName,
          userId: suggestion.userId
        }
      });

      // Create mood properties
      await tx.moodProps.create({
        data: {
          moodId: newMood.id,
          joyRating: suggestion.joyRating,
          trustRating: suggestion.trustRating,
          fearRating: suggestion.fearRating,
          surpriseRating: suggestion.surpriseRating,
          sadnessRating: suggestion.sadnessRating,
          anticipationRating: suggestion.anticipationRating,
          angerRating: suggestion.angerRating,
          disgustRating: suggestion.disgustRating,
          arousalLevel: suggestion.arousalLevel,
          valence: suggestion.valence,
          dominance: suggestion.dominance,
          intensity: suggestion.intensity,
          core: false // User-suggested emotions are not core emotions
        }
      });

      // Update the suggestion status
      const updatedSuggestion = await tx.emotionSuggestion.update({
        where: { id: suggestionId },
        data: {
          status: 'approved',
          adminNotes,
          reviewedBy: session.user.id,
          reviewedAt: new Date()
        }
      });

      return { newMood, updatedSuggestion };
    });

    // Send email notification if requested
    if (suggestion.notifyOnReview && suggestion.user.email) {
      try {
        await sendApprovalEmail(suggestion.user.email, suggestion.emotionName, adminNotes);
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
        // Don't fail the API call if email fails
      }
    }

    return NextResponse.json({ 
      message: 'Suggestion approved and emotion created successfully',
      moodId: result.newMood.id 
    });

  } catch (error) {
    console.error('Error approving suggestion:', error);
    return NextResponse.json({ error: 'Failed to approve suggestion' }, { status: 500 });
  }
}

async function sendApprovalEmail(email: string, emotionName: string, adminNotes?: string) {
  // For now, we'll just log the email. In a real implementation, you'd use
  // a service like SendGrid, Resend, or similar
  console.log(`
📧 EMAIL NOTIFICATION (Approval)
To: ${email}
Subject: Your emotion suggestion "${emotionName}" has been approved!

Hi there!

Great news! Your emotion suggestion "${emotionName}" has been approved and added to our emotion library. 

${adminNotes ? `Admin notes: ${adminNotes}` : ''}

You can now find and use your emotion when creating journal entries. Thank you for helping us expand our emotional vocabulary!

Best regards,
The Creativity Journal Team
  `);

  // TODO: Implement actual email sending
  // Example with a hypothetical email service:
  /*
  await emailService.send({
    to: email,
    subject: `Your emotion suggestion "${emotionName}" has been approved!`,
    html: `
      <h2>Great news!</h2>
      <p>Your emotion suggestion "<strong>${emotionName}</strong>" has been approved and added to our emotion library.</p>
      ${adminNotes ? `<p><strong>Admin notes:</strong> ${adminNotes}</p>` : ''}
      <p>You can now find and use your emotion when creating journal entries. Thank you for helping us expand our emotional vocabulary!</p>
      <p>Best regards,<br>The Creativity Journal Team</p>
    `
  });
  */
} 