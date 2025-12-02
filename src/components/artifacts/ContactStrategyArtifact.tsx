"use client";

import React, { useState } from 'react';
import {
  User, Mail, Edit2, UserX, RefreshCw, Check, Building, Briefcase, Code, Clock,
  TrendingUp, AlertCircle, Linkedin, Calendar, Sparkles, Target, MessageCircle,
  Zap, Award, Bell, ChevronDown, ChevronUp, ExternalLink, Heart, ThumbsUp
} from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';

// INTEL-enriched contact data
export interface ContactINTEL {
  // Personality & Communication
  personality?: {
    discStyle?: 'D' | 'I' | 'S' | 'C'; // Dominance, Influence, Steadiness, Conscientiousness
    communicationStyle?: string;
    decisionMaking?: string;
    motivators?: string[];
  };
  // Recent Activity & Events
  recentActivity?: {
    type: 'linkedin' | 'news' | 'role_change' | 'company_event' | 'engagement';
    title: string;
    date: string;
    summary: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    source?: string;
  }[];
  // Buyer Persona
  buyerPersona?: {
    archetype: string;
    priorities: string[];
    painPoints: string[];
    influenceLevel: 'decision_maker' | 'influencer' | 'evaluator' | 'end_user';
  };
  // Relationship Intelligence
  relationship?: {
    strength: number; // 0-100
    sentiment: 'champion' | 'supporter' | 'neutral' | 'skeptic' | 'blocker';
    lastPositiveInteraction?: string;
    riskFactors?: string[];
  };
  // Recommended Talking Points
  talkingPoints?: string[];
  // Key Topics of Interest
  topicsOfInterest?: string[];
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  type: 'business' | 'executive' | 'technical';
  lastMeeting: string;
  meetingStatus: 'recent' | 'overdue' | 'none';
  strategy: string;
  updates?: string;
  // INTEL enrichment
  intel?: ContactINTEL;
  linkedinUrl?: string;
  photoUrl?: string;
}

export interface ContactStrategyProps {
  title?: string;
  subtitle?: string;
  contacts: Contact[];
  onContactUpdate?: (contactId: string, contact: Contact) => void;
  onContactRemove?: (contactId: string) => void;
  onContactReplace?: (contactId: string, newContact: Contact) => void;
  onAcceptStrategy?: () => void;
  onNewStrategy?: () => void;
  showActions?: boolean;
  isLoading?: boolean;
}

const ContactStrategyArtifact: React.FC<ContactStrategyProps> = React.memo(({
  title = "Contact Strategy Review",
  subtitle = "Review and update your primary contacts for this account",
  contacts: initialContacts = [],
  onContactUpdate,
  onContactRemove,
  onContactReplace,
  onAcceptStrategy,
  onNewStrategy,
  showActions = true,
  isLoading = false
}) => {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts || []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Contact | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleExpanded = (contactId: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(contactId)) {
        next.delete(contactId);
      } else {
        next.add(contactId);
      }
      return next;
    });
  };

  // Helper: Sentiment styling
  const getSentimentConfig = (sentiment: 'champion' | 'supporter' | 'neutral' | 'skeptic' | 'blocker') => {
    const configs = {
      champion: { bg: 'bg-green-100', text: 'text-green-700', label: 'Champion', icon: <Heart size={12} className="text-green-600" /> },
      supporter: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Supporter', icon: <ThumbsUp size={12} className="text-blue-600" /> },
      neutral: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Neutral', icon: <User size={12} className="text-gray-500" /> },
      skeptic: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Skeptic', icon: <AlertCircle size={12} className="text-amber-600" /> },
      blocker: { bg: 'bg-red-100', text: 'text-red-700', label: 'Blocker', icon: <AlertCircle size={12} className="text-red-600" /> },
    };
    return configs[sentiment] || configs.neutral;
  };

  // Helper: DISC personality style
  const getDISCStyle = (disc: 'D' | 'I' | 'S' | 'C') => {
    const styles = {
      D: { bg: 'bg-red-100', text: 'text-red-700' },      // Dominance - Red
      I: { bg: 'bg-yellow-100', text: 'text-yellow-700' }, // Influence - Yellow
      S: { bg: 'bg-green-100', text: 'text-green-700' },   // Steadiness - Green
      C: { bg: 'bg-blue-100', text: 'text-blue-700' },     // Conscientiousness - Blue
    };
    return styles[disc];
  };

  // Helper: Activity type styling
  const getActivityStyle = (type: 'linkedin' | 'news' | 'role_change' | 'company_event' | 'engagement') => {
    const styles = {
      linkedin: { border: 'border-blue-400', bg: 'bg-blue-50', icon: <Linkedin size={12} className="text-blue-600 flex-shrink-0" /> },
      news: { border: 'border-purple-400', bg: 'bg-purple-50', icon: <Bell size={12} className="text-purple-600 flex-shrink-0" /> },
      role_change: { border: 'border-amber-400', bg: 'bg-amber-50', icon: <Award size={12} className="text-amber-600 flex-shrink-0" /> },
      company_event: { border: 'border-green-400', bg: 'bg-green-50', icon: <Calendar size={12} className="text-green-600 flex-shrink-0" /> },
      engagement: { border: 'border-indigo-400', bg: 'bg-indigo-50', icon: <Zap size={12} className="text-indigo-600 flex-shrink-0" /> },
    };
    return styles[type] || styles.engagement;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateContact = (contact: Contact): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!contact.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!contact.role.trim()) {
      errors.role = 'Role is required';
    }

    if (!contact.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(contact.email)) {
      errors.email = 'Please enter a valid email address';
    }

    return errors;
  };

  const getContactTypeConfig = (type: Contact['type']) => {
    switch (type) {
      case 'executive':
        return {
          icon: Briefcase,
          bgColor: 'bg-purple-100',
          borderColor: 'border-purple-300',
          textColor: 'text-purple-900',
          iconColor: 'text-purple-600',
          label: 'Executive Contact'
        };
      case 'business':
        return {
          icon: Building,
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-300',
          textColor: 'text-blue-900',
          iconColor: 'text-blue-600',
          label: 'Business Contact'
        };
      case 'technical':
        return {
          icon: Code,
          bgColor: 'bg-green-100',
          borderColor: 'border-green-300',
          textColor: 'text-green-900',
          iconColor: 'text-green-600',
          label: 'Technical Contact'
        };
    }
  };

  const getMeetingStatusConfig = (status: Contact['meetingStatus']) => {
    switch (status) {
      case 'recent':
        return {
          icon: Check,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          label: 'Recent meeting'
        };
      case 'overdue':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          label: 'Meeting overdue'
        };
      case 'none':
        return {
          icon: Clock,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          label: 'No recent meeting'
        };
    }
  };

  const handleEditClick = (contact: Contact) => {
    setEditingId(contact.id);
    setEditForm({ ...contact });
  };

  const handleEditSave = () => {
    if (editForm) {
      const errors = validateContact(editForm);
      setValidationErrors(errors);

      if (Object.keys(errors).length === 0) {
        const updatedContacts = contacts.map(c =>
          c.id === editForm.id ? editForm : c
        );
        setContacts(updatedContacts);
        onContactUpdate?.(editForm.id, editForm);
        setEditingId(null);
        setEditForm(null);
        setValidationErrors({});
      }
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm(null);
    setValidationErrors({});
  };

  const handleRemoveContact = (contactId: string) => {
    const updatedContacts = contacts.filter(c => c.id !== contactId);
    setContacts(updatedContacts);
    onContactRemove?.(contactId);
  };

  const handleReplaceContact = (contactId: string) => {
    // In a real implementation, this would open a contact picker
    const newContact: Contact = {
      id: `new-${Date.now()}`,
      name: 'New Contact',
      role: 'Role',
      email: 'new@example.com',
      type: 'business',
      lastMeeting: 'Never',
      meetingStatus: 'none',
      strategy: 'To be defined',
      updates: 'Newly added contact'
    };

    const updatedContacts = contacts.map(c =>
      c.id === contactId ? newContact : c
    );
    setContacts(updatedContacts);
    onContactReplace?.(contactId, newContact);
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-300 px-6 py-4 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <User size={20} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <LoadingSpinner size="lg" className="mx-auto mb-3" />
              <p className="text-gray-600">Loading contact strategy...</p>
            </div>
          </div>
        )}

        {/* Contact Cards */}
        {!isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {contacts.map((contact) => {
            const typeConfig = getContactTypeConfig(contact.type);
            const meetingConfig = getMeetingStatusConfig(contact.meetingStatus);
            const isEditing = editingId === contact.id;
            const isExpanded = expandedCards.has(contact.id);
            const TypeIcon = typeConfig.icon;
            const MeetingIcon = meetingConfig.icon;
            const intel = contact.intel;

            return (
              <div
                key={contact.id}
                className={`min-w-[280px] border-2 ${typeConfig.borderColor} bg-white rounded-lg transition-all duration-200 hover:shadow-md flex flex-col`}
              >
                {/* Contact Header */}
                <div className={`${typeConfig.bgColor} px-4 py-3 rounded-t-md`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`flex items-center gap-2 px-2 py-0.5 rounded-full bg-white/60 ${typeConfig.textColor}`}>
                      <TypeIcon size={12} className={typeConfig.iconColor} />
                      <span className="text-xs font-medium">{typeConfig.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {contact.linkedinUrl && (
                        <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer"
                           className="p-1 hover:bg-white/50 rounded transition-colors">
                          <Linkedin size={14} className="text-blue-600" />
                        </a>
                      )}
                      {!isEditing && (
                        <button onClick={() => handleEditClick(contact)}
                          className="p-1 hover:bg-white/50 rounded transition-colors" title="Edit contact">
                          <Edit2 size={14} className="text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Contact Name & Role */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center flex-shrink-0 shadow-sm">
                      {contact.photoUrl ? (
                        <img src={contact.photoUrl} alt={contact.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User size={24} className={typeConfig.iconColor} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{contact.name}</h4>
                      <p className="text-sm text-gray-700">{contact.role}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Mail size={11} className="text-gray-500 flex-shrink-0" />
                        <p className="text-xs text-gray-600 truncate">{contact.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Body - Flex grow to push buttons to bottom */}
                <div className="flex-1 p-4 flex flex-col">
                  {isEditing && editForm ? (
                    <div className="space-y-2">
                      <input type="text" value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className={`w-full px-2 py-1 text-sm border rounded ${validationErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                        placeholder="Name" />
                      {validationErrors.name && <p className="text-xs text-red-600">{validationErrors.name}</p>}
                      <input type="text" value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        className={`w-full px-2 py-1 text-sm border rounded ${validationErrors.role ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                        placeholder="Role" />
                      {validationErrors.role && <p className="text-xs text-red-600">{validationErrors.role}</p>}
                      <input type="email" value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className={`w-full px-2 py-1 text-sm border rounded ${validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                        placeholder="Email" />
                      {validationErrors.email && <p className="text-xs text-red-600">{validationErrors.email}</p>}
                      <div className="flex gap-2 pt-2">
                        <button onClick={handleEditSave} className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">Save</button>
                        <button onClick={handleEditCancel} className="flex-1 px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Relationship & Meeting Status Row */}
                      <div className="flex items-center gap-2 mb-3">
                        {intel?.relationship && (
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getSentimentConfig(intel.relationship.sentiment).bg} ${getSentimentConfig(intel.relationship.sentiment).text}`}>
                            {getSentimentConfig(intel.relationship.sentiment).icon}
                            <span>{getSentimentConfig(intel.relationship.sentiment).label}</span>
                          </div>
                        )}
                        <div className={`flex items-center gap-1 px-2 py-1 rounded ${meetingConfig.bgColor}`}>
                          <MeetingIcon size={12} className={meetingConfig.color} />
                          <span className="text-xs">{contact.lastMeeting}</span>
                        </div>
                      </div>

                      {/* INTEL Section - Personality & Communication */}
                      {intel?.personality && (
                        <div className="mb-3 p-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Sparkles size={12} className="text-purple-600" />
                            <span className="text-xs font-semibold text-purple-800">Communication Style</span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            {intel.personality.discStyle && (
                              <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${getDISCStyle(intel.personality.discStyle).bg} ${getDISCStyle(intel.personality.discStyle).text}`}>
                                {intel.personality.discStyle}
                              </span>
                            )}
                            <span className="text-xs text-gray-700">{intel.personality.communicationStyle}</span>
                          </div>
                          {intel.personality.motivators && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {intel.personality.motivators.slice(0, 3).map((m, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-white/70 rounded text-xs text-purple-700">{m}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Recent Activity Feed */}
                      {intel?.recentActivity && intel.recentActivity.length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Bell size={12} className="text-blue-600" />
                            <span className="text-xs font-semibold text-gray-700">Recent Activity</span>
                          </div>
                          <div className="space-y-1.5">
                            {intel.recentActivity.slice(0, isExpanded ? 5 : 2).map((activity, i) => (
                              <div key={i} className={`p-2 rounded border-l-2 ${getActivityStyle(activity.type).border} ${getActivityStyle(activity.type).bg}`}>
                                <div className="flex items-start gap-2">
                                  {getActivityStyle(activity.type).icon}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-800 truncate">{activity.title}</p>
                                    <p className="text-xs text-gray-600 line-clamp-2">{activity.summary}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{activity.date}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Talking Points */}
                      {intel?.talkingPoints && intel.talkingPoints.length > 0 && (
                        <div className="mb-3 p-2 bg-green-50 rounded-lg border border-green-100">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <MessageCircle size={12} className="text-green-600" />
                            <span className="text-xs font-semibold text-green-800">Suggested Talking Points</span>
                          </div>
                          <ul className="space-y-1">
                            {intel.talkingPoints.slice(0, isExpanded ? 4 : 2).map((point, i) => (
                              <li key={i} className="text-xs text-green-700 flex items-start gap-1.5">
                                <span className="text-green-500 mt-0.5">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Strategy (original) */}
                      <div className="border-t border-gray-200 pt-2 mb-3">
                        <div className="flex items-center gap-1 mb-1">
                          <Target size={12} className="text-indigo-600" />
                          <span className="text-xs font-semibold text-gray-700">Engagement Strategy</span>
                        </div>
                        <p className="text-xs text-gray-600">{contact.strategy}</p>
                      </div>

                      {/* Expand/Collapse for more details */}
                      {(intel?.recentActivity?.length || 0) > 2 || (intel?.talkingPoints?.length || 0) > 2 ? (
                        <button
                          onClick={() => toggleExpanded(contact.id)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-3"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {isExpanded ? 'Show less' : 'Show more insights'}
                        </button>
                      ) : null}

                      {/* Spacer to push buttons to bottom */}
                      <div className="flex-1" />

                      {/* Contact Actions - Fixed at bottom */}
                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <button onClick={() => handleReplaceContact(contact.id)}
                          className="flex-1 px-2 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 flex items-center justify-center gap-1 whitespace-nowrap"
                          title="Switch contact">
                          <RefreshCw size={12} />
                          Switch
                        </button>
                        <button onClick={() => handleRemoveContact(contact.id)}
                          className="flex-1 px-2 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 flex items-center justify-center gap-1 whitespace-nowrap"
                          title="Remove contact">
                          <UserX size={12} />
                          Remove
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}

        {/* Global Actions */}
        {showActions && !isLoading && (
          <>
            <div className="border-t border-gray-200 pt-4 mb-4">
              <p className="text-lg font-medium text-gray-900 mb-2">Ready to proceed with this contact strategy?</p>
              <p className="text-sm text-gray-600">
                You can accept the recommended strategy and reach out to these contacts, or request a new strategy.
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={onAcceptStrategy}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Check size={16} />
                Accept Strategy & Reach Out
              </button>

              <button
                onClick={onNewStrategy}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Generate New Strategy
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

ContactStrategyArtifact.displayName = 'ContactStrategyArtifact';

export default ContactStrategyArtifact;