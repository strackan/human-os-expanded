"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertModal, ConfirmModal } from './Modal';

export default function EntryActions({ entryId }: { entryId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Modal states
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
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'info'
  });

  const handleArchive = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Archive Entry',
      message: 'Are you sure you want to archive this entry?',
      onConfirm: async () => {
        setLoading(true);
        const res = await fetch(`/api/entries/${entryId}/archive`, { method: "POST" });
        setLoading(false);
        if (res.ok) {
          // Dispatch event to notify other components of the archive action
          window.dispatchEvent(new CustomEvent('draftsUpdated', { detail: { action: 'archive' } }));
          router.push("/entries");
        } else {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to archive entry.',
            variant: 'error'
          });
        }
      },
      variant: 'warning'
    });
  };

  const handleDelete = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Entry',
      message: 'This will permanently delete the entry. Are you sure?',
      onConfirm: async () => {
        setLoading(true);
        const res = await fetch(`/api/entries/${entryId}`, { method: "DELETE" });
        setLoading(false);
        if (res.ok) {
          // Dispatch event to notify other components of the delete action
          window.dispatchEvent(new CustomEvent('draftsUpdated', { detail: { action: 'delete' } }));
          router.push("/entries");
        } else {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to delete entry.',
            variant: 'error'
          });
        }
      },
      variant: 'danger'
    });
  };

  return (
    <>
      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
      
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
      />
      
      <div className="flex gap-4">
        <button
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
          onClick={handleArchive}
          disabled={loading}
        >
          Archive
        </button>
        <button
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          onClick={handleDelete}
          disabled={loading}
        >
          Delete
        </button>
      </div>
    </>
  );
} 