'use client';

/**
 * Parking Lot Main Page
 * Personal productivity module for timeless idea capture
 * Cmd+Shift+P to capture anytime
 */

import { useState, useEffect } from 'react';
import { Plus, Inbox, Loader2, AlertCircle } from 'lucide-react';
import ParkingLotCaptureModal from '@/components/parking-lot/ParkingLotCaptureModal';
import ParkingLotCard from '@/components/parking-lot/ParkingLotCard';
import ParkingLotFilters from '@/components/parking-lot/ParkingLotFilters';
import ParkingLotBrainstormModal from '@/components/parking-lot/ParkingLotBrainstormModal';
import ParkingLotExpansionView from '@/components/parking-lot/ParkingLotExpansionView';
import {
  useParkingLotItems,
  useParkingLotCategories,
  useArchiveParkingLotItem,
  useDeleteParkingLotItem
} from '@/lib/hooks/useParkingLot';
import type { ParkingLotItem, CaptureMode, ParkingLotStatus } from '@/types/parking-lot';

interface FilterState {
  modes: CaptureMode[];
  categories: string[];
  minReadiness: number | null;
  status: ParkingLotStatus | null;
  sortBy: 'readiness' | 'created' | 'updated';
}

export default function ParkingLotPage() {
  // UI State
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [brainstormItem, setBrainstormItem] = useState<ParkingLotItem | null>(null);
  const [expansionItem, setExpansionItem] = useState<ParkingLotItem | null>(null);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    modes: [],
    categories: [],
    minReadiness: null,
    status: 'active',
    sortBy: 'readiness'
  });

  // Data fetching
  const { data: categoriesData } = useParkingLotCategories();
  const { data, isLoading, error, refetch } = useParkingLotItems({
    mode: filters.modes.length > 0 ? filters.modes[0] : undefined,
    categories: filters.categories.length > 0 ? filters.categories : undefined,
    status: filters.status || undefined,
    minReadiness: filters.minReadiness || undefined,
    sortBy: filters.sortBy
  });

  // Mutations
  const archiveMutation = useArchiveParkingLotItem();
  const deleteMutation = useDeleteParkingLotItem();

  // Global keyboard shortcut: Cmd+Shift+P or Ctrl+Shift+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setShowCaptureModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers
  const handleBrainstorm = (item: ParkingLotItem) => {
    setBrainstormItem(item);
  };

  const handleConvert = async () => {
    // For now, navigate to workflows page
    // In full implementation, would show workflow selection modal
    try {
      // This would need actual workflow config ID
      // For MVP, just show alert
      alert('Workflow conversion coming soon! This will let you select a workflow template and pre-fill data from this parking lot item.');
    } catch (error) {
      console.error('Failed to convert item:', error);
    }
  };

  const handleArchive = async (item: ParkingLotItem) => {
    try {
      await archiveMutation.mutateAsync(item.id);
      refetch();
    } catch (error) {
      console.error('Failed to archive item:', error);
    }
  };

  const handleDelete = async (item: ParkingLotItem) => {
    if (!confirm('Are you sure you want to delete this item? This cannot be undone.')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(item.id);
      refetch();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleCardClick = (item: ParkingLotItem) => {
    if (item.expanded_analysis) {
      setExpansionItem(item);
    }
  };

  const handleCaptureSuccess = () => {
    refetch();
  };

  const handleBrainstormComplete = () => {
    refetch();
    setBrainstormItem(null);
  };

  // Available categories for filter
  const availableCategories = categoriesData?.categories.map(c => c.name) || [];

  // Items
  const items = data?.items || [];
  const total = data?.total || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-4xl">🅿️</span>
                Parking Lot
              </h1>
              <p className="mt-2 text-gray-600">
                Capture ideas instantly. Let AI organize and surface them at the right time.
              </p>
            </div>
            <button
              onClick={() => setShowCaptureModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Capture Idea</span>
              <kbd className="hidden sm:inline-block ml-2 px-2 py-1 bg-blue-700 rounded text-xs opacity-80">
                {typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}⇧P
              </kbd>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6">
          <ParkingLotFilters
            filters={filters}
            onChange={setFilters}
            availableCategories={availableCategories}
          />
        </div>

        {/* Items Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading your ideas...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Failed to load parking lot items</h3>
              <p className="text-sm text-red-700">{error.message}</p>
              <button
                onClick={() => refetch()}
                className="mt-3 text-sm font-medium text-red-600 hover:text-red-700"
              >
                Try again
              </button>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <Inbox className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No ideas yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {filters.status !== 'active' || filters.modes.length > 0 || filters.categories.length > 0 || filters.minReadiness !== null
                ? 'No items match your current filters. Try adjusting the filters above.'
                : 'Start capturing your ideas! Press Cmd+Shift+P (or Ctrl+Shift+P) anytime to capture.'}
            </p>
            {filters.status === 'active' && filters.modes.length === 0 && (
              <button
                onClick={() => setShowCaptureModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Capture Your First Idea</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Count */}
            <div className="mb-4 text-sm text-gray-600">
              Showing {items.length} {items.length === 1 ? 'item' : 'items'}
              {total !== items.length && ` of ${total} total`}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((item) => (
                <ParkingLotCard
                  key={item.id}
                  item={item}
                  onBrainstorm={handleBrainstorm}
                  onConvert={handleConvert}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                  onClick={handleCardClick}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <ParkingLotCaptureModal
        isOpen={showCaptureModal}
        onClose={() => setShowCaptureModal(false)}
        onSuccess={handleCaptureSuccess}
      />

      <ParkingLotBrainstormModal
        item={brainstormItem}
        isOpen={brainstormItem !== null}
        onClose={() => setBrainstormItem(null)}
        onComplete={handleBrainstormComplete}
      />

      <ParkingLotExpansionView
        item={expansionItem!}
        isOpen={expansionItem !== null}
        onClose={() => setExpansionItem(null)}
        onConvertToWorkflow={handleConvert}
      />
    </div>
  );
}
