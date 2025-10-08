/**
 * Test Workflow with Chat + Artifacts + Metrics
 *
 * Demonstrates the complete workflow UI:
 * - Chat interface (left side)
 * - Inline dashboard artifacts (within step cards)
 * - CustomerMetrics slide-down panel (from top)
 * - Generated artifacts panel (right side)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { ArtifactRenderer } from '@/components/workflows/artifacts/ArtifactRenderer';
import { CustomerMetrics, MetricsToggleButton } from '@/components/workflows/CustomerMetrics';
import { ArtifactDisplay } from '@/components/workflows/ArtifactDisplay';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function TestWorkflowChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your renewal assistant. I'll help you analyze this customer and prepare a renewal strategy. Let's start by reviewing the current status.",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [artifactsPanelOpen, setArtifactsPanelOpen] = useState(false);
  const [artifactsPanelWidth, setArtifactsPanelWidth] = useState(50); // percentage
  const [artifactsExpanded, setArtifactsExpanded] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Mock artifacts for testing
  const generatedArtifacts = [
    {
      id: 'artifact-1',
      title: 'Customer Health Analysis',
      content: `# Customer Health Analysis - Acme Corp

## Overall Health: 85% (Healthy)

### Key Metrics
- **ARR**: $725,000 (+12% YoY)
- **NPS Score**: 45 (Promoter)
- **Usage Rate**: 78% (High engagement)
- **Risk Score**: 3.2/10 (Low risk)

### Strengths
- Strong product adoption across departments
- High engagement from executive sponsor
- Consistent revenue growth
- Positive customer feedback

### Areas of Concern
- 3 open support tickets (1 critical integration issue)
- License utilization at 78% (opportunity for expansion)
- Last contact was 5 days ago

### Recommendations
1. Schedule QBR to address integration issues
2. Explore expansion opportunities (22% unused licenses)
3. Prepare renewal proposal with value-add features
4. Maintain regular touchpoints (weekly cadence)`,
      stepNumber: 1,
      stepTitle: 'Customer Analysis',
      createdAt: new Date(),
      type: 'markdown' as const
    }
  ];

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Great question! Based on the current health score of 85%, this customer is in good standing. The key focus areas should be addressing the integration issue and exploring expansion opportunities.",
        "I've analyzed the usage patterns. The 78% utilization rate suggests there's room for growth. Consider discussing additional seats or premium features during the renewal conversation.",
        "Looking at the timeline, we have 120 days until renewal. I recommend scheduling the QBR within the next 2 weeks to maintain momentum and address any concerns early."
      ];

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Resize handling
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const windowWidth = window.innerWidth;
      const newWidth = ((windowWidth - e.clientX) / windowWidth) * 100;

      // Constrain between 20% and 80%
      const constrainedWidth = Math.min(Math.max(newWidth, 20), 80);
      setArtifactsPanelWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Inline artifacts for the current "step"
  const inlineArtifacts = [
    {
      id: 'status-grid-1',
      type: 'status_grid' as const,
      title: 'Current Renewal Status',
      config: {
        columns: 4,
        items: [
          { label: 'Contract Status', value: 'Active', status: 'complete', sublabel: 'Expires Feb 28' },
          { label: 'Health Score', value: '85%', status: 'complete', sublabel: 'Healthy' },
          { label: 'QBR Scheduled', value: 'Pending', status: 'pending', sublabel: 'To be scheduled' },
          { label: 'Proposal Ready', value: 'No', status: 'error', sublabel: 'In progress' }
        ]
      }
    },
    {
      id: 'countdown-1',
      type: 'countdown' as const,
      title: 'Time Until Renewal',
      config: {
        targetDate: '2026-02-28T23:59:59',
        theme: 'default',
        thresholds: [
          { days: 30, message: 'Renewal approaching! Less than 30 days remaining.' }
        ],
        statusItems: [
          { label: 'ARR', status: '$725K' },
          { label: 'Stage', status: 'Discovery' }
        ]
      }
    },
    {
      id: 'action-tracker-1',
      type: 'action_tracker' as const,
      title: 'Next Actions',
      config: {
        showProgress: true,
        actions: [
          {
            id: 'action-1',
            title: 'Schedule QBR with executive sponsor',
            owner: 'Sarah Johnson',
            deadline: 'Jan 25, 2025',
            status: 'pending',
            checkable: true
          },
          {
            id: 'action-2',
            title: 'Review usage metrics and prepare analysis',
            owner: 'Mike Chen',
            deadline: 'Jan 28, 2025',
            status: 'pending',
            checkable: true
          },
          {
            id: 'action-3',
            title: 'Address critical integration issue',
            owner: 'Tech Support',
            deadline: 'Jan 20, 2025',
            status: 'overdue',
            checkable: true
          }
        ]
      }
    }
  ];

  const context = {
    customer: { name: 'Acme Corp', id: '550e8400-e29b-41d4-a716-446655440001' },
    workflow: { daysUntilRenewal: 120 }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Renewal Planning - Acme Corp</h1>
            <p className="text-sm text-gray-600 mt-1">AI-assisted renewal workflow with live metrics and artifacts</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Metrics Toggle */}
            <MetricsToggleButton
              isOpen={metricsOpen}
              onClick={() => setMetricsOpen(!metricsOpen)}
            />

            {/* Artifacts Toggle */}
            <button
              onClick={() => setArtifactsPanelOpen(!artifactsPanelOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <span>📄 Artifacts</span>
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                {generatedArtifacts.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Chat + Inline Artifacts */}
        <div
          className={`flex flex-col overflow-hidden transition-all duration-300 ${
            artifactsExpanded ? 'hidden' : ''
          }`}
          style={{
            width: artifactsPanelOpen && !artifactsExpanded
              ? `${100 - artifactsPanelWidth}%`
              : '100%'
          }}
        >
          {/* Customer Metrics Panel (slides down from top) */}
          <CustomerMetrics
            customerId="550e8400-e29b-41d4-a716-446655440001"
            executionId="test-execution-123"
            isOpen={metricsOpen}
            onToggle={() => setMetricsOpen(false)}
          />

          {/* Scrollable Content: Chat + Inline Artifacts */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto p-6 space-y-6">
              {/* Chat Messages */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    <h2 className="text-lg font-semibold text-gray-900">AI Assistant Chat</h2>
                  </div>
                </div>

                <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="border-t border-gray-200 p-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about the customer, renewal strategy, or next steps..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Inline Dashboard Artifacts */}
              {inlineArtifacts.map((artifact) => (
                <ArtifactRenderer
                  key={artifact.id}
                  artifact={artifact}
                  context={context}
                  onAction={(actionId, data) => {
                    console.log('[Chat Page] Artifact action:', actionId, data);
                    // In real implementation, this would update task status, etc.
                  }}
                  onRefresh={async (artifactId) => {
                    console.log('[Chat Page] Refresh artifact:', artifactId);
                    // In real implementation, this would fetch fresh data
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Resize Handle */}
        {artifactsPanelOpen && !artifactsExpanded && (
          <div
            onMouseDown={handleResizeStart}
            className={`
              w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize relative group
              transition-colors duration-150 flex-shrink-0
              ${isResizing ? 'bg-blue-500' : ''}
            `}
          >
            {/* Resize Pill/Notch */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                          w-1.5 h-12 bg-gray-300 group-hover:bg-blue-500 rounded-full
                          transition-colors duration-150
                          flex items-center justify-center">
              <div className="w-0.5 h-8 bg-white/50 rounded-full"></div>
            </div>
          </div>
        )}

        {/* Right Side: Generated Artifacts Panel */}
        {artifactsPanelOpen && (
          <div
            className={`border-l border-gray-200 bg-white transition-all duration-300 ${
              artifactsExpanded ? 'fixed inset-0 z-50' : 'relative'
            }`}
            style={{
              width: artifactsExpanded ? '100%' : `${artifactsPanelWidth}%`
            }}
          >
            <ArtifactDisplay
              artifacts={generatedArtifacts}
              onClose={() => {
                setArtifactsPanelOpen(false);
                setArtifactsExpanded(false);
              }}
              isExpanded={artifactsExpanded}
              onToggleExpand={() => setArtifactsExpanded(!artifactsExpanded)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
