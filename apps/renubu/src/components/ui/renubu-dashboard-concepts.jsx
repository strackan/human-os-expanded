import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Calendar, Target, Heart, Sparkles, TrendingUp, Users, MessageSquare, Bell, X, Maximize2, CheckCircle2, Play, Mail, Clock, Database, CalendarPlus } from 'lucide-react';

const RenubuDashboard = () => {
  const [expandedCards, setExpandedCards] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [quickActionTab, setQuickActionTab] = useState('starters');
  const [workflowView, setWorkflowView] = useState('category');
  const [quickActionPopout, setQuickActionPopout] = useState(null);

  const toggleCard = (cardId) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const openTaskMode = (workflow) => {
    setSelectedWorkflow(workflow);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-8">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600"></div>
          <span className="text-gray-400 text-sm">renubu</span>
        </div>
        <div className="flex items-center gap-6">
          <Calendar className="w-5 h-5 text-gray-400" />
          <Bell className="w-5 h-5 text-gray-400 hover:text-purple-500 cursor-pointer transition-colors" />
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-500"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Greeting */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-light text-gray-700">Good morning, Justin</h1>
          <p className="text-sm text-gray-400">Sunday, October 12 • 72°F Sunny</p>
        </div>

        {/* Today's Priority Workflow - Opens Task Mode */}
        <div 
          onClick={() => openTaskMode('Complete Strategic Account Plan for Obsidian Black')}
          className="bg-white rounded-3xl p-10 border border-gray-200 shadow-lg cursor-pointer hover:shadow-xl transition-all group relative"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-purple-500" />
              <span className="text-sm text-gray-500 uppercase tracking-wide">Today's Priority Workflow</span>
            </div>
            {/* Subtle Launch Icon */}
            <div className="flex items-center gap-2 text-gray-400 group-hover:text-purple-500 transition-colors">
              <Play className="w-5 h-5 fill-current" />
              <span className="text-xs font-medium">Launch Task Mode</span>
            </div>
          </div>
          <h2 className="text-2xl text-gray-800 mb-4 group-hover:text-purple-600 transition-colors">
            Complete Strategic Account Plan for Obsidian Black
          </h2>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium">Critical</span>
            <span>Due: Today</span>
            <span>•</span>
            <span>$2.4M ARR</span>
          </div>
        </div>

        {/* Two Columns */}
        <div className="grid grid-cols-2 gap-6">
          {/* Today's Workflows - Left */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-lg text-gray-700">Today's Workflows</h3>
                  <p className="text-sm text-gray-400">3 of 10 complete</p>
                </div>
              </div>
              <button 
                onClick={() => toggleCard('workflows')}
                className="text-gray-400 hover:text-gray-600"
              >
                {expandedCards['workflows'] ? 
                  <ChevronDown className="w-5 h-5" /> : 
                  <ChevronRight className="w-5 h-5" />
                }
              </button>
            </div>

            {/* RYG Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Progress</span>
                <span className="text-xs font-medium text-gray-600">30%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="flex h-full">
                  <div className="bg-green-500 h-2" style={{width: '30%'}}></div>
                  <div className="bg-red-200 h-2" style={{width: '70%'}}></div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Complete all 10 to hit your daily goal</p>
            </div>

            {/* Expanded View */}
            {expandedCards['workflows'] && (
              <div className="mt-4 animate-fadeIn">
                <div className="flex gap-2 mb-4 border-b border-gray-200">
                  <button
                    onClick={() => setWorkflowView('category')}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      workflowView === 'category'
                        ? 'text-purple-600 border-b-2 border-purple-600 -mb-px'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    By Category
                  </button>
                  <button
                    onClick={() => setWorkflowView('list')}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      workflowView === 'list'
                        ? 'text-purple-600 border-b-2 border-purple-600 -mb-px'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    By Workflow
                  </button>
                </div>

                {/* Category View */}
                {workflowView === 'category' && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'Check-ins', complete: true, count: 0 },
                      { name: 'Renewals', complete: true, count: 0 },
                      { name: 'Expansion', complete: true, count: 0 },
                      { name: 'Health Scores', complete: false, count: 2 },
                      { name: 'Follow-ups', complete: false, count: 1 },
                      { name: 'Pricing', complete: false, count: 2 },
                      { name: 'Onboarding', complete: false, count: 1 },
                      { name: 'QBRs', complete: false, count: 1 }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => !item.complete && openTaskMode(item.name)}
                        className={`p-4 rounded-xl border transition-all text-left ${
                          item.complete 
                            ? 'bg-green-50 border-green-200 cursor-default' 
                            : 'bg-gray-50 border-gray-200 hover:border-purple-300 hover:shadow-sm cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm text-gray-700">{item.name}</p>
                          {item.complete ? (
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          ) : (
                            <Maximize2 className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          {item.complete ? 'Complete' : `${item.count} pending`}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Workflow List View */}
                {workflowView === 'list' && (
                  <div className="space-y-2">
                    {[
                      { customer: 'Obsidian Black', workflow: 'Strategic Account Plan', priority: 'Critical', complete: false },
                      { customer: 'DataViz Corp', workflow: 'Expansion Discovery', priority: 'High', complete: false },
                      { customer: 'Acme Industries', workflow: 'Health Score Review', priority: 'High', complete: false },
                      { customer: 'TechFlow Inc', workflow: 'Renewal Prep', priority: 'Medium', complete: true },
                      { customer: 'InnovateCo', workflow: 'QBR Planning', priority: 'Medium', complete: false },
                      { customer: 'CloudSync', workflow: 'Check-in', priority: 'Low', complete: true },
                      { customer: 'NexGen Solutions', workflow: 'Pricing Review', priority: 'Medium', complete: false },
                    ].slice(0, 10).map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => !item.complete && openTaskMode(`${item.workflow} - ${item.customer}`)}
                        className={`w-full p-3 rounded-xl border transition-all text-left ${
                          item.complete
                            ? 'bg-green-50 border-green-200 opacity-60 cursor-default'
                            : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-sm cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 font-medium truncate">{item.customer}</p>
                            <p className="text-xs text-gray-500">{item.workflow}</p>
                          </div>
                          <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                            item.priority === 'Critical' ? 'bg-red-50 text-red-600' :
                            item.priority === 'High' ? 'bg-orange-50 text-orange-600' :
                            item.priority === 'Medium' ? 'bg-yellow-50 text-yellow-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {item.priority}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions - Right */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-purple-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-purple-600 font-medium">Quick Actions</span>
              </div>
              <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 transition-colors">
                <CheckCircle2 className="w-4 h-4" />
                <span>check in</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl">
              {[
                { id: 'starters', label: 'Starters' },
                { id: 'plans', label: 'Plans' },
                { id: 'noticed', label: 'Noticed' },
                { id: 'mystuff', label: 'My Stuff' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setQuickActionTab(tab.id)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    quickActionTab === tab.id
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-3">
              {quickActionTab === 'starters' && (
                <div className="animate-fadeIn space-y-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickActionPopout({
                        title: 'DataViz Corp mentioned expansion',
                        context: 'Based on LinkedIn activity, Sarah Chen posted about scaling their analytics team by 50% next quarter.',
                        customer: 'DataViz Corp',
                        contact: 'Sarah Chen, VP Analytics'
                      });
                    }}
                    className="w-full p-4 bg-purple-50 rounded-xl border border-purple-100 hover:border-purple-300 hover:shadow-sm transition-all text-left"
                  >
                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 mb-1">DataViz Corp mentioned expansion</p>
                        <p className="text-xs text-gray-500">Based on LinkedIn activity</p>
                      </div>
                    </div>
                  </button>
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 mb-1">Acme Corp new VP of Engineering</p>
                        <p className="text-xs text-gray-500">Opportunity to reconnect</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {quickActionTab === 'plans' && (
                <div className="animate-fadeIn space-y-3">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-start gap-3">
                      <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 mb-1">Obsidian Black: Account Plan</p>
                        <p className="text-xs text-gray-500">Due today • Critical</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-start gap-3">
                      <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 mb-1">TechFlow: Renewal Strategy</p>
                        <p className="text-xs text-gray-500">Due this week</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {quickActionTab === 'noticed' && (
                <div className="animate-fadeIn space-y-3">
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 mb-1">DataViz usage up 40%</p>
                        <p className="text-xs text-gray-500">Expansion signal detected</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 mb-1">CloudSync: 3 support tickets</p>
                        <p className="text-xs text-gray-500">May need check-in</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {quickActionTab === 'mystuff' && (
                <div className="animate-fadeIn space-y-3">
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="flex items-start gap-3">
                      <Heart className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 mb-1">Inbox Zero Progress</p>
                        <div className="mt-2 w-full bg-purple-200 rounded-full h-1.5">
                          <div className="bg-purple-500 h-1.5 rounded-full" style={{width: '68%'}}></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">68% of days this quarter</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* When You're Ready */}
        <div className="text-center py-8">
          <button 
            onClick={() => toggleCard('belowFold')}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-2"
          >
            <span>When you're ready</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${expandedCards['belowFold'] ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Below the Fold */}
        {expandedCards['belowFold'] && (
          <div className="grid grid-cols-4 gap-4 pt-4 animate-fadeIn">
            <button className="p-5 bg-white/40 rounded-2xl border border-gray-200 text-left hover:bg-white/60 transition-all group">
              <TrendingUp className="w-5 h-5 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="text-sm font-medium text-gray-700 mb-1">Performance</h4>
              <p className="text-xs text-gray-400">Revenue metrics</p>
            </button>
            <button className="p-5 bg-white/40 rounded-2xl border border-gray-200 text-left hover:bg-white/60 transition-all group">
              <Heart className="w-5 h-5 text-red-400 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="text-sm font-medium text-gray-700 mb-1">Customer Health</h4>
              <p className="text-xs text-gray-400">Portfolio overview</p>
            </button>
            <button className="p-5 bg-white/40 rounded-2xl border border-gray-200 text-left hover:bg-white/60 transition-all group">
              <Target className="w-5 h-5 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="text-sm font-medium text-gray-700 mb-1">Reports</h4>
              <p className="text-xs text-gray-400">Analytics</p>
            </button>
            <button className="p-5 bg-white/40 rounded-2xl border border-gray-200 text-left hover:bg-white/60 transition-all group">
              <Users className="w-5 h-5 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="text-sm font-medium text-gray-700 mb-1">Team Activity</h4>
              <p className="text-xs text-gray-400">Peer insights</p>
            </button>
          </div>
        )}
      </div>

      {/* Task Mode Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-8 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-gray-800">Task Mode</h3>
                  <p className="text-sm text-gray-500">{selectedWorkflow}</p>
                </div>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto max-h-[calc(90vh-160px)]">
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                      <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                      Workflow Steps
                    </h4>
                    <div className="space-y-3">
                      {[
                        { title: 'Review Account Health', desc: 'Check usage metrics and engagement', status: 'complete' },
                        { title: 'Identify Expansion Opportunities', desc: 'Analyze feature adoption', status: 'current' },
                        { title: 'Draft Strategic Recommendations', desc: 'Create data-driven recommendations', status: 'pending' },
                        { title: 'Schedule Executive Review', desc: 'Set up presentation', status: 'pending' }
                      ].map((step, idx) => (
                        <div key={idx} className={`p-5 rounded-xl border-2 transition-all ${
                          step.status === 'complete' ? 'bg-green-50 border-green-200' :
                          step.status === 'current' ? 'bg-purple-50 border-purple-300 shadow-md' :
                          'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-start gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              step.status === 'complete' ? 'bg-green-500' :
                              step.status === 'current' ? 'bg-purple-500' :
                              'bg-gray-300'
                            }`}>
                              {step.status === 'complete' ? (
                                <CheckCircle2 className="w-5 h-5 text-white" />
                              ) : (
                                <span className="text-sm font-medium text-white">{idx + 1}</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <h5 className="text-sm font-medium text-gray-800 mb-1">{step.title}</h5>
                              <p className="text-sm text-gray-600">{step.desc}</p>
                            </div>
                            {step.status === 'current' && (
                              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                                Continue
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-purple-50 rounded-2xl p-5 border border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      <h4 className="text-sm font-medium text-gray-700">AI Insights</h4>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Usage has grown 45% this quarter. Advanced analytics adoption suggests readiness for enterprise upgrade.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Account Context</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">ARR</p>
                        <p className="text-gray-800 font-medium">$2.4M</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Health Score</p>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <p className="text-gray-800">78/100</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <button 
                onClick={() => setModalOpen(false)}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
              >
                Close
              </button>
              <div className="flex gap-3">
                <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-medium">
                  Save Draft
                </button>
                <button className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium">
                  Mark Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};

export default RenubuDashboard;