/**
 * Analytics Utility
 *
 * Centralized analytics tracking with support for multiple providers
 * Currently supports Google Analytics (gtag), can be extended for others
 */

export type AnalyticsEvent =
  // Assessment events
  | 'assessment_started'
  | 'assessment_section_completed'
  | 'assessment_question_answered'
  | 'assessment_completed'
  | 'assessment_abandoned'
  | 'assessment_results_viewed'
  | 'assessment_results_published'
  // Voice dictation events
  | 'voice_dictation_started'
  | 'voice_dictation_completed'
  | 'voice_dictation_failed'
  | 'voice_dictation_unsupported'
  // Navigation events
  | 'page_view'
  | 'navigation_click'
  | 'external_link_click'
  // Error events
  | 'error_occurred'
  | 'api_error'
  | 'network_error'
  // User interaction events
  | 'form_submit'
  | 'button_click'
  | 'modal_opened'
  | 'modal_closed';

export interface AnalyticsProperties {
  [key: string]: string | number | boolean | undefined;
}

// Type definitions for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      eventName: string | Date,
      params?: Record<string, unknown>
    ) => void;
    dataLayer?: Array<Record<string, unknown>>;
  }
}

/**
 * Track an analytics event
 */
export function trackEvent(
  event: AnalyticsEvent | string,
  properties?: AnalyticsProperties
): void {
  try {
    // Google Analytics (gtag)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event, properties);
    }

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event, properties);
    }
  } catch (error) {
    // Silently fail - analytics should never break the app
    console.error('Analytics error:', error);
  }
}

/**
 * Track page view
 */
export function trackPageView(path: string, title?: string): void {
  trackEvent('page_view', {
    page_path: path,
    page_title: title || document.title,
  });
}

/**
 * Track assessment events
 */
export const assessmentAnalytics = {
  started: (userId?: string, inviteCode?: string) => {
    trackEvent('assessment_started', {
      user_id: userId,
      invite_code: inviteCode,
      timestamp: Date.now(),
    });
  },

  questionAnswered: (
    questionId: string,
    sectionId: string,
    timeSpentSeconds: number,
    method: 'typing' | 'voice'
  ) => {
    trackEvent('assessment_question_answered', {
      question_id: questionId,
      section_id: sectionId,
      time_spent_seconds: timeSpentSeconds,
      input_method: method,
    });
  },

  sectionCompleted: (
    sectionId: string,
    sectionTitle: string,
    totalQuestions: number,
    timeSpentMinutes: number
  ) => {
    trackEvent('assessment_section_completed', {
      section_id: sectionId,
      section_title: sectionTitle,
      total_questions: totalQuestions,
      time_spent_minutes: timeSpentMinutes,
    });
  },

  completed: (
    sessionId: string,
    totalTimeMinutes: number,
    voiceUsageCount: number,
    totalQuestions: number
  ) => {
    trackEvent('assessment_completed', {
      session_id: sessionId,
      total_time_minutes: totalTimeMinutes,
      voice_usage_count: voiceUsageCount,
      total_questions: totalQuestions,
      completion_rate: 100,
    });
  },

  abandoned: (
    questionsCompleted: number,
    totalQuestions: number,
    lastSection: string,
    timeSpentMinutes: number
  ) => {
    trackEvent('assessment_abandoned', {
      questions_completed: questionsCompleted,
      total_questions: totalQuestions,
      completion_rate: (questionsCompleted / totalQuestions) * 100,
      last_section: lastSection,
      time_spent_minutes: timeSpentMinutes,
    });
  },

  resultsViewed: (sessionId: string, archetype?: string, tier?: string) => {
    trackEvent('assessment_results_viewed', {
      session_id: sessionId,
      archetype,
      tier,
    });
  },

  resultsPublished: (sessionId: string) => {
    trackEvent('assessment_results_published', {
      session_id: sessionId,
    });
  },
};

/**
 * Track voice dictation events
 */
export const voiceAnalytics = {
  started: (questionId: string) => {
    trackEvent('voice_dictation_started', {
      question_id: questionId,
    });
  },

  completed: (questionId: string, wordCount: number, duration: number) => {
    trackEvent('voice_dictation_completed', {
      question_id: questionId,
      word_count: wordCount,
      duration_seconds: duration,
    });
  },

  failed: (questionId: string, errorType: string) => {
    trackEvent('voice_dictation_failed', {
      question_id: questionId,
      error_type: errorType,
    });
  },

  unsupported: () => {
    trackEvent('voice_dictation_unsupported', {
      user_agent: navigator.userAgent,
      platform: navigator.platform,
    });
  },
};

/**
 * Track errors
 */
export const errorAnalytics = {
  occurred: (
    errorType: string,
    errorMessage: string,
    context?: string,
    fatal?: boolean
  ) => {
    trackEvent('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
      context,
      fatal: fatal || false,
    });
  },

  apiError: (endpoint: string, statusCode: number, errorMessage: string) => {
    trackEvent('api_error', {
      endpoint,
      status_code: statusCode,
      error_message: errorMessage,
    });
  },

  networkError: (endpoint: string) => {
    trackEvent('network_error', {
      endpoint,
      online: navigator.onLine,
    });
  },
};

/**
 * Track user interactions
 */
export const interactionAnalytics = {
  buttonClick: (buttonLabel: string, context?: string) => {
    trackEvent('button_click', {
      button_label: buttonLabel,
      context,
    });
  },

  formSubmit: (formName: string, success: boolean) => {
    trackEvent('form_submit', {
      form_name: formName,
      success,
    });
  },

  externalLinkClick: (url: string, label?: string) => {
    trackEvent('external_link_click', {
      url,
      label,
    });
  },
};

/**
 * Get device and browser information
 */
export function getDeviceInfo(): {
  device_type: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  screen_width: number;
  screen_height: number;
} {
  const userAgent = navigator.userAgent.toLowerCase();
  const screenWidth = window.screen.width;

  // Determine device type
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (screenWidth < 768) {
    deviceType = 'mobile';
  } else if (screenWidth < 1024) {
    deviceType = 'tablet';
  }

  // Determine browser
  let browser = 'unknown';
  if (userAgent.includes('chrome')) browser = 'chrome';
  else if (userAgent.includes('safari')) browser = 'safari';
  else if (userAgent.includes('firefox')) browser = 'firefox';
  else if (userAgent.includes('edge')) browser = 'edge';

  // Determine OS
  let os = 'unknown';
  if (userAgent.includes('win')) os = 'windows';
  else if (userAgent.includes('mac')) os = 'macos';
  else if (userAgent.includes('linux')) os = 'linux';
  else if (userAgent.includes('android')) os = 'android';
  else if (userAgent.includes('ios') || userAgent.includes('iphone') || userAgent.includes('ipad')) os = 'ios';

  return {
    device_type: deviceType,
    browser,
    os,
    screen_width: window.screen.width,
    screen_height: window.screen.height,
  };
}
