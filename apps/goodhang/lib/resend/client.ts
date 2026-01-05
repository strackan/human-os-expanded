import { Resend } from 'resend';

// Lazy initialization to avoid errors when RESEND_API_KEY is not set
let resendInstance: Resend | null = null;

export const getResendClient = () => {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set');
    }
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
};

// For backward compatibility, export as resend
export const resend = {
  get emails() {
    return getResendClient().emails;
  }
};

// Default sender email
// Use Resend's onboarding email until custom domain is verified
export const FROM_EMAIL = 'Good Hang <onboarding@resend.dev>';
