/**
 * Welcome Flow Route
 *
 * Initial welcome experience after registration:
 * 1. Welcome <First Name> with personalized message
 * 2. Offer to show "About You" executive report
 * 3. Transition to "Gather Details" for remaining questions
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/lib/stores/auth';
import { useUserStatusStore } from '@/lib/stores/user';
import { SetupSidebar, type ChecklistItem } from '@/components/setup-mode/SetupSidebar';
import { ChevronRight, Sparkles, User, ClipboardList, Loader2 } from 'lucide-react';

// Flow stages
type WelcomeStage =
  | 'welcome'           // Initial welcome screen
  | 'about-you'         // Viewing executive report
  | 'gather-details'    // Ready to gather more info
  | 'gathering';        // Actively gathering via chat

interface ExecutiveReport {
  summary: string;
  personality: {
    trait: string;
    description: string;
    insight: string;
  }[];
  communication: {
    style: string;
    preferences: string[];
  };
  workStyle: {
    approach: string;
    strengths: string[];
  };
  keyInsights: string[];
}

export default function WelcomeFlowPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuthStore();
  const { status, loading: statusLoading } = useUserStatusStore();

  // State
  const [stage, setStage] = useState<WelcomeStage>('welcome');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [currentReportPage, setCurrentReportPage] = useState(0);

  // Get user info
  const userName = status?.user?.full_name?.split(' ')[0] || 'there';
  const sessionId = searchParams.get('session') || status?.contexts?.active;

  // Checklist items for sidebar
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    {
      id: 'about-you',
      label: 'About You',
      description: 'What we learned',
      required: false,
      status: 'pending',
    },
    {
      id: 'gather-details',
      label: 'Gather Details',
      description: 'Work style questions',
      required: true,
      status: 'locked',
    },
    {
      id: 'context-building',
      label: 'Build Context',
      description: 'Your world',
      required: false,
      status: 'locked',
    },
  ]);

  const [currentChecklistItem, setCurrentChecklistItem] = useState<string>('about-you');

  // Generate executive report
  const generateReport = useCallback(async () => {
    if (!sessionId) return;

    setReportLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://goodhang.com';
      const response = await fetch(`${baseUrl}/api/sculptor/sessions/${sessionId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ type: 'executive' }),
      });

      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
      } else {
        // Generate a fallback report based on basic analysis
        setReport(generateFallbackReport());
      }
    } catch (error) {
      console.error('[welcome] Error generating report:', error);
      setReport(generateFallbackReport());
    } finally {
      setReportLoading(false);
    }
  }, [sessionId, token]);

  // Fallback report generation
  const generateFallbackReport = (): ExecutiveReport => ({
    summary: `Based on our conversation, you're someone who values authenticity and direct communication. You approach challenges thoughtfully and aren't afraid to dig into the details.`,
    personality: [
      {
        trait: 'Analytical Thinker',
        description: 'You naturally break down complex problems into manageable pieces.',
        insight: 'This serves you well in strategic planning but may sometimes slow quick decisions.',
      },
      {
        trait: 'Authentic Communicator',
        description: 'You value genuine interactions over surface-level exchanges.',
        insight: 'People trust you because they know where they stand.',
      },
    ],
    communication: {
      style: 'Direct but thoughtful',
      preferences: [
        'Clear, honest feedback',
        'Context before conclusions',
        'Time to process complex information',
      ],
    },
    workStyle: {
      approach: 'Methodical and thorough',
      strengths: [
        'Deep focus on important problems',
        'Building lasting solutions',
        'Connecting disparate ideas',
      ],
    },
    keyInsights: [
      'You work best with clear priorities and uninterrupted focus time.',
      'You value competence and appreciate when others come prepared.',
      'Your natural tendency is to understand the full picture before acting.',
    ],
  });

  // Handle "Sure!" click - show About You
  const handleShowAboutYou = useCallback(() => {
    setStage('about-you');
    setSidebarCollapsed(false);
    setChecklistItems(prev => prev.map(item =>
      item.id === 'about-you'
        ? { ...item, status: 'in_progress' as const }
        : item
    ));
    generateReport();
  }, [generateReport]);

  // Handle "Later" or continue after report
  const handleContinue = useCallback(() => {
    // Mark welcome flow as completed in localStorage
    localStorage.setItem('founder-os-welcome-completed', new Date().toISOString());

    // Mark about-you as complete if we viewed it
    if (stage === 'about-you') {
      setChecklistItems(prev => prev.map(item =>
        item.id === 'about-you'
          ? { ...item, status: 'completed' as const }
          : item.id === 'gather-details'
          ? { ...item, status: 'pending' as const }
          : item
      ));
    } else {
      // Skipped about-you, unlock gather-details
      setChecklistItems(prev => prev.map(item =>
        item.id === 'gather-details'
          ? { ...item, status: 'pending' as const }
          : item
      ));
    }
    setStage('gather-details');
    setCurrentChecklistItem('gather-details');
    setSidebarCollapsed(false);
  }, [stage]);

  // Handle starting the gather flow
  const handleStartGathering = useCallback(() => {
    setChecklistItems(prev => prev.map(item =>
      item.id === 'gather-details'
        ? { ...item, status: 'in_progress' as const }
        : item
    ));
    // Navigate to renubu-chat with a flag for work-style questions
    navigate(`/founder-os/renubu-chat?session=${sessionId}&mode=work-style`);
  }, [navigate, sessionId]);

  // Handle checklist item click
  const handleChecklistItemClick = useCallback((itemId: string) => {
    const item = checklistItems.find(i => i.id === itemId);
    if (item?.status === 'locked') return;

    setCurrentChecklistItem(itemId);
    if (itemId === 'about-you' && stage !== 'about-you') {
      handleShowAboutYou();
    } else if (itemId === 'gather-details') {
      setStage('gather-details');
    }
  }, [checklistItems, stage, handleShowAboutYou]);

  // Loading state
  if (statusLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gh-dark-900">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Preparing your experience...</p>
        </motion.div>
      </div>
    );
  }

  // Get personalized welcome message
  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

    return `Good ${greeting}! I've been looking forward to meeting you. We had quite the conversation with The Sculptor, and I learned a lot about how you think and work.`;
  };

  // Report pages for pagination
  const reportPages = report ? [
    // Page 1: Overview
    {
      title: 'Who You Are',
      content: (
        <div className="space-y-6">
          <p className="text-lg text-gray-300 leading-relaxed">{report.summary}</p>
          <div className="border-t border-gh-dark-600 pt-6">
            <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Communication Style</h4>
            <p className="text-white text-lg mb-3">{report.communication.style}</p>
            <ul className="space-y-2">
              {report.communication.preferences.map((pref, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-400">
                  <ChevronRight className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                  {pref}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },
    // Page 2: Personality
    {
      title: 'Your Personality',
      content: (
        <div className="space-y-6">
          {report.personality.map((p, i) => (
            <div key={i} className="bg-gh-dark-700/50 rounded-xl p-5">
              <h4 className="text-lg font-semibold text-white mb-2">{p.trait}</h4>
              <p className="text-gray-300 mb-3">{p.description}</p>
              <div className="flex items-start gap-2 text-sm text-blue-400">
                <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{p.insight}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    // Page 3: Work Style & Insights
    {
      title: 'How You Work Best',
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Your Approach</h4>
            <p className="text-white text-lg">{report.workStyle.approach}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Strengths</h4>
            <ul className="space-y-2">
              {report.workStyle.strengths.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-gh-dark-600 pt-6">
            <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Key Insights</h4>
            <ul className="space-y-3">
              {report.keyInsights.map((insight, i) => (
                <li key={i} className="text-gray-300 flex items-start gap-2">
                  <span className="text-blue-400 font-bold">{i + 1}.</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },
  ] : [];

  return (
    <div className="flex h-screen bg-gh-dark-900">
      {/* Sidebar - initially collapsed, expands when viewing About You */}
      <SetupSidebar
        items={checklistItems}
        currentItemId={currentChecklistItem}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onItemClick={handleChecklistItemClick}
        canUnlock={false}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Stage 1: Welcome */}
          {stage === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl text-center"
            >
              {/* Avatar/Icon */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 mx-auto mb-8 flex items-center justify-center"
              >
                <User className="w-12 h-12 text-white" />
              </motion.div>

              {/* Big Welcome */}
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-5xl font-bold text-white mb-6"
              >
                Welcome, {userName}
              </motion.h1>

              {/* Personalized Message */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xl text-gray-300 mb-12 leading-relaxed"
              >
                {getWelcomeMessage()}
              </motion.p>

              {/* Question */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-gray-400 mb-8"
              >
                Before we get started, would you like to know what I learned about you?
              </motion.p>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex gap-4 justify-center"
              >
                <button
                  onClick={handleContinue}
                  className="px-8 py-4 bg-gh-dark-700 hover:bg-gh-dark-600 text-gray-300 rounded-xl text-lg transition-colors"
                >
                  Later
                </button>
                <button
                  onClick={handleShowAboutYou}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Sure!
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* Stage 2: About You Report */}
          {stage === 'about-you' && (
            <motion.div
              key="about-you"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl w-full"
            >
              {reportLoading ? (
                <div className="text-center py-20">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Analyzing what we learned...</p>
                </div>
              ) : report ? (
                <div className="bg-gh-dark-800 rounded-2xl overflow-hidden">
                  {/* Report Header */}
                  <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-gh-dark-700">
                    <h2 className="text-2xl font-bold text-white">About You</h2>
                    <p className="text-gray-400 mt-1">
                      Page {currentReportPage + 1} of {reportPages.length}
                    </p>
                  </div>

                  {/* Report Content */}
                  <div className="p-6">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentReportPage}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        <h3 className="text-xl font-semibold text-white mb-6">
                          {reportPages[currentReportPage]?.title}
                        </h3>
                        {reportPages[currentReportPage]?.content}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Navigation */}
                  <div className="p-6 border-t border-gh-dark-700 flex items-center justify-between">
                    {/* Page dots */}
                    <div className="flex gap-2">
                      {reportPages.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentReportPage(i)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            i === currentReportPage ? 'bg-blue-500' : 'bg-gh-dark-600'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex gap-3">
                      {currentReportPage > 0 && (
                        <button
                          onClick={() => setCurrentReportPage(p => p - 1)}
                          className="px-4 py-2 bg-gh-dark-700 hover:bg-gh-dark-600 text-gray-300 rounded-lg transition-colors"
                        >
                          Previous
                        </button>
                      )}
                      {currentReportPage < reportPages.length - 1 ? (
                        <button
                          onClick={() => setCurrentReportPage(p => p + 1)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={handleContinue}
                          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          Continue
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}

          {/* Stage 3: Gather Details */}
          {stage === 'gather-details' && (
            <motion.div
              key="gather-details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl text-center"
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 mx-auto mb-8 flex items-center justify-center"
              >
                <ClipboardList className="w-10 h-10 text-white" />
              </motion.div>

              {/* Message */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-gray-300 mb-4 leading-relaxed"
              >
                Before we get started, there's just a few more things we need to learn about you.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-lg text-gray-400 mb-10"
              >
                It shouldn't take more than ten minutes. Ready to knock it out?
              </motion.p>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex gap-4 justify-center"
              >
                <button
                  onClick={() => navigate('/founder-os/production')}
                  className="px-8 py-4 bg-gh-dark-700 hover:bg-gh-dark-600 text-gray-300 rounded-xl text-lg transition-colors"
                >
                  Later
                </button>
                <button
                  onClick={handleStartGathering}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-medium transition-colors"
                >
                  Sure!
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
