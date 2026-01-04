/**
 * Performance Monitoring Utilities
 *
 * Tracks Web Vitals and custom performance metrics
 * for the assessment system.
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

export interface AssessmentPerformanceMetrics {
  timeToFirstQuestion: number | null;
  answerSaveLatency: number[];
  sectionTransitionSpeed: number[];
  averageRenderTime: number | null;
}

// Web Vitals thresholds (Google recommendations)
const THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

/**
 * Rate a metric value based on thresholds
 */
function rateMetric(
  name: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Track Web Vitals metrics
 * Use with Next.js reportWebVitals in _app.tsx or layout.tsx
 */
export function trackWebVitals(metric: {
  id: string;
  name: string;
  value: number;
  label: string;
  navigationType?: string;
}) {
  const performanceMetric: PerformanceMetric = {
    name: metric.name,
    value: metric.value,
    rating: rateMetric(metric.name, metric.value),
    timestamp: Date.now(),
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', performanceMetric);
  }

  // Send to analytics in production
  // TODO: Integrate with analytics service (PostHog, GA4, etc.)
  if (process.env.NODE_ENV === 'production') {
    // Example: sendToAnalytics(performanceMetric)
  }

  return performanceMetric;
}

/**
 * Custom performance mark for assessment flow
 */
export function markAssessmentEvent(eventName: string) {
  if (typeof window !== 'undefined' && window.performance) {
    performance.mark(eventName);
  }
}

/**
 * Measure time between two performance marks
 */
export function measureAssessmentDuration(
  measureName: string,
  startMark: string,
  endMark: string
): number | null {
  if (typeof window !== 'undefined' && window.performance) {
    try {
      performance.measure(measureName, startMark, endMark);
      const measure = performance.getEntriesByName(measureName)[0];
      return measure ? measure.duration : null;
    } catch (error) {
      console.warn('Performance measurement failed:', error);
      return null;
    }
  }
  return null;
}

/**
 * Track answer save latency
 */
export class AssessmentPerformanceTracker {
  private metrics: AssessmentPerformanceMetrics = {
    timeToFirstQuestion: null,
    answerSaveLatency: [],
    sectionTransitionSpeed: [],
    averageRenderTime: null,
  };

  markFirstQuestionShown() {
    markAssessmentEvent('assessment-first-question-shown');
    const duration = measureAssessmentDuration(
      'time-to-first-question',
      'assessment-start',
      'assessment-first-question-shown'
    );
    if (duration !== null) {
      this.metrics.timeToFirstQuestion = duration;
      console.log(`[Performance] Time to first question: ${duration.toFixed(2)}ms`);
    }
  }

  markAnswerSaveStart() {
    markAssessmentEvent('answer-save-start');
  }

  markAnswerSaveEnd() {
    markAssessmentEvent('answer-save-end');
    const duration = measureAssessmentDuration(
      'answer-save-latency',
      'answer-save-start',
      'answer-save-end'
    );
    if (duration !== null) {
      this.metrics.answerSaveLatency.push(duration);
      console.log(`[Performance] Answer save latency: ${duration.toFixed(2)}ms`);
    }
  }

  markSectionTransitionStart() {
    markAssessmentEvent('section-transition-start');
  }

  markSectionTransitionEnd() {
    markAssessmentEvent('section-transition-end');
    const duration = measureAssessmentDuration(
      'section-transition-speed',
      'section-transition-start',
      'section-transition-end'
    );
    if (duration !== null) {
      this.metrics.sectionTransitionSpeed.push(duration);
      console.log(`[Performance] Section transition: ${duration.toFixed(2)}ms`);
    }
  }

  getMetrics(): AssessmentPerformanceMetrics {
    return {
      ...this.metrics,
      averageRenderTime:
        this.metrics.sectionTransitionSpeed.length > 0
          ? this.metrics.sectionTransitionSpeed.reduce((a, b) => a + b, 0) /
            this.metrics.sectionTransitionSpeed.length
          : null,
    };
  }

  getSummary() {
    const metrics = this.getMetrics();
    const avgSaveLatency =
      metrics.answerSaveLatency.length > 0
        ? metrics.answerSaveLatency.reduce((a, b) => a + b, 0) /
          metrics.answerSaveLatency.length
        : null;

    return {
      timeToFirstQuestion: metrics.timeToFirstQuestion
        ? `${metrics.timeToFirstQuestion.toFixed(2)}ms`
        : 'N/A',
      averageAnswerSaveLatency: avgSaveLatency
        ? `${avgSaveLatency.toFixed(2)}ms`
        : 'N/A',
      averageSectionTransition: metrics.averageRenderTime
        ? `${metrics.averageRenderTime.toFixed(2)}ms`
        : 'N/A',
      totalAnswersSaved: metrics.answerSaveLatency.length,
      totalSectionTransitions: metrics.sectionTransitionSpeed.length,
    };
  }

  reset() {
    this.metrics = {
      timeToFirstQuestion: null,
      answerSaveLatency: [],
      sectionTransitionSpeed: [],
      averageRenderTime: null,
    };
  }
}

// Global instance for assessment tracking
let globalTracker: AssessmentPerformanceTracker | null = null;

export function getPerformanceTracker(): AssessmentPerformanceTracker {
  if (!globalTracker) {
    globalTracker = new AssessmentPerformanceTracker();
  }
  return globalTracker;
}
