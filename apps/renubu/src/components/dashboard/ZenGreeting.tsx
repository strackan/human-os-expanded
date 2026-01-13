'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getTimeBasedGreeting } from '@/lib/constants';

// ===================================================================
// EDITABLE PROMPTS - Modify these to change LLM-generated content
// ===================================================================

const FRIENDLY_MESSAGE_PROMPT = `Generate a short, warm, motivational greeting for a customer success manager starting their day. 2-5 words. Examples: "Let's make today count", "Ready to drive success?", "Time to create impact"`;

const HELPFUL_THING_PROMPT = `Based on the user's workflow data, generate one concise helpful insight for the day. Examples: "3 workflows need attention", "2 critical renewals this week", "Perfect day for deep work"`;

// ===================================================================
// END EDITABLE PROMPTS
// ===================================================================

interface ZenGreetingProps {
  className?: string;
}

export default function ZenGreeting({ className = '' }: ZenGreetingProps) {
  const { user } = useAuth();
  const [friendlyMessage, setFriendlyMessage] = useState<string>('Let\'s make today count');
  const [helpfulThing, setHelpfulThing] = useState<string>('3 workflows need attention');
  const [loading, setLoading] = useState<boolean>(true);

  // Extract first name from user data
  const getFirstName = () => {
    // Try to get name from user metadata first

    // Then try user metadata from Google OAuth
    if (user?.user_metadata) {
      const metadata = user.user_metadata;
      const name =
        metadata.given_name ||
        metadata.name?.split(' ')[0] ||
        metadata.full_name?.split(' ')[0];

      if (name) {
        return name;
      }
    }

    // Fallback to email username if no name found
    if (user?.email) {
      const emailPrefix = user.email.split('@')[0];
      const name = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      return name;
    }

    return 'there';
  };

  // Get current day and date
  const getCurrentDayDate = () => {
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const monthDay = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    return `${dayName}, ${monthDay}`;
  };

  // Fetch LLM-generated messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // TODO: Call LLM API to generate messages
        // For now, use placeholder rotating messages
        const friendlyMessages = [
          'Let\'s make today count',
          'Ready to drive success?',
          'Time to create impact',
          'Your customers are counting on you',
          'Great things ahead'
        ];

        const helpfulThings = [
          '3 workflows need attention',
          '2 critical renewals this week',
          'Perfect day for deep work',
          '5 customers waiting for follow-up',
          '1 high-risk account needs care'
        ];

        // Rotate based on day of week
        const dayIndex = new Date().getDay();
        setFriendlyMessage(friendlyMessages[dayIndex % friendlyMessages.length]);
        setHelpfulThing(helpfulThings[dayIndex % helpfulThings.length]);
      } catch (error) {
        console.error('[ZenGreeting] Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  if (loading) {
    return (
      <div
        id="zen-greeting"
        data-testid="zen-greeting"
        data-loading="true"
        className={`text-center space-y-2 zen-greeting zen-greeting--loading ${className}`}
      >
        <div className="h-8 bg-gray-200 rounded w-64 mx-auto animate-pulse zen-greeting__skeleton zen-greeting__skeleton--title"></div>
        <div className="h-4 bg-gray-100 rounded w-48 mx-auto animate-pulse zen-greeting__skeleton zen-greeting__skeleton--date"></div>
      </div>
    );
  }

  return (
    <div
      id="zen-greeting"
      data-testid="zen-greeting"
      data-loading="false"
      className={`text-center space-y-2 zen-greeting ${className}`}
    >
      <h1
        id="zen-greeting-title"
        data-testid="zen-greeting-title"
        className="text-3xl font-light text-gray-700 zen-greeting__title"
      >
        {getTimeBasedGreeting()}, {getFirstName()}
      </h1>
      <p
        id="zen-greeting-date"
        data-testid="zen-greeting-date"
        className="text-sm text-gray-400 zen-greeting__date"
      >
        {getCurrentDayDate()}
      </p>
    </div>
  );
}
