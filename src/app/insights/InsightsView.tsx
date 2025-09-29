'use client';

import React, { useState } from 'react';
import { SparklesIcon, ChartBarIcon, ExclamationTriangleIcon, ChatBubbleLeftRightIcon, XMarkIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface Assignment {
  userId: string;
  assignedAt: string;
  status: 'pending' | 'accepted' | 'completed';
}

interface Insight {
  id: string;
  type: 'risk' | 'opportunity' | 'trend' | 'action' | 'customer';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  category: string;
  timeframe: string;
  status: 'new' | 'assigned' | 'in_progress' | 'completed';
  assignment?: Assignment;
  customer?: {
    name: string;
    accountValue: number;
    industry: string;
    tenure: string;
  };
}

// Sample users for demonstration
const SAMPLE_USERS: User[] = [
  {
    id: 'u1',
    name: 'Sarah Chen',
    email: 'sarah.chen@company.com',
    avatar: 'SC'
  },
  {
    id: 'u2',
    name: 'Michael Rodriguez',
    email: 'michael.r@company.com',
    avatar: 'MR'
  },
  {
    id: 'u3',
    name: 'Alex Kim',
    email: 'alex.kim@company.com',
    avatar: 'AK'
  }
];

const SAMPLE_INSIGHTS: Insight[] = [
  {
    id: '1',
    type: 'risk',
    title: 'Enterprise Segment Price Sensitivity',
    description: 'Recent analysis shows increasing price sensitivity in Enterprise segment, particularly in companies with less than 2 years of tenure.',
    impact: 'high',
    confidence: 85,
    category: 'Pricing',
    timeframe: 'Next Quarter',
    status: 'new'
  },
  {
    id: '2',
    type: 'opportunity',
    title: 'Mid-Market Feature Adoption',
    description: 'Mid-market customers showing strong interest in advanced analytics features, potential for upsell.',
    impact: 'high',
    confidence: 92,
    category: 'Product',
    timeframe: 'Current Quarter',
    status: 'new'
  },
  {
    id: '3',
    type: 'trend',
    title: 'API Usage Patterns',
    description: 'Significant increase in API usage among SMB customers, indicating potential need for higher tier plans.',
    impact: 'medium',
    confidence: 78,
    category: 'Usage',
    timeframe: 'Last 30 Days',
    status: 'new'
  },
  {
    id: '4',
    type: 'action',
    title: 'Customer Success Coverage',
    description: 'Analysis suggests optimal CS coverage ratio needs adjustment for high-growth accounts.',
    impact: 'medium',
    confidence: 88,
    category: 'Operations',
    timeframe: 'Immediate',
    status: 'new'
  },
  {
    id: '5',
    type: 'customer',
    title: 'Acme Corp Expansion Opportunity',
    description: 'Usage patterns and team growth indicate readiness for enterprise tier upgrade. Current utilization at 92% of plan limits.',
    impact: 'high',
    confidence: 94,
    category: 'Account Growth',
    timeframe: 'Next 30 Days',
    status: 'new',
    customer: {
      name: 'Acme Corporation',
      accountValue: 120000,
      industry: 'Technology',
      tenure: '2.5 years'
    }
  },
  {
    id: '6',
    type: 'customer',
    title: 'GlobalTech Integration Risk',
    description: 'Recent API usage patterns suggest integration issues with new workflow automation. Support tickets increased by 40%.',
    impact: 'high',
    confidence: 88,
    category: 'Technical Health',
    timeframe: 'Immediate',
    status: 'new',
    customer: {
      name: 'GlobalTech Solutions',
      accountValue: 250000,
      industry: 'Enterprise Software',
      tenure: '1.5 years'
    }
  },
  {
    id: '7',
    type: 'customer',
    title: 'InnovateCo Feature Opportunity',
    description: 'Analytics show heavy usage of collaboration features. Team not yet using advanced permissions - high fit for new role-based access control.',
    impact: 'medium',
    confidence: 86,
    category: 'Product Adoption',
    timeframe: 'This Quarter',
    status: 'new',
    customer: {
      name: 'InnovateCo',
      accountValue: 85000,
      industry: 'Digital Agency',
      tenure: '3 years'
    }
  }
];

const InsightsView = () => {
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [messageInput, setMessageInput] = useState('');
  const [insights, setInsights] = useState<Insight[]>(SAMPLE_INSIGHTS);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);

  const handleStartDiscussion = (insight: Insight) => {
    setSelectedInsight(insight);
    setShowChat(true);
    setChatMessages([
      {
        role: 'assistant',
        content: `I'm ready to discuss the ${insight.title.toLowerCase()} issue. I've analyzed the data and prepared some insights. What specific aspects would you like to explore?`
      }
    ]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);

    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setMentionStartIndex(lastAtIndex);
      setMentionQuery('');
      setShowMentions(true);
    } else if (lastAtIndex !== -1 && mentionStartIndex === lastAtIndex) {
      const query = value.slice(lastAtIndex + 1);
      setMentionQuery(query);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (user: User) => {
    const beforeMention = messageInput.slice(0, mentionStartIndex);
    const newMessage = `${beforeMention}@${user.name} `;
    setMessageInput(newMessage);
    setShowMentions(false);
    setMentionStartIndex(-1);
  };

  const filteredUsers = SAMPLE_USERS.filter(user =>
    user.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const newMessages = [
      ...chatMessages,
      { role: 'user', content: messageInput }
    ];
    setChatMessages(newMessages);
    setMessageInput('');

    // Simulate AI response
    setTimeout(() => {
      setChatMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `I understand your interest in ${messageInput.toLowerCase()}. Based on our analysis, this relates to ${selectedInsight?.category.toLowerCase()} trends we've observed. Would you like me to provide more specific data or discuss potential actions?`
        }
      ]);
    }, 1000);
  };

  const handleAssign = (insight: Insight, userId: string) => {
    const updatedInsights = insights.map(i => {
      if (i.id === insight.id) {
        return {
          ...i,
          status: 'assigned',
          assignment: {
            userId,
            assignedAt: new Date().toISOString(),
            status: 'pending'
          }
        };
      }
      return i;
    });
    setInsights(updatedInsights);
    setShowAssign(false);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'risk':
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />;
      case 'opportunity':
        return <SparklesIcon className="h-6 w-6 text-green-500" />;
      case 'trend':
        return <ChartBarIcon className="h-6 w-6 text-blue-500" />;
      case 'customer':
        return <UserGroupIcon className="h-6 w-6 text-indigo-500" />;
      default:
        return <ChatBubbleLeftRightIcon className="h-6 w-6 text-purple-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-gray-100 text-gray-600';
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getAssignedUser = (userId: string) => {
    return SAMPLE_USERS.find(user => user.id === userId);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Insights Dashboard</h1>
          <div className="flex space-x-4">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Filter
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Sort
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6 flex flex-col h-full">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      {getInsightIcon(insight.type)}
                      <span className="ml-2 text-sm font-medium text-gray-500 capitalize">
                        {insight.type}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getImpactColor(insight.impact)}`}>
                        {insight.impact} impact
                      </span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(insight.status)}`}>
                        {insight.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {insight.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {insight.description}
                  </p>

                  {insight.customer && (
                    <div className="mb-4 bg-indigo-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-indigo-900">{insight.customer.name}</span>
                        <span className="text-sm text-indigo-700">${(insight.customer.accountValue / 1000).toFixed(0)}k ARR</span>
                      </div>
                      <div className="flex items-center text-sm text-indigo-700">
                        <span>{insight.customer.industry}</span>
                        <span className="mx-2">•</span>
                        <span>{insight.customer.tenure} tenure</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500">{insight.category}</span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-sm text-gray-500">{insight.timeframe}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">{insight.confidence}% confidence</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStartDiscussion(insight)}
                      className="flex-1 flex items-center justify-center px-4 py-2 border border-blue-500 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50"
                    >
                      <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                      Discuss
                    </button>
                    <button
                      onClick={() => {
                        setSelectedInsight(insight);
                        setShowAssign(true);
                      }}
                      className="flex-1 flex items-center justify-center px-4 py-2 border border-purple-500 rounded-md text-sm font-medium text-purple-600 hover:bg-purple-50"
                    >
                      <UserGroupIcon className="h-5 w-5 mr-2" />
                      Assign
                    </button>
                  </div>

                  {insight.assignment && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-medium">
                            {getAssignedUser(insight.assignment.userId)?.avatar}
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {getAssignedUser(insight.assignment.userId)?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Assigned {new Date(insight.assignment.assignedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Assignment Modal */}
        {showAssign && selectedInsight && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg w-full max-w-md border border-gray-200">
              <div className="flex items-center justify-between p-4 border-b border-gray-200/80">
                <h3 className="text-lg font-semibold text-gray-900">
                  Assign Insight
                </h3>
                <button
                  onClick={() => setShowAssign(false)}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                  aria-label="Close assignment"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="p-4">
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Select Team Member</h4>
                  <div className="space-y-2">
                    {SAMPLE_USERS.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleAssign(selectedInsight, user.id)}
                        className="w-full flex items-center p-3 rounded-lg border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-colors"
                      >
                        <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-medium">
                          {user.avatar}
                        </div>
                        <div className="ml-3 text-left">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Dialog */}
        {showChat && selectedInsight && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg w-full max-w-2xl border border-gray-200">
              <div className="flex items-center justify-between p-4 border-b border-gray-200/80">
                <div className="flex items-center">
                  {getInsightIcon(selectedInsight.type)}
                  <h3 className="ml-2 text-lg font-semibold text-gray-900">
                    {selectedInsight.title}
                  </h3>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                  aria-label="Close discussion"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="p-4 h-96 overflow-y-auto">
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-4 ${
                      message.role === 'assistant' ? 'flex' : 'flex flex-row-reverse'
                    }`}
                  >
                    <div
                      className={`max-w-3/4 p-4 rounded-lg shadow-sm ${
                        message.role === 'assistant'
                          ? 'bg-white border border-gray-100 text-gray-800'
                          : 'bg-blue-600/90 backdrop-blur-sm text-white'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-gray-200/80 bg-gray-50/50">
                <div className="relative">
                  <div className="flex space-x-4">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={handleInputChange}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message... Use @ to mention someone"
                      className="flex-1 px-4 py-2 bg-white/90 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="px-4 py-2 bg-blue-600/90 text-white rounded-lg hover:bg-blue-700/90 transition-colors shadow-sm"
                    >
                      Send
                    </button>
                  </div>

                  {/* Mentions Dropdown */}
                  {showMentions && (
                    <div className="absolute bottom-full mb-2 w-64 bg-white rounded-lg border border-gray-200 shadow-lg">
                      <div className="p-2">
                        {filteredUsers.length === 0 ? (
                          <div className="text-sm text-gray-500 p-2">No users found</div>
                        ) : (
                          filteredUsers.map(user => (
                            <button
                              key={user.id}
                              onClick={() => handleMentionSelect(user)}
                              className="w-full flex items-center p-2 hover:bg-gray-50 rounded-md"
                            >
                              <div className="h-6 w-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-medium">
                                {user.avatar}
                              </div>
                              <span className="ml-2 text-sm font-medium text-gray-900">
                                {user.name}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightsView; 