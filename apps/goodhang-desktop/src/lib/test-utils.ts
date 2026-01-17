/**
 * Test Utilities
 *
 * Test ID constants and helper functions for E2E testing and debugging.
 * Convention: [component]-[element]-[qualifier]
 */

// =============================================================================
// TEST ID CONSTANTS
// =============================================================================

export const TEST_IDS = {
  // Tutorial
  tutorial: {
    sidebar: 'tutorial-sidebar',
    stepItem: (step: string) => `tutorial-step-${step}`,
    progressBar: 'tutorial-progress-bar',
    resetBtn: 'tutorial-btn-reset',
    chatContainer: 'tutorial-chat-container',
    messageList: 'tutorial-message-list',
    message: (index: number) => `tutorial-message-${index}`,
    inputField: 'tutorial-input-field',
    sendBtn: 'tutorial-btn-send',
    micBtn: 'tutorial-btn-mic',
    quickAction: (value: string) => `tutorial-quick-action-${value}`,
    reportTabs: 'tutorial-report-tabs',
    reportTab: (tab: string) => `tutorial-report-tab-${tab}`,
    reportContent: 'tutorial-report-content',
    reportFeedbackInput: 'tutorial-report-feedback-input',
    reportConfirmBtn: 'tutorial-btn-confirm-section',
    reportContinueBtn: 'tutorial-btn-continue',
    loadingIndicator: 'tutorial-loading',
    loadingStage: 'tutorial-loading-stage',
  },

  // Assessment (shared between GoodHang and Work Style)
  assessment: {
    container: 'assessment-container',
    timeline: 'assessment-timeline',
    sectionBtn: (sectionId: string) => `assessment-section-${sectionId}`,
    progressBar: 'assessment-progress-bar',
    progressText: 'assessment-progress-text',
    exitBtn: 'assessment-btn-exit',
    saveExitBtn: 'assessment-btn-save-exit',
    questionCard: 'assessment-question-card',
    questionText: 'assessment-question-text',
    questionFollowUp: 'assessment-question-followup',
    transitionMessage: 'assessment-transition-message',
    answerInput: 'assessment-input-answer',
    micBtn: 'assessment-btn-mic',
    interimTranscript: 'assessment-interim-transcript',
    charCount: 'assessment-char-count',
    errorMessage: 'assessment-error',
    prevBtn: 'assessment-btn-prev',
    nextBtn: 'assessment-btn-next',
    completionCard: 'assessment-completion-card',
    reviewBtn: 'assessment-btn-review',
    completeBtn: 'assessment-btn-complete',
    loadingScreen: 'assessment-loading-screen',
    loadingMessage: 'assessment-loading-message',
    // Ranking (work-style specific)
    rankingContainer: 'assessment-ranking-container',
    rankingItem: (index: number) => `assessment-ranking-item-${index}`,
    rankingMoveUp: (index: number) => `assessment-ranking-up-${index}`,
    rankingMoveDown: (index: number) => `assessment-ranking-down-${index}`,
  },

  // Chat (shared)
  chat: {
    container: 'chat-container',
    header: 'chat-header',
    messageList: 'chat-message-list',
    message: (index: number) => `chat-message-${index}`,
    messageContent: (index: number) => `chat-message-content-${index}`,
    inputContainer: 'chat-input-container',
    inputField: 'chat-input-field',
    sendBtn: 'chat-btn-send',
    micBtn: 'chat-btn-mic',
    loadingIndicator: 'chat-loading',
    loadingDot: (index: number) => `chat-loading-dot-${index}`,
  },

  // Renubu Chat
  renubu: {
    container: 'renubu-container',
    progressBar: 'renubu-progress-bar',
    progressText: 'renubu-progress-text',
    entityCount: 'renubu-entity-count',
    artifactsBtn: 'renubu-btn-artifacts',
    choiceBtn: (choice: string) => `renubu-choice-${choice}`,
    entityConfirmBtn: 'renubu-btn-confirm-entities',
    entityTag: (index: number) => `renubu-entity-${index}`,
  },

  // Setup Sidebar
  setupSidebar: {
    container: 'setup-sidebar',
    header: 'setup-sidebar-header',
    modeIndicator: 'setup-sidebar-mode',
    collapseBtn: 'setup-sidebar-btn-collapse',
    checklistContainer: 'setup-sidebar-checklist',
    checklistItem: (id: string) => `setup-checklist-item-${id}`,
    checklistIcon: (id: string) => `setup-checklist-icon-${id}`,
    checklistLabel: (id: string) => `setup-checklist-label-${id}`,
    progressContainer: 'setup-sidebar-progress',
    progressBar: 'setup-sidebar-progress-bar',
    progressText: 'setup-sidebar-progress-text',
    unlockBtn: 'setup-sidebar-btn-unlock',
    collapsedProgress: 'setup-sidebar-collapsed-progress',
  },

  // Voice Test
  voiceTest: {
    container: 'voice-test-container',
    progressBar: 'voice-test-progress-bar',
    progressText: 'voice-test-progress-text',
    ratingSlider: 'voice-test-rating-slider',
    ratingValue: 'voice-test-rating-value',
    ratingSubmitBtn: 'voice-test-btn-rating-submit',
    feedbackForm: 'voice-test-feedback-form',
    feedbackDidntWork: 'voice-test-feedback-didnt-work',
    feedbackTenLooksLike: 'voice-test-feedback-ten',
    feedbackInstruction: 'voice-test-feedback-instruction',
    feedbackSubmitBtn: 'voice-test-btn-feedback-submit',
    tryAgainBtn: 'voice-test-btn-try-again',
    moveOnBtn: 'voice-test-btn-move-on',
    commandmentsList: 'voice-test-commandments',
    commandment: (index: number) => `voice-test-commandment-${index}`,
    dashboardBtn: 'voice-test-btn-dashboard',
  },
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a testId prop object for easy spreading
 * @example <div {...testId('tutorial-sidebar')} />
 */
export function testId(id: string): { 'data-testid': string } {
  return { 'data-testid': id };
}

/**
 * Create multiple test ID props
 * @example <div {...testIds({ testId: 'foo', id: 'bar' })} />
 */
export function testIds(ids: { testId?: string; id?: string }): Record<string, string> {
  const result: Record<string, string> = {};
  if (ids.testId) result['data-testid'] = ids.testId;
  if (ids.id) result.id = ids.id;
  return result;
}

/**
 * Generate a dynamic test ID for list items
 */
export function indexedTestId(prefix: string, index: number): { 'data-testid': string } {
  return { 'data-testid': `${prefix}-${index}` };
}
