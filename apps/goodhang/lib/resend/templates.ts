// Simple HTML email templates for Resend
// Using plain HTML strings to avoid React/TypeScript issues

interface RSVPConfirmationProps {
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  guestName: string;
  plusOnes: number;
  eventUrl: string;
}

interface MembershipApprovedProps {
  name: string;
  loginUrl: string;
  directoryUrl: string;
  eventsUrl: string;
}

export function generateRSVPConfirmationHTML(props: RSVPConfirmationProps): string {
  const { eventTitle, eventDate, eventTime, eventLocation, guestName, plusOnes, eventUrl } = props;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; border-bottom: 3px solid #8b5cf6;">
              <h1 style="margin: 0; font-size: 24px; color: #8b5cf6; font-weight: bold;">
                You're Confirmed!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #333333; line-height: 1.6;">
                Hey ${guestName},
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; color: #333333; line-height: 1.6;">
                You're all set for <strong>${eventTitle}</strong>!
              </p>

              <!-- Event Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px; font-size: 14px; color: #666666; font-weight: bold;">
                      📅 WHEN
                    </p>
                    <p style="margin: 0 0 15px; font-size: 16px; color: #333333;">
                      ${eventDate}<br>
                      ${eventTime}
                    </p>

                    <p style="margin: 0 0 10px; font-size: 14px; color: #666666; font-weight: bold;">
                      📍 WHERE
                    </p>
                    <p style="margin: 0 0 15px; font-size: 16px; color: #333333;">
                      ${eventLocation}
                    </p>

                    ${plusOnes > 0 ? `
                    <p style="margin: 0 0 10px; font-size: 14px; color: #666666; font-weight: bold;">
                      👥 GUESTS
                    </p>
                    <p style="margin: 0; font-size: 16px; color: #333333;">
                      You + ${plusOnes}
                    </p>
                    ` : ''}
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0; font-size: 16px; color: #333333; line-height: 1.6;">
                We'll send you a reminder closer to the date. See you there!
              </p>

              <!-- Button -->
              <table cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td style="background-color: #8b5cf6; border-radius: 6px;">
                    <a href="${eventUrl}" style="display: inline-block; padding: 12px 30px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                      View Event Details
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #666666;">
                Good Hang · Where tech professionals come alive
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function generateMembershipApprovedHTML(props: MembershipApprovedProps): string {
  const { name, loginUrl, directoryUrl, eventsUrl } = props;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; border-bottom: 3px solid #8b5cf6;">
              <h1 style="margin: 0; font-size: 28px; color: #8b5cf6; font-weight: bold;">
                🎉 Welcome to Good Hang!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #333333; line-height: 1.6;">
                Hey ${name},
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; color: #333333; line-height: 1.6;">
                Your membership application has been <strong>approved</strong>! Welcome to the club.
              </p>

              <p style="margin: 0 0 30px; font-size: 16px; color: #333333; line-height: 1.6;">
                You now have full access to all member features, events, and the community directory.
              </p>

              <!-- What's Next -->
              <h2 style="margin: 0 0 20px; font-size: 20px; color: #333333; font-weight: bold;">
                What's Next?
              </h2>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px;">
                <tr>
                  <td style="padding: 15px 0; border-bottom: 1px solid #e5e7eb;">
                    <a href="${loginUrl}" style="color: #8b5cf6; text-decoration: none; font-size: 16px; font-weight: 500;">
                      → Log in to your member dashboard
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 0; border-bottom: 1px solid #e5e7eb;">
                    <a href="${directoryUrl}" style="color: #8b5cf6; text-decoration: none; font-size: 16px; font-weight: 500;">
                      → Browse the member directory
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 0;">
                    <a href="${eventsUrl}" style="color: #8b5cf6; text-decoration: none; font-size: 16px; font-weight: 500;">
                      → Check out upcoming events
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Button -->
              <table cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td style="background-color: #8b5cf6; border-radius: 6px;">
                    <a href="${loginUrl}" style="display: inline-block; padding: 12px 30px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">
                      Get Started
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                Good Hang · Where tech professionals come alive
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                Questions? Reply to this email or reach out at hello@goodhang.club
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
