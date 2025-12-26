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

    // Update the suggestion status
    const updatedSuggestion = await prisma.emotionSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: 'rejected',
        adminNotes,
        reviewedBy: session.user.id,
        reviewedAt: new Date()
      }
    });

    // Send email notification if requested
    if (suggestion.notifyOnReview && suggestion.user.email) {
      try {
        await sendRejectionEmail(suggestion.user.email, suggestion.emotionName, adminNotes);
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
        // Don't fail the API call if email fails
      }
    }

    return NextResponse.json({ 
      message: 'Suggestion rejected successfully'
    });

  } catch (error) {
    console.error('Error rejecting suggestion:', error);
    return NextResponse.json({ error: 'Failed to reject suggestion' }, { status: 500 });
  }
}

async function sendRejectionEmail(email: string, emotionName: string, adminNotes?: string) {
  // For now, we'll just log the email. In a real implementation, you'd use
  // a service like SendGrid, Resend, or similar
  console.log(`
📧 EMAIL NOTIFICATION (Rejection)
To: ${email}
Subject: Update on your emotion suggestion "${emotionName}"

Hi there!

Thank you for suggesting the emotion "${emotionName}" for our emotion library. After careful review, we've decided not to add this emotion at this time.

${adminNotes ? `Reason: ${adminNotes}` : ''}

We really appreciate your contribution to helping us expand our emotional vocabulary. Please feel free to suggest other emotions in the future!

Best regards,
The Creativity Journal Team
  `);

  // TODO: Implement actual email sending
  // Example with a hypothetical email service:
  /*
  await emailService.send({
    to: email,
    subject: `Update on your emotion suggestion "${emotionName}"`,
    html: `
      <h2>Thank you for your suggestion</h2>
      <p>Thank you for suggesting the emotion "<strong>${emotionName}</strong>" for our emotion library. After careful review, we've decided not to add this emotion at this time.</p>
      ${adminNotes ? `<p><strong>Reason:</strong> ${adminNotes}</p>` : ''}
      <p>We really appreciate your contribution to helping us expand our emotional vocabulary. Please feel free to suggest other emotions in the future!</p>
      <p>Best regards,<br>The Creativity Journal Team</p>
    `
  });
  */
} 