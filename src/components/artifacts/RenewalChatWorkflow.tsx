"use client";

import React, { useState } from 'react';
import { CheckSquare, Square, MessageCircle, User, Bot, TrendingUp, Send, Save, Mail } from 'lucide-react';

// Type definitions
type StepType = 'greeting' | 'checklist' | 'contractReview' | 'pricingStrategy' | 'contactConfirmation' | 'draftMessage' | 'summary' | 'finalWrapUp';

type CheckedTasks = {
  reviewContract: boolean;
  setTargetPrice: boolean;
  establishPricing: boolean;
  confirmContacts: boolean;
  sendNotice: boolean;
};

type EmailContent = {
  to: string;
  subject: string;
  body: string;
};

const RenewalChatWorkflow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<StepType>('greeting');
  const [checkedTasks, setCheckedTasks] = useState<CheckedTasks>({
    reviewContract: false,
    setTargetPrice: false,
    establishPricing: false,
    confirmContacts: false,
    sendNotice: false
  });
  const [emailContent, setEmailContent] = useState<EmailContent>({
    to: 'eric.estrada@techflowindustries.com',
    subject: 'TechFlow Industries - Renewal Planning & Important Updates',
    body: 'Hi Eric,\n\nI hope this email finds you well. As we approach TechFlow Industries\' renewal date of April 1st, I wanted to reach out to discuss some important updates and coordinate our renewal planning.\n\nBest regards,\nJustin'
  });

  const customer = {
    name: "TechFlow Industries",
    renewalDate: "April 1st",
    daysUntilRenewal: 90,
    notificationRequirement: 90,
    daysToDecide: 5
  };

  const handleStartPlanning = () => {
    setCurrentStep('checklist');
  };

  const ChatMessage: React.FC<{ isAI: boolean; children: React.ReactNode }> = ({ isAI, children }) => (
    <div className={`flex gap-3 mb-4 ${isAI ? '' : 'flex-row-reverse'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        isAI ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
      }`}>
        {isAI ? <Bot size={16} /> : <User size={16} />}
      </div>
      <div className={`max-w-lg p-3 rounded-lg ${
        isAI ? 'bg-white border border-gray-200' : 'bg-blue-600 text-white'
      }`}>
        {children}
      </div>
    </div>
  );

  const ActionButtons: React.FC<{ buttons: Array<{ label: string; primary: boolean; onClick: () => void }> }> = ({ buttons }) => (
    <div className="flex gap-2 mt-3">
      {buttons.map((button, index) => (
        <button
          key={index}
          onClick={button.onClick}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            button.primary 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {button.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col h-full">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Process Steps</h3>
        <div className="space-y-2 flex-1">
          <div className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${
            currentStep === 'greeting' 
              ? 'bg-blue-100 border-2 border-blue-300 text-blue-900' 
              : 'bg-gray-50 border border-gray-200 text-gray-700'
          }`}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-blue-500 text-white">
              1
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">Start Planning</div>
            </div>
            <div className="text-lg opacity-60">👋</div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="border-b border-gray-200 pb-4 mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Renewal Planning - Task Mode</h2>
                <p className="text-sm text-gray-600 mt-1">{customer.name} • {customer.daysUntilRenewal} days until renewal</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Initial Greeting */}
              <ChatMessage isAI>
                <div>
                  <p className="mb-2">
                    Hi Justin! <strong>{customer.name}</strong> renewal is coming up on <strong>{customer.renewalDate}</strong>, 
                    which means it's time for us to start doing some planning.
                  </p>
                  <p className="text-sm text-gray-600">
                    We have about <strong>{customer.daysToDecide} days</strong> to decide if we're going to attempt any price modifications, 
                    as their contract requires {customer.notificationRequirement} days notice for price increases.
                  </p>
                </div>
                
                {currentStep === 'greeting' && (
                  <ActionButtons buttons={[
                    { label: 'Yes, let\'s get started', primary: true, onClick: handleStartPlanning },
                    { label: 'Not right now', primary: false, onClick: () => {} },
                    { label: 'Skip this account', primary: false, onClick: () => {} }
                  ]} />
                )}
              </ChatMessage>

              {/* Checklist Step */}
              {currentStep === 'checklist' && (
                <ChatMessage isAI>
                  <div>
                    <p className="mb-2">Great! Let's review what we need to accomplish:</p>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-3">
                      <h4 className="font-medium text-gray-900 mb-3">Planning Checklist:</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 cursor-pointer">
                          <Square size={18} className="text-gray-400" />
                          <span className="text-sm text-gray-800">Review the contract terms</span>
                        </div>
                        <div className="flex items-center gap-3 cursor-pointer">
                          <Square size={18} className="text-gray-400" />
                          <span className="text-sm text-gray-800">Set our target price</span>
                        </div>
                        <div className="flex items-center gap-3 cursor-pointer">
                          <Square size={18} className="text-gray-400" />
                          <span className="text-sm text-gray-800">Establish our initial pricing strategy</span>
                        </div>
                        <div className="flex items-center gap-3 cursor-pointer">
                          <Square size={18} className="text-gray-400" />
                          <span className="text-sm text-gray-800">Confirm our contacts</span>
                        </div>
                        <div className="flex items-center gap-3 cursor-pointer">
                          <Square size={18} className="text-gray-400" />
                          <span className="text-sm text-gray-800">Send out the renewal notice</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">Ready to start with the contract review?</p>
                  </div>
                  <ActionButtons buttons={[
                    { label: 'Yes, let\'s review the contract', primary: true, onClick: () => setCurrentStep('contractReview') },
                    { label: 'Skip to pricing', primary: false, onClick: () => setCurrentStep('pricingStrategy') },
                    { label: 'Back to dashboard', primary: false, onClick: () => {} }
                  ]} />
                </ChatMessage>
              )}

              {/* Contract Review Step */}
              {currentStep === 'contractReview' && (
                <ChatMessage isAI>
                  <div>
                    <p className="mb-3">Perfect! Let's review the contract for {customer.name}.</p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">📄 Contract Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Current Term:</span>
                          <span className="font-medium">Annual</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Renewal Date:</span>
                          <span className="font-medium">{customer.renewalDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Price Change Notice:</span>
                          <span className="font-medium text-red-600">90 days required</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Auto-renewal:</span>
                          <span className="font-medium">Yes</span>
                        </div>
                      </div>
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                        ⚠️ <strong>Key Finding:</strong> We need to notify them of any price increases before 90 days. 
                        I don't see anything else that would impact our ability to renew them.
                      </div>
                    </div>
                  </div>
                  <ActionButtons buttons={[
                    { label: 'Continue to pricing strategy', primary: true, onClick: () => setCurrentStep('pricingStrategy') },
                    { label: 'I have questions about the contract', primary: false, onClick: () => {} },
                    { label: 'Back to checklist', primary: false, onClick: () => setCurrentStep('checklist') }
                  ]} />
                </ChatMessage>
              )}

              {/* Pricing Strategy Step */}
              {currentStep === 'pricingStrategy' && (
                <ChatMessage isAI>
                  <div>
                    <p className="mb-3">Now let's analyze the pricing strategy for {customer.name}. I've pulled together the key metrics:</p>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-green-900 mb-3">💰 Pricing Analysis</h4>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-white p-3 rounded border">
                          <div className="text-gray-600 text-xs font-medium">CURRENT PRICE</div>
                          <div className="text-lg font-bold text-gray-900">$12,500</div>
                          <div className="text-xs text-gray-500">Annual</div>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <div className="text-gray-600 text-xs font-medium">VALUE PERCENTILE</div>
                          <div className="text-lg font-bold text-red-600">30%</div>
                          <div className="text-xs text-red-500">Below 70% of similar customers</div>
                        </div>
                      </div>

                      <div className="bg-blue-100 border border-blue-300 rounded p-3">
                        <div className="text-blue-900 text-sm font-medium mb-2">🎯 RECOMMENDATION</div>
                        <div className="text-sm text-blue-800">
                          <div className="flex justify-between items-center mb-2">
                            <span>Suggested price increase:</span>
                            <span className="font-bold text-lg">3%</span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span>New annual price:</span>
                            <span className="font-bold">$12,875</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ActionButtons buttons={[
                    { label: 'Accept this recommendation', primary: true, onClick: () => setCurrentStep('contactConfirmation') },
                    { label: 'Adjust pricing strategy', primary: false, onClick: () => {} },
                    { label: 'Skip price increase', primary: false, onClick: () => {} },
                    { label: 'Back to contract', primary: false, onClick: () => setCurrentStep('contractReview') }
                  ]} />
                </ChatMessage>
              )}

              {/* Contact Confirmation Step */}
              {currentStep === 'contactConfirmation' && (
                <ChatMessage isAI>
                  <div>
                    <p className="mb-3">Great! Now let's confirm our contacts and plan our outreach strategy.</p>
                    
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
                      <h4 className="font-medium text-purple-900 mb-3">👥 Contact Strategy</h4>
                      
                      <div className="bg-white p-4 rounded border">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-medium text-gray-900">Sarah Chen</div>
                            <div className="text-sm text-gray-600">VP of Operations</div>
                            <div className="text-xs text-gray-500">sarah.chen@techflowindustries.com</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Last Meeting</div>
                            <div className="text-sm font-medium text-red-600">9 months ago</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-100 border border-blue-300 rounded p-3">
                        <div className="text-blue-900 text-sm font-medium mb-2">📋 RECOMMENDED STRATEGY</div>
                        <div className="text-sm text-blue-800 space-y-2">
                          <div><strong>Approach:</strong> Schedule meeting while sending price notification</div>
                          <div><strong>Goal:</strong> Establish rapport before renewal</div>
                          <div><strong>Timing:</strong> Within 5 days (notification deadline)</div>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mt-3">
                      Would you like to proceed with this strategy and draft the notification email with meeting request?
                    </p>
                  </div>
                  
                  <ActionButtons buttons={[
                    { label: 'Yes, draft the email', primary: true, onClick: () => setCurrentStep('draftMessage') },
                    { label: 'No, I want to modify the approach', primary: false, onClick: () => {} },
                    { label: 'Skip meeting request', primary: false, onClick: () => {} },
                    { label: 'Back to pricing', primary: false, onClick: () => setCurrentStep('pricingStrategy') }
                  ]} />
                </ChatMessage>
              )}

              {/* Draft Message Step */}
              {currentStep === 'draftMessage' && (
                <>
                  <ChatMessage isAI>
                    <div>
                      <p className="mb-3">Perfect! I've drafted the email notification with meeting request for Eric Estrada. Feel free to edit any part of the message directly in the email composer below:</p>
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        <strong>Note:</strong> This email includes the 3% price increase notification and three specific meeting time options. 
                        You can edit the message directly and either save it to drafts or send it immediately.
                      </div>
                    </div>
                  </ChatMessage>

                  <div className="mt-4">
                    <div className="bg-white border border-gray-300 rounded-lg shadow-lg">
                      <div className="bg-gray-50 border-b border-gray-300 px-4 py-3 rounded-t-lg">
                        <div className="flex items-center gap-2">
                          <Mail size={18} className="text-gray-600" />
                          <span className="font-medium text-gray-900">Compose Email</span>
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <label className="text-sm font-medium text-gray-700 w-12">To:</label>
                          <input
                            type="email"
                            value={emailContent.to}
                            onChange={(e) => setEmailContent(prev => ({ ...prev, to: e.target.value }))}
                            className="flex-1 p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="text-sm font-medium text-gray-700 w-12">Subject:</label>
                          <input
                            type="text"
                            value={emailContent.subject}
                            onChange={(e) => setEmailContent(prev => ({ ...prev, subject: e.target.value }))}
                            className="flex-1 p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Message:</label>
                          <textarea
                            value={emailContent.body}
                            onChange={(e) => setEmailContent(prev => ({ ...prev, body: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded text-sm resize-y h-40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                            style={{ lineHeight: '1.5' }}
                          />
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                          <div className="text-xs text-gray-500">
                            This email will be sent from your connected email account
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => alert('Email saved to drafts!')}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 text-sm flex items-center gap-2"
                            >
                              <Save size={16} />
                              Save Draft
                            </button>
                            <button
                              onClick={() => {
                                alert('Email sent!');
                                setCurrentStep('summary');
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm flex items-center gap-2"
                            >
                              <Send size={16} />
                              Send Email
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Summary Step */}
              {currentStep === 'summary' && (
                <ChatMessage isAI>
                  <div>
                    <p className="mb-3">Great! Let me show you our summary and make sure everything looks good:</p>
                    
                    <div className="bg-white border border-gray-300 rounded-lg shadow-lg">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-300 px-6 py-4 rounded-t-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <CheckSquare size={20} className="text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Renewal Planning Summary</h3>
                            <p className="text-sm text-gray-600">TechFlow Industries - Complete Action Plan</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6 space-y-6">
                        <section>
                          <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs">✓</span>
                            Process Completed
                          </h4>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Contract Review:</span>
                                  <span className="font-medium text-green-600">✓ Complete</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Pricing Strategy:</span>
                                  <span className="font-medium text-green-600">✓ 3% Increase Approved</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Contact Strategy:</span>
                                  <span className="font-medium text-green-600">✓ Updated to Eric Estrada</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Price Notification:</span>
                                  <span className="font-medium text-green-600">✓ Sent</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Meeting Request:</span>
                                  <span className="font-medium text-green-600">✓ Sent</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">New Price:</span>
                                  <span className="font-medium text-blue-600">$12,875</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </section>
                      </div>
                    </div>
                  </div>
                  <ActionButtons buttons={[
                    { label: 'This looks good', primary: true, onClick: () => setCurrentStep('finalWrapUp') },
                    { label: 'Make adjustments', primary: false, onClick: () => setCurrentStep('contactConfirmation') },
                    { label: 'Review email again', primary: false, onClick: () => setCurrentStep('draftMessage') }
                  ]} />
                </ChatMessage>
              )}

              {/* Final Wrap-up Step */}
              {currentStep === 'finalWrapUp' && (
                <ChatMessage isAI>
                  <div>
                    <p className="mb-3">Perfect! All action items have been queued for execution. Here's your confirmation:</p>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                      <h4 className="font-medium text-green-900 mb-3">✅ Tasks Initiated</h4>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Salesforce contact updated to Eric Estrada</span>
                          <span className="text-xs text-gray-500 ml-auto">Completing now...</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Follow-up reminder scheduled for October 8th</span>
                          <span className="text-xs text-gray-500 ml-auto">Active</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Email engagement tracking activated</span>
                          <span className="text-xs text-gray-500 ml-auto">Monitoring</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-lg font-medium text-gray-900 mt-6 mb-2">
                      Great work on TechFlow Industries! Are you ready to move on to the next task?
                    </p>
                    <p className="text-sm text-gray-600">
                      You can continue with the next customer or return to the dashboard to review other accounts.
                    </p>
                  </div>
                  <ActionButtons buttons={[
                    { label: 'Yes, next customer', primary: true, onClick: () => {
                      setCurrentStep('greeting');
                      alert('Loading next customer...');
                    }},
                    { label: 'Back to Dashboard', primary: false, onClick: () => alert('Returning to dashboard...') },
                    { label: 'Review This Account', primary: false, onClick: () => setCurrentStep('summary') }
                  ]} />
                </ChatMessage>
              )}
            </div>

            {/* Progress Indicator */}
            {currentStep !== 'finalWrapUp' && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Planning Stage</span>
                  <span>Step {
                    currentStep === 'greeting' ? '1' : 
                    currentStep === 'checklist' ? '2' : 
                    currentStep === 'contractReview' ? '3' : 
                    currentStep === 'pricingStrategy' ? '4' : 
                    currentStep === 'contactConfirmation' ? '5' :
                    currentStep === 'draftMessage' ? '6' : '7'
                  } of 6</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${
                        currentStep === 'greeting' ? '16' : 
                        currentStep === 'checklist' ? '33' : 
                        currentStep === 'contractReview' ? '50' : 
                        currentStep === 'pricingStrategy' ? '66' : 
                        currentStep === 'contactConfirmation' ? '83' :
                        currentStep === 'draftMessage' ? '100' : '100'
                      }%` 
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenewalChatWorkflow;