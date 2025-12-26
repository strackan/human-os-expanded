'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PrivacyProtectionModal from '@/components/PrivacyProtectionModal';

interface Entry {
  id: number;
  title: string;
  content: string;
  sat: number;
  wordcount: number;
  charcount: number;
  mood: string;
  createdDate: string;
  updatedDate: string;
  publishedDate: string | null;
  isPrivate: boolean;
}

interface ArchivedEntry {
  id: number;
  title: string;
  content: string;
  sat: number;
  wordcount: number;
  charcount: number;
  createdDate: string;
  updatedDate: string;
  archivedDate: string;
}

interface DraftEntry {
  id: number;
  title: string;
  content: string;
  sat: number;
  wordcount: number;
  charcount: number;
  createdDate: string;
  updatedDate: string;
}

export default function EntriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [archivedEntries, setArchivedEntries] = useState<ArchivedEntry[]>([]);
  const [draftEntries, setDraftEntries] = useState<DraftEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showArchivedEntries, setShowArchivedEntries] = useState(false);
  const [showDraftEntries, setShowDraftEntries] = useState(false);
  const [archivedEntriesLoaded, setArchivedEntriesLoaded] = useState(false);
  const [draftEntriesLoaded, setDraftEntriesLoaded] = useState(false);
  
  // Privacy modal state
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [selectedEntryPrivate, setSelectedEntryPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check for success parameter
    const success = searchParams.get('success');
    if (success === 'save') {
      setShowSuccessMessage(true);
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
    
    fetchEntries();
  }, [searchParams]);

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/entries');
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
      } else {
        setError('Failed to fetch entries');
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
      setError('Failed to fetch entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedEntries = async () => {
    setArchivedLoading(true);
    try {
      const response = await fetch('/api/entries/archived');
      if (response.ok) {
        const data = await response.json();
        setArchivedEntries(data.entries || []);
        setArchivedEntriesLoaded(true);
      } else {
        console.error('Failed to fetch archived entries');
      }
    } catch (error) {
      console.error('Error fetching archived entries:', error);
    } finally {
      setArchivedLoading(false);
    }
  };

  const fetchDraftEntries = async () => {
    setDraftsLoading(true);
    try {
      const response = await fetch('/api/entries/drafts');
      if (response.ok) {
        const data = await response.json();
        setDraftEntries(data.drafts || []);
        setDraftEntriesLoaded(true);
      } else {
        console.error('Failed to fetch draft entries');
      }
    } catch (error) {
      console.error('Error fetching draft entries:', error);
    } finally {
      setDraftsLoading(false);
    }
  };

  const handleShowArchivedEntries = () => {
    if (!archivedEntriesLoaded) {
      fetchArchivedEntries();
    }
    setShowArchivedEntries(true);
  };

  const handleShowDraftEntries = () => {
    if (!draftEntriesLoaded) {
      fetchDraftEntries();
    }
    setShowDraftEntries(true);
  };

  const handleContinueDraft = (draftId: number) => {
    router.push(`/entry/${draftId}`);
  };

  const handleDeleteDraft = async (draftId: number) => {
    if (!confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/entries/${draftId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from draft entries
        setDraftEntries(draftEntries.filter(entry => entry.id !== draftId));
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('draftsUpdated', { detail: { action: 'delete' } }));
      } else {
        const errorData = await response.json();
        alert(`Failed to delete draft: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
      alert('Failed to delete draft');
    }
  };

  const handleRestoreEntry = async (entryId: number) => {
    if (!confirm('Are you sure you want to restore this entry to published?')) {
      return;
    }

    try {
      const response = await fetch(`/api/entries/${entryId}/restore`, {
        method: 'POST',
      });

      if (response.ok) {
        // Remove from archived entries
        setArchivedEntries(archivedEntries.filter(entry => entry.id !== entryId));
        // Refresh published entries to show the restored entry
        fetchEntries();
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('draftsUpdated', { detail: { action: 'restore' } }));
      } else {
        const errorData = await response.json();
        alert(`Failed to restore entry: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error restoring entry:', error);
      alert('Failed to restore entry');
    }
  };

  const handleDeleteArchivedEntry = async (entryId: number) => {
    if (!confirm('Are you sure you want to permanently delete this entry? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/entries/${entryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from archived entries
        setArchivedEntries(archivedEntries.filter(entry => entry.id !== entryId));
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('draftsUpdated', { detail: { action: 'delete' } }));
      } else {
        const errorData = await response.json();
        alert(`Failed to delete entry: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry');
    }
  };

  const handlePrivacyToggle = (entryId: number, isCurrentlyPrivate: boolean) => {
    setSelectedEntryId(entryId);
    setSelectedEntryPrivate(isCurrentlyPrivate);
    setShowPrivacyModal(true);
  };

  const handleSetPrivacy = async (password: string) => {
    if (!selectedEntryId) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/entries/${selectedEntryId}/privacy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'set-privacy',
          password: password
        }),
      });

      if (response.ok) {
        // Update the entry in the local state
        setEntries(entries.map(entry => 
          entry.id === selectedEntryId 
            ? { ...entry, isPrivate: true }
            : entry
        ));
        setShowPrivacyModal(false);
        setSelectedEntryId(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set privacy');
      }
    } catch (error) {
      console.error('Error setting privacy:', error);
      throw error; // Re-throw to be handled by the modal
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePrivacy = async (password: string) => {
    if (!selectedEntryId) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/entries/${selectedEntryId}/privacy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'remove-privacy',
          password: password
        }),
      });

      if (response.ok) {
        // Update the entry in the local state
        setEntries(entries.map(entry => 
          entry.id === selectedEntryId 
            ? { ...entry, isPrivate: false }
            : entry
        ));
        setShowPrivacyModal(false);
        setSelectedEntryId(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove privacy');
      }
    } catch (error) {
      console.error('Error removing privacy:', error);
      throw error; // Re-throw to be handled by the modal
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (entryId: number) => {
    if (!confirm('Are you sure you want to archive this entry?')) {
      return;
    }

    try {
      const response = await fetch(`/api/entries/${entryId}/archive`, {
        method: 'POST',
      });

      if (response.ok) {
        // Remove the entry from the list (it's now archived)
        setEntries(entries.filter(entry => entry.id !== entryId));
        // If archived entries are currently shown, refresh them
        if (showArchivedEntries && archivedEntriesLoaded) {
          fetchArchivedEntries();
        }
        // Dispatch event to notify other components of the archive action
        window.dispatchEvent(new CustomEvent('draftsUpdated', { detail: { action: 'archive' } }));
      } else {
        const errorData = await response.json();
        alert(`Failed to archive entry: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error archiving entry:', error);
      alert('Failed to archive entry');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').substring(0, 100) + (html.length > 100 ? '...' : '');
  };

  if (loading) {
    return (
      <div className="h-full bg-main-bg">
        <div className="h-full p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading entries...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-main-bg">
        <div className="h-full p-6">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchEntries}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-main-bg">
      <div className="h-full p-6">
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <strong>Success!</strong> Your entry has been saved successfully.
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Entry History</h1>
          <Link 
            href="/entry/new"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            New Entry
          </Link>
        </div>

        {/* Published Entries Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Published Entries</h2>
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-4">No published entries found</p>
              <Link 
                href="/entry/new"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Create Your First Entry
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preview
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mood
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Satisfaction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stats
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Private
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(entry.updatedDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {entry.title || 'No subject'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                          {entry.isPrivate ? (
                            <span className="italic text-gray-400">🔒 Private content</span>
                          ) : (
                            stripHtml(entry.content)
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.mood || 'No mood'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.sat}/10
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.wordcount} words, {entry.charcount} chars
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <label className="flex items-center cursor-pointer">
                            <div className="relative">
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={entry.isPrivate}
                                onChange={() => handlePrivacyToggle(entry.id, entry.isPrivate)}
                              />
                              <div className={`block w-10 h-6 rounded-full transition-colors ${
                                entry.isPrivate ? 'bg-red-500' : 'bg-gray-300'
                              }`}>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                                  entry.isPrivate ? 'translate-x-4' : 'translate-x-0'
                                }`}></div>
                              </div>
                            </div>
                            <span className="ml-2 text-xs">
                              {entry.isPrivate ? '🔒 Private' : '🔓 Public'}
                            </span>
                          </label>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => router.push(`/entry/${entry.id}/view`)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleArchive(entry.id)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              Archive
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Archived Entries Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-2xl font-semibold">Archived Entries</h2>
            {!showArchivedEntries ? (
              <button
                onClick={handleShowArchivedEntries}
                className="text-blue-600 hover:text-blue-800 underline"
                disabled={archivedLoading}
              >
                {archivedLoading ? 'Loading...' : 'Show'}
              </button>
            ) : (
              <button
                onClick={() => setShowArchivedEntries(false)}
                className="text-gray-600 hover:text-gray-800 underline"
              >
                Hide
              </button>
            )}
          </div>

          {showArchivedEntries && (
            <>
              {archivedLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading archived entries...</p>
                </div>
              ) : archivedEntries.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-600">No archived entries found</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subject
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Preview
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Satisfaction
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stats
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Archived Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {archivedEntries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {entry.title || 'Untitled Entry'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                              {stripHtml(entry.content) || 'No content'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.sat}/10
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.wordcount} words, {entry.charcount} chars
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(entry.archivedDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => router.push(`/entry/${entry.id}/view`)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleRestoreEntry(entry.id)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Restore
                                </button>
                                <button
                                  onClick={() => handleDeleteArchivedEntry(entry.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Draft Entries Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-2xl font-semibold">Drafts</h2>
            {!showDraftEntries ? (
              <button
                onClick={handleShowDraftEntries}
                className="text-blue-600 hover:text-blue-800 underline"
                disabled={draftsLoading}
              >
                {draftsLoading ? 'Loading...' : 'Show'}
              </button>
            ) : (
              <button
                onClick={() => setShowDraftEntries(false)}
                className="text-gray-600 hover:text-gray-800 underline"
              >
                Hide
              </button>
            )}
          </div>

          {showDraftEntries && (
            <>
              {draftsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading drafts...</p>
                </div>
              ) : draftEntries.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-600">No drafts found. Start a new entry to save as a draft.</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Updated
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subject
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Preview
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Mood
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Satisfaction
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stats
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {draftEntries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(entry.updatedDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {entry.title || 'Untitled Draft'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                              {stripHtml(entry.content) || 'No content'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.mood || 'No mood'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.sat}/10
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.wordcount} words, {entry.charcount} chars
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleContinueDraft(entry.id)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Continue
                                </button>
                                <button
                                  onClick={() => handleDeleteDraft(entry.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Privacy Protection Modal */}
      <PrivacyProtectionModal
        isOpen={showPrivacyModal}
        onClose={() => {
          setShowPrivacyModal(false);
          setSelectedEntryId(null);
        }}
        onSetPrivacy={handleSetPrivacy}
        onRemovePrivacy={handleRemovePrivacy}
        isCurrentlyPrivate={selectedEntryPrivate}
      />
    </div>
  );
} 