# Typeform Setup Instructions

## Step 1: Create Your Typeform

1. Go to https://typeform.com and sign up/login
2. Click "Create" → "New Typeform"
3. Name it: "Good Hang - Membership Application"

## Step 2: Add These Questions

### Question 1: Name
- **Type**: Short text
- **Question**: "What's your full name?"
- **Required**: Yes

### Question 2: Email
- **Type**: Email
- **Question**: "What's your email address?"
- **Required**: Yes

### Question 3: LinkedIn
- **Type**: Website
- **Question**: "LinkedIn profile URL"
- **Required**: No
- **Description**: "Optional but recommended"

### Question 4: Current Role
- **Type**: Short text
- **Question**: "What's your current role and company?"
- **Required**: Yes
- **Placeholder**: "e.g., VP of Sales at TechCorp"

### Question 5: Why Join?
- **Type**: Long text
- **Question**: "Why do you want to join Good Hang?"
- **Required**: Yes
- **Description**: "Tell us what you're looking for in this community"

### Question 6: Contribution
- **Type**: Long text
- **Question**: "What would you bring to the Good Hang community?"
- **Required**: Yes
- **Description**: "Skills, connections, energy, ideas — what makes you a great fit?"

### Question 7: Referral
- **Type**: Multiple choice
- **Question**: "How did you hear about Good Hang?"
- **Required**: Yes
- **Options**:
  - Launch party
  - Friend/colleague
  - LinkedIn
  - Twitter
  - Renubu
  - Other

### Question 8: Ending
- **Type**: Ending screen
- **Title**: "Application Received!"
- **Description**: "Thanks for applying! We review applications on a rolling basis and will be in touch within 3-5 business days. In the meantime, check out our member directory and RSVP for the launch party!"
- **Button text**: "Visit Good Hang"
- **Button URL**: "https://goodhang.club"

## Step 3: Get Your Form ID

1. Click "Share" in the top right
2. Look at the URL in the "Link" section
3. It will look like: `https://form.typeform.com/to/AbCd1234`
4. Your Form ID is the part after `/to/`: **AbCd1234**

## Step 4: Add Form ID to .env.local

Add this line to your `.env.local` file:
```
NEXT_PUBLIC_TYPEFORM_FORM_ID=AbCd1234
```

## Step 5: Set Up Webhook (Optional - for auto-sync)

1. In Typeform, go to "Connect" → "Webhooks"
2. Add webhook URL: `https://goodhang.club/api/typeform-webhook`
3. This will automatically sync applications to Supabase

## Step 6: Customize Design (Optional)

1. Go to "Design" tab
2. **Theme**: Dark mode
3. **Colors**:
   - Primary: `#7700cc` (neon purple)
   - Background: `#0a0a0f`
   - Text: `#f5f5f5`
4. **Font**: Mono (closest to your aesthetic)

That's it! Your form is ready to embed.
