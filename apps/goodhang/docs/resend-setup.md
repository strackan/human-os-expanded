# Resend Email Setup Guide

## Overview

Good Hang uses [Resend](https://resend.com) to send transactional emails for:
- RSVP confirmations when users register for events
- Membership approval notifications when admins approve applications
- Application received confirmations (future)

---

## Setup Steps

### 1. Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

**Free tier includes:**
- 100 emails per day
- 3,000 emails per month
- Perfect for getting started!

### 2. Add and Verify Your Domain

For production emails to work properly, you need to verify your domain:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain: `goodhang.club`
4. Resend will provide DNS records to add:
   - **SPF record** - Prevents email spoofing
   - **DKIM records** - Authenticates your emails
   - **MX records** - For receiving bounces

5. Add these DNS records to your domain provider (e.g., Cloudflare, Namecheap)
6. Wait for DNS propagation (can take up to 24 hours)
7. Click **Verify** in Resend dashboard

### 3. Get Your API Key

1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Name it: `Good Hang Production` (or Development for testing)
4. Select permissions:
   - ✅ **Sending access** - Required
   - ✅ **Full access** - Recommended for flexibility
5. Copy the API key (starts with `re_...`)

### 4. Add API Key to Environment Variables

**Local Development** (`.env.local`):
```bash
RESEND_API_KEY=re_your_api_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3200
```

**Production** (Vercel):
1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add:
   - `RESEND_API_KEY` = `re_your_api_key_here`
   - `NEXT_PUBLIC_SITE_URL` = `https://goodhang.club`

---

## Email Templates

### 1. RSVP Confirmation Email

**Triggered:** Automatically when user RSVPs to an event

**Template:** `lib/resend/templates.tsx` → `RSVPConfirmationEmail`

**Content:**
- Event name, date, time, location
- Number of guests (plus ones)
- Link to view event details
- Cancellation instructions

**Preview:**
```
Subject: You're confirmed for [Event Name]!

Hey [Name],

You're confirmed for [Event Name]! We're excited to see you there.

📅 Date: [Date]
🕐 Time: [Time]
📍 Location: [Location]
👥 Guests: You + [X]

[View Event Details Button]

Need to cancel? Just reply to this email.
```

### 2. Membership Approved Email

**Triggered:** When admin approves application in admin dashboard

**Template:** `lib/resend/templates.tsx` → `MembershipApprovedEmail`

**Content:**
- Welcome message
- What's next (complete profile, browse directory, RSVP for events)
- Links to dashboard, events, directory
- Contact information

**Preview:**
```
Subject: 🎉 Welcome to Good Hang!

Hey [Name],

Your membership has been approved! You now have full access to Good Hang.

What's Next?
1. Complete Your Profile
2. Browse the Member Directory
3. RSVP for Events

[Access Your Dashboard Button]
[Browse Events Button]
```

### 3. Application Received (Future)

**Triggered:** When user submits Typeform application

**Status:** Template created, not yet integrated

---

## Testing Emails

### Local Testing (Development Mode)

Resend allows you to test emails without a verified domain:

1. Use the API key from your Resend dashboard
2. Add to `.env.local`
3. Emails will be sent but marked as "test mode"
4. Check Resend dashboard → **Emails** to see sent emails

### Testing RSVP Email

1. Start dev server: `npm run dev`
2. Go to an event page: `/events/[id]`
3. Fill out RSVP form
4. Submit RSVP
5. Check Resend dashboard to see email

### Testing Approval Email

1. Log in as admin: `/admin`
2. Go to pending application: `/admin/applications/[id]`
3. Click **APPROVE**
4. Check Resend dashboard to see email

---

## Email API Routes

### `/api/emails/rsvp-confirmation` (POST)

Sends RSVP confirmation email.

**Request body:**
```json
{
  "eventId": "uuid",
  "rsvpId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "emailId": "resend_email_id"
}
```

### `/api/emails/membership-approved` (POST)

Sends membership approval email.

**Request body:**
```json
{
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "emailId": "resend_email_id"
}
```

---

## Email Design Guidelines

Our emails follow these principles:

1. **Readable First** - Clean sans-serif fonts, good line spacing
2. **Mobile-Friendly** - Max width 600px, responsive design
3. **Brand Consistent** - Purple accent color (#8b5cf6), Good Hang branding
4. **Actionable** - Clear CTAs with button styling
5. **Professional** - Friendly but not overly casual

---

## Monitoring & Analytics

### View Sent Emails

1. Go to Resend dashboard → **Emails**
2. Filter by:
   - Date range
   - Status (delivered, bounced, complained)
   - Recipient email

### Email Status Types

- **Delivered** ✅ - Email successfully delivered
- **Bounced** ❌ - Email address invalid or mailbox full
- **Complained** ⚠️ - Recipient marked as spam
- **Failed** ⚠️ - Sending error occurred

### Handling Bounces

If emails bounce frequently:
1. Check recipient email addresses are valid
2. Verify your domain is properly configured
3. Check if you're sending too many emails too quickly

---

## Troubleshooting

### Error: "RESEND_API_KEY is not set"

**Fix:** Add `RESEND_API_KEY` to your `.env.local` file

### Error: "Domain not verified"

**Fix:**
1. Verify domain in Resend dashboard
2. Or use test mode for development
3. In production, domain MUST be verified

### Error: "Failed to send email"

**Check:**
1. API key is valid and not expired
2. Recipient email address is valid
3. You haven't exceeded rate limits
4. Check Resend dashboard for error details

### Emails Not Arriving

**Check:**
1. Spam folder
2. Email status in Resend dashboard
3. Domain verification status
4. DNS records are correct

---

## Rate Limits

### Free Tier
- 100 emails/day
- 3,000 emails/month

### Pro Tier ($20/month)
- 50,000 emails/month
- $0.80 per additional 1,000 emails

### Recommendations
- Start with free tier
- Monitor usage in Resend dashboard
- Upgrade when you hit ~2,500 emails/month

---

## Best Practices

### 1. Non-Blocking Email Sends

Emails are sent asynchronously to avoid slowing down user actions:

```typescript
// Non-blocking - doesn't wait for email to send
fetch('/api/emails/rsvp-confirmation', {
  method: 'POST',
  body: JSON.stringify({ eventId, rsvpId }),
}).catch(err => console.error('Email failed:', err));
```

### 2. Error Handling

Email failures don't block core functionality:
- RSVP still succeeds even if email fails
- Approval still works even if email fails
- Errors are logged for debugging

### 3. Email Content Updates

To update email templates:
1. Edit `lib/resend/templates.tsx`
2. Test in development
3. Deploy changes
4. No Resend dashboard changes needed

---

## Production Checklist

Before launching:

- [ ] Create Resend account
- [ ] Verify goodhang.club domain
- [ ] Add DNS records for SPF, DKIM
- [ ] Create production API key
- [ ] Add `RESEND_API_KEY` to Vercel environment variables
- [ ] Set `NEXT_PUBLIC_SITE_URL` to `https://goodhang.club`
- [ ] Test RSVP confirmation email
- [ ] Test membership approval email
- [ ] Monitor first few emails in Resend dashboard

---

## Future Enhancements

Potential email additions:
- Application received confirmation
- Event reminders (24 hours before)
- Weekly digest of upcoming events
- New member welcome series
- Event recap emails

---

Your email system is ready to go! 📧
