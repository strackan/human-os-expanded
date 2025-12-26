'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ConfirmModal, AlertModal } from '@/components/Modal';
import PrivacyProtectionModal from '@/components/PrivacyProtectionModal';

interface Mood {
  id: number;
  name: string;
}

interface Entry {
  id: number;
  subject: string;
  content: string;
  moodContext: string;
  satisfaction: number;
  wordCount: number;
  charCount: number;
  status: string;
  createdDate: string;
  updatedDate: string;
  publishedDate?: string;
  moodIds: number[];
  moods: Mood[];
  isPrivate: boolean;
  hasBreakGlass: boolean;
}

export default function ViewEntryPage() {
  const router = useRouter();
  const params = useParams();
  const entryId = params.id as string;
  const { user } = useAuth();
  
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Privacy modal state
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info'
  });

  useEffect(() => {
    const loadEntry = async () => {
      if (!entryId) return;
      
      try {
        const response = await fetch(`/api/entries/${entryId}`);
        if (!response.ok) {
          throw new Error('Failed to load entry');
        }
        
        const data = await response.json();
        setEntry(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load entry');
      } finally {
        setLoading(false);
      }
    };

    loadEntry();
  }, [entryId]);

  const handleEdit = () => {
    setShowEditConfirm(true);
  };

  const handleConfirmEdit = async () => {
    setEditLoading(true);
    
    try {
      const response = await fetch(`/api/entries/${entryId}/unpublish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to unpublish entry');
      }

      // Successfully unpublished, redirect to edit page
      router.push(`/entry/${entryId}`);
    } catch (error) {
      setEditLoading(false);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to unpublish entry. Please try again.',
        variant: 'error'
      });
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    
    try {
      const response = await fetch(`/api/entries/${entryId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete entry');
      }

      // Dispatch event to notify other components of the delete action
      window.dispatchEvent(new CustomEvent('draftsUpdated', { detail: { action: 'delete' } }));

      // Successfully deleted, redirect to entries page
      router.push('/entries');
    } catch (error) {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete entry. Please try again.',
        variant: 'error'
      });
    }
  };

  const handleSetPrivacy = async (password: string) => {
    try {
      const response = await fetch(`/api/entries/${entryId}/privacy`, {
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
        // Update the entry privacy status
        setEntry(prev => prev ? { ...prev, isPrivate: true } : null);
        setShowPrivacyModal(false);
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'Entry privacy protection has been enabled.',
          variant: 'success'
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set privacy');
      }
    } catch (error) {
      console.error('Error setting privacy:', error);
      throw error; // Re-throw to be handled by the modal
    }
  };

  const handleRemovePrivacy = async (password: string) => {
    try {
      const response = await fetch(`/api/entries/${entryId}/privacy`, {
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
        // Update the entry privacy status
        setEntry(prev => prev ? { ...prev, isPrivate: false } : null);
        setShowPrivacyModal(false);
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'Entry privacy protection has been removed.',
          variant: 'success'
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove privacy');
      }
    } catch (error) {
      console.error('Error removing privacy:', error);
      throw error; // Re-throw to be handled by the modal
    }
  };

  const handleBack = () => {
    router.push('/entries');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading entry...</p>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Entry Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The entry you requested could not be found.'}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Back to Entries
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Entries
              </button>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                entry.status === 'Published' 
                  ? 'bg-green-100 text-green-800'
                  : entry.status === 'Draft'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {entry.status}
              </span>
              {entry.isPrivate && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  🔒 Private
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              {/* Privacy Link */}
              <button
                onClick={() => setShowPrivacyModal(true)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  entry.isPrivate 
                    ? 'text-red-600 hover:text-red-700 hover:bg-red-50' 
                    : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                }`}
              >
                {entry.isPrivate ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Remove Lock
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    Lock Entry
                  </>
                )}
              </button>

              {entry.status === 'Published' && (
                <>
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Entry
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Entry
                  </button>
                </>
              )}
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {entry.subject || 'Untitled Entry'}
          </h1>
          
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span>📅 Created: {formatDate(entry.createdDate)}</span>
            <span>🔄 Updated: {formatDate(entry.updatedDate)}</span>
            {entry.publishedDate && (
              <span>📰 Published: {formatDate(entry.publishedDate)}</span>
            )}
            <span>📝 {entry.wordCount} words</span>
            <span>📊 Satisfaction: {entry.satisfaction}/10</span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="prose max-w-none">
            {entry.content ? (
              <div dangerouslySetInnerHTML={{ __html: entry.content }} />
            ) : (
              <p className="text-gray-500 italic">No content available</p>
            )}
          </div>
        </div>

        {/* Moods & Context */}
        {(entry.moods.length > 0 || entry.moodContext) && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Emotional Context</h2>
            
            {entry.moods.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Moods</h3>
                <div className="flex flex-wrap gap-2">
                  {entry.moods.map((mood) => (
                    <span
                      key={mood.id}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {mood.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {entry.moodContext && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Context</h3>
                <p className="text-gray-600">{entry.moodContext}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Privacy Protection Modal */}
      <PrivacyProtectionModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onSetPrivacy={handleSetPrivacy}
        onRemovePrivacy={handleRemovePrivacy}
        isCurrentlyPrivate={entry?.isPrivate || false}
      />

      {/* Confirm Edit Modal */}
      <ConfirmModal
        isOpen={showEditConfirm}
        onClose={() => setShowEditConfirm(false)}
        onConfirm={handleConfirmEdit}
        title="Edit Published Entry"
        message="This will change the entry status from Published to Draft so you can edit it. The entry will no longer be published until you publish it again. Are you sure you want to continue?"
        confirmText={editLoading ? 'Processing...' : 'Yes, Edit Entry'}
        cancelText="Cancel"
        variant="warning"
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Entry Permanently"
        message="⚠️ WARNING: This will permanently delete this entry from the database. This action cannot be undone. All content, moods, and metadata will be lost forever. Are you absolutely sure you want to proceed?"
        confirmText={deleteLoading ? 'Deleting...' : 'Yes, Delete Permanently'}
        cancelText="Cancel"
        variant="danger"
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
    </div>
  );
} 