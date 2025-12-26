'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import CreatableSelect from 'react-select/creatable';
import AddCustomWordModal from './AddCustomWordModal';
import { useToast } from './Toast';
import { MoodPill } from './MoodPill';
import TaskModal from './TaskModal';
import { useSidebar } from './SidebarContext';
import NewEntryConfirmationModal from './NewEntryConfirmationModal';
import LazyMoodSelector, { LazyMoodSelectorRef } from './LazyMoodSelector';



interface Task {
  id: number;
  task: string;
  description?: string;
  taskStatus: {
    id: number;
    name: string;
  };
  taskPriority?: {
    id: number;
    name: string;
  };
  createdDate: string;
}

interface Mood {
  id: number | string;
  name: string;
  pillStatus?: 'red' | 'yellow' | 'green' | 'grey' | 'user';
  canPromote?: boolean;
  userMoodId?: number;
  type?: string;
  status?: string;
}

interface MoodLoadingState {
  loading: boolean;
  error: string | null;
  retryCount: number;
  lastRetryTime: number | null;
}

interface EntryPanelProps {
  subject: string;
  setSubject: (subject: string) => void;
  selectedMoods: { value: number | string; label: string }[];
  setSelectedMoods: (moods: { value: number | string; label: string }[]) => void;
  moodContext: string;
  setMoodContext: (context: string) => void;
  satisfaction: number;
  setSatisfaction: (satisfaction: number) => void;
  moods: Mood[];

  moodLoadingState?: MoodLoadingState;
  onRetryMoodLoading?: () => void;
  wordCount: number;
  charCount: number;
  lastSaved: string;
  setWritingMode: (mode: boolean) => void;
  isReadOnly?: boolean;
  entryId?: number;
  onSaveDraft?: () => Promise<void>;
  onPublishEntry?: () => Promise<void>;
  onDiscardEntry?: () => void;
  hasUnsavedChanges?: boolean;
}

export default function EntryPanel({
  subject,
  setSubject,
  selectedMoods,
  setSelectedMoods,
  moodContext,
  setMoodContext,
  satisfaction,
  setSatisfaction,
  moods,
  moodLoadingState,
  onRetryMoodLoading,
  wordCount,
  charCount,
  lastSaved,
  setWritingMode,
  isReadOnly = false,
  entryId,
  onSaveDraft,
  onPublishEntry,
  onDiscardEntry,
  hasUnsavedChanges = false
}: EntryPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editSection, setEditSection] = useState<string | null>(null);
  const [entryTasks, setEntryTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [suggestModalOpen, setSuggestModalOpen] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [definingMood, setDefiningMood] = useState<{ id: number; name: string } | null>(null);
  const [newMoodName, setNewMoodName] = useState<string>('');
  
  // Sidebar context for resizing
  const { rightSidebarWidth, setRightSidebarWidth, isModalExpanded, setIsModalExpanded } = useSidebar();
  
  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  
  // Ref for LazyMoodSelector to trigger refresh
  const moodSelectorRef = useRef<LazyMoodSelectorRef>(null);
  
  // Toast notifications
  const { showToast } = useToast();

  useEffect(() => {
    console.log('[EntryPanel] Rendered with moods:', moods);
    console.log('[EntryPanel] Rendered with selectedMoods:', selectedMoods);
    console.log('[EntryPanel] Moods length:', moods.length);
    console.log('[EntryPanel] SelectedMoods length:', selectedMoods.length);
  }, [moods, selectedMoods]);

  // Fetch entry tasks when entryId changes
  useEffect(() => {
    if (entryId) {
      fetchEntryTasks();
    }
  }, [entryId]);

  const fetchEntryTasks = async () => {
    if (!entryId) return;
    
    setLoadingTasks(true);
    try {
      const response = await fetch(`/api/tasks?entryId=${entryId}`);
      if (response.ok) {
        const tasks = await response.json();
        setEntryTasks(tasks);
      }
    } catch (error) {
      console.error('Error fetching entry tasks:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    console.log('[EntryPanel] editSection:', editSection);
  }, [editSection]);

  useEffect(() => {
    console.log('[EntryPanel] suggestModalOpen state changed:', suggestModalOpen);
  }, [suggestModalOpen]);

  useEffect(() => {
    console.log('[EntryPanel] newMoodName state changed:', newMoodName);
  }, [newMoodName]);

  const handleTaskCreated = (newTask: Task) => {
    // Add the new task to the existing tasks
    setEntryTasks(prev => [newTask, ...prev]);
    setShowTaskModal(false);
    // Optionally show a success toast
    showToast('Task created successfully', 'success');
  };

  const handleMoodDefinition = (mood: { id: number; name: string }) => {
    setDefiningMood(mood);
  };

  const handleDefinitionSubmit = async (result: any) => {
    showToast(result.message || 'Mood defined successfully!', 'success');
    setDefiningMood(null);
    // Refresh moods if needed
    // onRetryMoodLoading?.();
  };

  const handleDefinitionClose = () => {
    setDefiningMood(null);
  };

  // Handle mouse move during resize
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizingRef.current) return;
    
    const newWidth = window.innerWidth - e.clientX;
    setRightSidebarWidth(newWidth);
  }, [setRightSidebarWidth]);

  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    isResizingRef.current = false;
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // Handle mouse down on resize handle
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Handle modal expansion
  useEffect(() => {
    if (showTaskModal || suggestModalOpen || definingMood) {
      setIsModalExpanded(true);
    } else {
      setIsModalExpanded(false);
    }
  }, [showTaskModal, suggestModalOpen, definingMood, setIsModalExpanded]);

  return (
    <aside
      ref={resizeRef}
      className={`entry-panel fixed right-0 top-0 h-screen z-40 bg-gray-50/95 backdrop-blur-sm flex flex-col border-l border-gray-200/50
        ${isCollapsed ? 'w-20' : ''}
        ${isResizing ? '' : 'transition-all duration-300'}
      `}
      style={{
        width: isCollapsed ? '80px' : `${rightSidebarWidth + (isModalExpanded ? 300 : 0)}px`
      }}
      aria-label="Entry Panel"
    >
      {/* Collapse/Expand Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`absolute -left-3 top-8 w-6 h-6 rounded-full bg-white shadow-lg border border-gray-200/50 flex items-center justify-center transition-all duration-200 hover:bg-gray-100 hover:shadow-xl z-[100]`}
        aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
      >
        <svg 
          className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          strokeWidth={2} 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Resize Handle */}
      {!isCollapsed && (
        <div
          className={`absolute left-0 top-0 w-3 h-full cursor-col-resize bg-transparent hover:bg-blue-500/20 transition-all duration-200 z-50 ${
            isResizing ? 'bg-blue-500/30' : ''
          }`}
          onMouseDown={handleMouseDown}
          title="Drag to resize sidebar"
        >
          {/* Visual drag indicator */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-20 bg-gray-400 rounded-r-full opacity-60 hover:opacity-100 transition-opacity duration-200"></div>
          {/* Drag dots */}
          <div className="absolute left-0.5 top-1/2 transform -translate-y-1/2 flex flex-col space-y-1">
            <div className="w-0.5 h-0.5 bg-gray-500 rounded-full opacity-60"></div>
            <div className="w-0.5 h-0.5 bg-gray-500 rounded-full opacity-60"></div>
            <div className="w-0.5 h-0.5 bg-gray-500 rounded-full opacity-60"></div>
          </div>
        </div>
      )}

      {/* Panel Content */}
      <div className={`flex-1 p-4 overflow-y-auto transition-all duration-200 mt-[100px] ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="space-y-6">
          {/* Entry Details Header */}
          <div className="-mt-4 pt-[6px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Entry Details</h3>
              {!isReadOnly && (
                <button
                  onClick={() => {
                    // Check if there are unsaved changes
                    if (hasUnsavedChanges && entryId) {
                      setShowNewEntryModal(true);
                    } else {
                      // Navigate directly if no unsaved changes
                      window.location.href = '/entry/new';
                    }
                  }}
                  className="new-entry-icon"
                  title="Create new entry"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Subject, Moods, and Mood Context - formatted display with edit icons */}
          <div className="space-y-4">
            {/* Subject */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="block text-sm font-medium text-gray-700">Subject</span>
                {!isReadOnly && (
                  <button onClick={() => setEditSection('subject')} aria-label="Edit subject" className="ml-2 text-gray-400 hover:text-core-green">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4.243 1.414 1.414-4.243a4 4 0 01.828-1.414z"/></svg>
                  </button>
                )}
              </div>
              {editSection === 'subject' && !isReadOnly ? (
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  onBlur={() => setEditSection(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setEditSection(null);
                    }
                  }}
                  autoFocus
                  onFocus={(e) => {
                    // Position cursor at end of text if there's existing content
                    if (subject.length > 0) {
                      e.target.setSelectionRange(subject.length, subject.length);
                    }
                  }}
                  placeholder="Entry subject..."
                  aria-label="Edit subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-core-green focus:border-transparent text-sm"
                />
              ) : (
                <div 
                  className="text-base text-gray-900 min-h-[1.5em] cursor-pointer"
                  onDoubleClick={() => !isReadOnly && setEditSection('subject')}
                  title={!isReadOnly ? "Double-click to edit" : ""}
                >
                  {subject || <span className="text-gray-400">No subject</span>}
                </div>
              )}
            </div>

            {/* Moods */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="block text-sm font-medium text-gray-700">Mood(s)</span>
                <div className="flex items-center gap-2">
                  {/* Mood loading/error indicator */}
                  {moodLoadingState?.loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" title="Loading moods..."></div>
                  )}
                  {moodLoadingState?.error && (
                    <div className="text-red-500 text-xs" title={moodLoadingState.error}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  {!isReadOnly && (
                    <button onClick={() => setEditSection('moods')} aria-label="Edit moods" className="ml-2 text-gray-400 hover:text-core-green">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4.243 1.414 1.414-4.243a4 4 0 01.828-1.414z"/></svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Mood loading error message and retry button */}
              {moodLoadingState?.error && !moodLoadingState?.loading && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-red-700 text-xs">Failed to load moods</span>
                    </div>
                    {onRetryMoodLoading && (
                      <button
                        onClick={onRetryMoodLoading}
                        disabled={moodLoadingState?.loading}
                        className="text-xs text-red-600 hover:text-red-800 underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-red-600 mt-1">{moodLoadingState.error}</p>
                </div>
              )}

              {editSection === 'moods' && !isReadOnly ? (
                (() => {
                  const moodOptions = moods.map(m => ({ value: m.id, label: m.name }));
                  console.log('[EntryPanel] Mood options for Select:', moodOptions);
                  console.log('[EntryPanel] Current selectedMoods in edit mode:', selectedMoods);
                  return (
                    <div>
                      <LazyMoodSelector
                        ref={moodSelectorRef}
                        instanceId="panel-mood-select"
                        value={selectedMoods}
                        onChange={async (newValue) => {
                          console.log('[EntryPanel] Mood selection changed to:', newValue);
                          setSelectedMoods([...(newValue || [])]);
                          
                          // Refresh moods after a short delay to ensure proper state update
                          setTimeout(() => {
                            console.log('[EntryPanel] Triggering mood refresh...');
                            onRetryMoodLoading?.();
                          }, 100);
                        }}
                        onCreateOption={async (inputValue: string) => {
                          console.log('[EntryPanel] onCreateOption called with:', inputValue);
                          console.log('[EntryPanel] Current state - suggestModalOpen:', suggestModalOpen);
                          console.log('[EntryPanel] Current state - editSection:', editSection);
                          
                          // Store the mood name to pre-fill the modal
                          setNewMoodName(inputValue);
                          console.log('[EntryPanel] Set newMoodName to:', inputValue);
                          
                          // Close the mood edit section first
                          setEditSection(null);
                          
                          // Open the SuggestEmotionModal with the mood name pre-filled
                          setSuggestModalOpen(true);
                          
                          console.log('[EntryPanel] Modal should now be open. Setting suggestModalOpen to true.');
                        }}
                        isMulti
                        isClearable
                        autoFocus
                        onBlur={() => setEditSection(null)}
                        placeholder="Select mood(s)..."
                        className="text-sm"
                        initialPageSize={50}
                        enableVirtualization={true}
                      />
                    </div>
                  );
                })()
              ) : (
                <div>
                  <div 
                    className="flex flex-wrap gap-2 min-h-[1.5em] cursor-pointer"
                    onDoubleClick={() => !isReadOnly && setEditSection('moods')}
                    title={!isReadOnly ? "Double-click to edit moods" : ""}
                  >
                    {selectedMoods.length > 0 ? selectedMoods.map(m => {
                      // Find the full mood data from the moods array
                      const fullMoodData = moods.find(mood => mood.id === m.value);
                      
                      if (fullMoodData) {
                        // Use the full mood data which already includes pill status
                        return (
                          <MoodPill 
                            key={m.value} 
                            mood={{
                              id: typeof fullMoodData.id === 'number' ? fullMoodData.id : parseInt(fullMoodData.id as string, 10),
                              name: fullMoodData.name,
                              pillStatus: (['red', 'yellow', 'green', 'grey', 'user'] as const).includes(fullMoodData.pillStatus as any) ? 
                                fullMoodData.pillStatus as 'red' | 'yellow' | 'green' | 'grey' | 'user' : 'green',
                              canPromote: fullMoodData.canPromote || false,
                              userMoodId: fullMoodData.userMoodId
                            }}

                            onDefine={handleMoodDefinition}
                            showPromoteButton={!isReadOnly}
                          />
                        );
                      } else {
                        // Fallback for when mood data isn't found - determine likely status
                        const numericId = typeof m.value === 'number' ? m.value : parseInt(m.value as string, 10);
                        
                        // Heuristic: if this is a newly created user mood (ID likely > 1000 or not found in global moods)
                        // it's probably a user mood that needs to be displayed as grey/incomplete
                        const isLikelyUserMood = numericId > 1000 || !moods.some(mood => mood.id === numericId && mood.type !== 'user');
                        
                        return (
                          <MoodPill 
                            key={m.value} 
                            mood={{
                              id: numericId,
                              name: m.label,
                              pillStatus: isLikelyUserMood ? 'grey' : 'green',
                              canPromote: isLikelyUserMood,
                              userMoodId: isLikelyUserMood ? numericId : undefined
                            }}

                            onDefine={handleMoodDefinition}
                            showPromoteButton={!isReadOnly}
                          />
                        );
                      }
                    }) : <span className="text-gray-400">No moods selected</span>}
                  </div>
                  {!isReadOnly && (
                    <div className="mt-2">
                      <button
                        onClick={() => setSuggestModalOpen(true)}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Don't see your emotion? Suggest one
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mood Context */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="block text-sm font-medium text-gray-700">Mood Context</span>
                {!isReadOnly && (
                  <button onClick={() => setEditSection('moodContext')} aria-label="Edit mood context" className="ml-2 text-gray-400 hover:text-core-green">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4.243 1.414 1.414-4.243a4 4 0 01.828-1.414z"/></svg>
                  </button>
                )}
              </div>
              {editSection === 'moodContext' && !isReadOnly ? (
                <textarea
                  value={moodContext}
                  onChange={e => setMoodContext(e.target.value)}
                  onBlur={() => setEditSection(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      setEditSection(null);
                    }
                    // Shift+Enter creates a new line (default behavior when not prevented)
                  }}
                  autoFocus
                  onFocus={(e) => {
                    // Position cursor at end of text if there's existing content
                    if (moodContext.length > 0) {
                      e.target.setSelectionRange(moodContext.length, moodContext.length);
                    }
                  }}
                  rows={2}
                  placeholder="Any additional context about your mood..."
                  aria-label="Edit mood context"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-core-green focus:border-transparent text-sm resize-none"
                />
              ) : (
                <div 
                  className="text-base text-gray-900 min-h-[1.5em] whitespace-pre-line cursor-pointer"
                  onDoubleClick={() => !isReadOnly && setEditSection('moodContext')}
                  title={!isReadOnly ? "Double-click to edit" : ""}
                >
                  {moodContext || <span className="text-gray-400">No context</span>}
                </div>
              )}
            </div>
          </div>

          {/* Satisfaction */}
          <div>
            <label htmlFor="panel-satisfaction-range" className="block text-sm font-medium text-gray-700 mb-3">
              Satisfaction (1-10)
            </label>
            <div className="flex items-center">
              <div className="relative flex-1">
                {/* Range track with gradient */}
                <div className="absolute top-1/2 left-0 right-0 h-2 bg-gradient-to-r from-red-300 via-yellow-300 to-green-400 rounded-full transform -translate-y-1/2"></div>
                {/* Range input */}
                <input
                  id="panel-satisfaction-range"
                  type="range"
                  min="1"
                  max="10"
                  value={satisfaction}
                  onChange={e => setSatisfaction(parseInt(e.target.value))}
                  disabled={isReadOnly}
                  className={`relative w-full h-2 bg-transparent appearance-none range-slider ${isReadOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  style={{ 
                    background: 'transparent',
                    zIndex: 0
                  }}
                />
              </div>
              <div className="ml-4 min-w-[2rem] text-center">
                <span className="text-lg font-bold text-core-green bg-white border-2 border-core-green rounded-full w-8 h-8 flex items-center justify-center text-sm">
                  {satisfaction}
                </span>
              </div>
            </div>
          </div>

          {/* Entry Tasks */}
          {entryId && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Entry Tasks</h3>
                {!isReadOnly && (
                  <button
                    onClick={() => setShowTaskModal(true)}
                    className="new-entry-icon"
                    title="Add new task"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {loadingTasks ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-xs text-gray-500 mt-2">Loading tasks...</p>
                  </div>
                ) : entryTasks.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="text-gray-400 text-sm">
                      No tasks yet
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {entryTasks.slice(0, 3).map(task => (
                      <div key={task.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-2 h-2 rounded-full ${
                                task.taskStatus.id === 2 ? 'bg-green-500' : 'bg-gray-300'
                              }`}></div>
                              <h4 className={`text-xs font-medium truncate ${
                                task.taskStatus.id === 2 ? 'line-through text-gray-500' : 'text-gray-900'
                              }`}>
                                {task.task}
                              </h4>
                            </div>
                            {task.description && (
                              <p className="text-xs text-gray-600 line-clamp-1">{task.description}</p>
                            )}
                            <div className="flex items-center gap-1 mt-1">
                              <span className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium ${
                                task.taskStatus.id === 2 ? 'bg-green-100 text-green-800' :
                                task.taskStatus.id === 3 ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {task.taskStatus.name}
                              </span>
                              {task.taskPriority && (
                                <span className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium ${
                                  task.taskPriority.name.toLowerCase() === 'high' ? 'bg-red-100 text-red-800' :
                                  task.taskPriority.name.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {task.taskPriority.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {entryTasks.length > 3 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{entryTasks.length - 3} more tasks
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Entry Actions */}
          <div className="border-t border-gray-200 pt-4">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-gray-700">Entry Actions</h3>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setWritingMode(true)}
                className="w-full text-left px-3 py-2 text-sm text-core-green hover:bg-green-50 rounded-lg transition-colors border border-core-green hover:border-green-600"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Enable Focus Mode
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsed State Icons */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 text-sm">📝</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-600 text-sm">😊</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
            <span className="text-yellow-600 text-sm">📊</span>
          </div>
        </div>
      )}
      
      <AddCustomWordModal
        isOpen={suggestModalOpen}
        onClose={() => {
          setSuggestModalOpen(false);
          setNewMoodName(''); // Clear the stored mood name
        }}
        onMoodAdded={async (result) => {
          console.log('[EntryPanel] AddCustomWordModal onMoodAdded result:', result);
          showToast(result.message || 'Custom mood created successfully', 'success');
          setNewMoodName(''); // Clear the stored mood name
          
          // If a mood was created, refresh the LazyMoodSelector and add to selection
          if (result.mood) {
            // Refresh the LazyMoodSelector to include the new UserMood
            moodSelectorRef.current?.refresh();
            
            // Add to selectedMoods after a brief delay to allow refresh
            setTimeout(() => {
              const newMoodOption = {
                value: result.mood.id, // Use integer ID directly
                label: result.mood.moodName
              };
              console.log('[EntryPanel] Adding newly created mood to selectedMoods:', newMoodOption);
              setSelectedMoods(prev => [...prev, newMoodOption]);
            }, 200);
          }
        }}
        initialMoodName={newMoodName}
      />
      
      {/* Mood Definition Modal */}
      <AddCustomWordModal
        isOpen={!!definingMood}
        onClose={handleDefinitionClose}
        onMoodAdded={handleDefinitionSubmit}
      />
      

      
      {/* Task Modal */}
      {showTaskModal && entryId && (
        <TaskModal
          selectedText=""
          onTaskCreated={handleTaskCreated}
          onClose={() => setShowTaskModal(false)}
          isOpen={showTaskModal}
          entryId={entryId}
        />
      )}
      
      {/* New Entry Confirmation Modal */}
      <NewEntryConfirmationModal
        isOpen={showNewEntryModal}
        onClose={() => setShowNewEntryModal(false)}
        onSaveDraft={async () => {
          if (onSaveDraft) {
            await onSaveDraft();
          }
          setShowNewEntryModal(false);
          window.location.href = '/entry/new';
        }}
        onPublish={async () => {
          if (onPublishEntry) {
            await onPublishEntry();
          }
          setShowNewEntryModal(false);
          window.location.href = '/entry/new';
        }}
        onDiscard={() => {
          if (onDiscardEntry) {
            onDiscardEntry();
          }
          setShowNewEntryModal(false);
          window.location.href = '/entry/new';
        }}
      />
    </aside>
  );
} 