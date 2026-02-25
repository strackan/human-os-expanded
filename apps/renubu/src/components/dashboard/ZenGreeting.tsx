'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';
import { getTimeBasedGreeting } from '@/lib/constants';

// Editable prompts for future LLM-generated content
// const FRIENDLY_MESSAGE_PROMPT = `Generate a short, warm, motivational greeting for a customer success manager starting their day. 2-5 words.`;
// const HELPFUL_THING_PROMPT = `Based on the user's workflow data, generate one concise helpful insight for the day.`;

interface ZenGreetingProps {
  className?: string;
}

export default function ZenGreeting({ className = '' }: ZenGreetingProps) {
  const { user } = useAuth();
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

  // TODO: Fetch LLM-generated messages (friendly greeting + helpful insight)
  useEffect(() => {
    setLoading(false);
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
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      id="zen-greeting"
      data-testid="zen-greeting"
      data-loading="false"
      className={`text-center space-y-2 zen-greeting ${className}`}
    >
      <h1
        id="zen-greeting-title"
        data-testid="zen-greeting-title"
        className="text-3xl font-light text-gray-800 zen-greeting__title"
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
    </motion.div>
  );
}
