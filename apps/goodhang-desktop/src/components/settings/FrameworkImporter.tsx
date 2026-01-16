/**
 * Framework Importer Component
 *
 * Allows users to import frameworks, methodologies, and key content.
 * Human OS will reference these when helping the user.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Lock,
  FileText,
  Search,
  Loader2,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/stores/auth';

// =============================================================================
// TYPES
// =============================================================================

type FrameworkVisibility = 'public' | 'gated' | 'private';
type FrameworkType =
  | 'methodology'
  | 'framework'
  | 'playbook'
  | 'principles'
  | 'template'
  | 'notes'
  | 'book_notes'
  | 'other';

interface UserFramework {
  id: string;
  title: string;
  description?: string;
  frameworkType: FrameworkType;
  content: string;
  visibility: FrameworkVisibility;
  sourceTitle?: string;
  sourceUrl?: string;
  sourceAuthor?: string;
  tags: string[];
  wordCount?: number;
  timesReferenced: number;
  createdAt: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const frameworkTypeLabels: Record<FrameworkType, string> = {
  methodology: 'Methodology',
  framework: 'Framework',
  playbook: 'Playbook',
  principles: 'Principles',
  template: 'Template',
  notes: 'Notes',
  book_notes: 'Book Notes',
  other: 'Other',
};

const visibilityOptions: Array<{
  value: FrameworkVisibility;
  label: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    value: 'public',
    label: 'Public',
    description: 'Can quote and reference openly',
    icon: Eye,
  },
  {
    value: 'gated',
    label: 'Gated',
    description: 'Reference but ask before quoting',
    icon: EyeOff,
  },
  {
    value: 'private',
    label: 'Private',
    description: 'Never expose externally',
    icon: Lock,
  },
];

// =============================================================================
// FRAMEWORK CARD
// =============================================================================

interface FrameworkCardProps {
  framework: UserFramework;
  onEdit: () => void;
  onDelete: () => void;
}

function FrameworkCard({ framework, onEdit, onDelete }: FrameworkCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } catch {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const VisibilityIcon = visibilityOptions.find((v) => v.value === framework.visibility)?.icon || Eye;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-gh-dark-700 border border-gh-dark-600 rounded-lg p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-gh-dark-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-white font-medium truncate">{framework.title}</h4>
            {framework.description && (
              <p className="text-sm text-gray-400 line-clamp-2 mt-0.5">{framework.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs text-gray-500 bg-gh-dark-600 px-2 py-0.5 rounded">
                {frameworkTypeLabels[framework.frameworkType]}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <VisibilityIcon className="w-3 h-3" />
                {framework.visibility}
              </span>
              {framework.wordCount && (
                <span className="text-xs text-gray-500">{framework.wordCount.toLocaleString()} words</span>
              )}
              {framework.timesReferenced > 0 && (
                <span className="text-xs text-green-400">
                  Referenced {framework.timesReferenced}x
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 hover:bg-gh-dark-600 rounded transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4 text-gray-400" />
          </button>

          {showDeleteConfirm ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 bg-red-900/50 hover:bg-red-900/70 rounded transition-colors"
                title="Confirm delete"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 text-red-400" />
                )}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="p-1.5 hover:bg-gh-dark-600 rounded transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 hover:bg-red-900/30 rounded transition-colors group"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
            </button>
          )}
        </div>
      </div>

      {framework.sourceTitle && (
        <div className="mt-3 pt-3 border-t border-gh-dark-600 text-xs text-gray-500">
          Source: {framework.sourceTitle}
          {framework.sourceAuthor && ` by ${framework.sourceAuthor}`}
        </div>
      )}
    </motion.div>
  );
}

// =============================================================================
// IMPORT MODAL
// =============================================================================

interface ImportModalProps {
  framework?: UserFramework;
  onSave: (data: Partial<UserFramework>) => Promise<void>;
  onClose: () => void;
}

function ImportModal({ framework, onSave, onClose }: ImportModalProps) {
  const [title, setTitle] = useState(framework?.title || '');
  const [description, setDescription] = useState(framework?.description || '');
  const [content, setContent] = useState(framework?.content || '');
  const [frameworkType, setFrameworkType] = useState<FrameworkType>(
    framework?.frameworkType || 'framework'
  );
  const [visibility, setVisibility] = useState<FrameworkVisibility>(
    framework?.visibility || 'gated'
  );
  const [sourceTitle, setSourceTitle] = useState(framework?.sourceTitle || '');
  const [sourceAuthor, setSourceAuthor] = useState(framework?.sourceAuthor || '');
  const [sourceUrl, setSourceUrl] = useState(framework?.sourceUrl || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        content: content.trim(),
        frameworkType,
        visibility,
        sourceTitle: sourceTitle.trim() || undefined,
        sourceAuthor: sourceAuthor.trim() || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gh-dark-800 border border-gh-dark-600 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gh-dark-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            {framework ? 'Edit Framework' : 'Import Framework'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gh-dark-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., EOS Traction Model"
              className="w-full bg-gh-dark-700 border border-gh-dark-600 rounded-lg px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this framework"
              className="w-full bg-gh-dark-700 border border-gh-dark-600 rounded-lg px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Type and Visibility */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
              <select
                value={frameworkType}
                onChange={(e) => setFrameworkType(e.target.value as FrameworkType)}
                className="w-full bg-gh-dark-700 border border-gh-dark-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {Object.entries(frameworkTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as FrameworkVisibility)}
                className="w-full bg-gh-dark-700 border border-gh-dark-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {visibilityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} - {opt.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Content *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your framework, methodology, or key content here. Markdown is supported."
              rows={10}
              className="w-full bg-gh-dark-700 border border-gh-dark-600 rounded-lg px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              {content.split(/\s+/).filter(Boolean).length.toLocaleString()} words
            </p>
          </div>

          {/* Source Attribution */}
          <div className="border-t border-gh-dark-700 pt-4">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Source (Optional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  value={sourceTitle}
                  onChange={(e) => setSourceTitle(e.target.value)}
                  placeholder="Book title, course name, etc."
                  className="w-full bg-gh-dark-700 border border-gh-dark-600 rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Author</label>
                <input
                  type="text"
                  value={sourceAuthor}
                  onChange={(e) => setSourceAuthor(e.target.value)}
                  placeholder="Author name"
                  className="w-full bg-gh-dark-700 border border-gh-dark-600 rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-xs text-gray-400 mb-1">URL</label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-gh-dark-700 border border-gh-dark-600 rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </form>

        <div className="p-4 border-t border-gh-dark-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !title.trim() || !content.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {framework ? 'Save Changes' : 'Import'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function FrameworkImporter() {
  const { userId } = useAuthStore();
  const [frameworks, setFrameworks] = useState<UserFramework[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingFramework, setEditingFramework] = useState<UserFramework | null>(null);

  // Load frameworks
  useEffect(() => {
    if (!userId) return;

    const loadFrameworks = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .schema('human_os')
          .from('user_frameworks')
          .select('*')
          .eq('user_id', userId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setFrameworks(
          (data || []).map((row) => ({
            id: row.id,
            title: row.title,
            description: row.description,
            frameworkType: row.framework_type,
            content: row.content,
            visibility: row.visibility,
            sourceTitle: row.source_title,
            sourceUrl: row.source_url,
            sourceAuthor: row.source_author,
            tags: row.tags || [],
            wordCount: row.word_count,
            timesReferenced: row.times_referenced || 0,
            createdAt: row.created_at,
          }))
        );
      } catch (err) {
        console.error('Failed to load frameworks:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFrameworks();
  }, [userId]);

  const handleSave = async (data: Partial<UserFramework>) => {
    if (!userId) return;

    if (editingFramework) {
      // Update existing
      const { error } = await supabase
        .schema('human_os')
        .from('user_frameworks')
        .update({
          title: data.title,
          description: data.description,
          content: data.content,
          framework_type: data.frameworkType,
          visibility: data.visibility,
          source_title: data.sourceTitle,
          source_url: data.sourceUrl,
          source_author: data.sourceAuthor,
        })
        .eq('id', editingFramework.id);

      if (error) throw error;

      setFrameworks((prev) =>
        prev.map((f) =>
          f.id === editingFramework.id ? { ...f, ...data } as UserFramework : f
        )
      );
    } else {
      // Insert new
      const { data: inserted, error } = await supabase
        .schema('human_os')
        .from('user_frameworks')
        .insert({
          user_id: userId,
          title: data.title,
          description: data.description,
          content: data.content,
          framework_type: data.frameworkType,
          visibility: data.visibility,
          source_title: data.sourceTitle,
          source_url: data.sourceUrl,
          source_author: data.sourceAuthor,
        })
        .select()
        .single();

      if (error) throw error;

      const newFramework: UserFramework = {
        id: inserted.id,
        title: inserted.title,
        description: inserted.description,
        frameworkType: inserted.framework_type,
        content: inserted.content,
        visibility: inserted.visibility,
        sourceTitle: inserted.source_title,
        sourceUrl: inserted.source_url,
        sourceAuthor: inserted.source_author,
        tags: inserted.tags || [],
        wordCount: inserted.word_count,
        timesReferenced: 0,
        createdAt: inserted.created_at,
      };

      setFrameworks((prev) => [newFramework, ...prev]);
    }

    setEditingFramework(null);
    setShowImportModal(false);
  };

  const handleDelete = async (frameworkId: string) => {
    const { error } = await supabase
      .schema('human_os')
      .from('user_frameworks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', frameworkId);

    if (error) throw error;

    setFrameworks((prev) => prev.filter((f) => f.id !== frameworkId));
  };

  // Filter frameworks by search
  const filteredFrameworks = frameworks.filter(
    (f) =>
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!userId) {
    return (
      <div className="p-6 text-center text-gray-500">
        Please log in to manage frameworks.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Frameworks & Knowledge</h2>
          <p className="text-gray-400 mt-1">
            Import frameworks, methodologies, and key content. Human OS will reference these when helping you.
          </p>
        </div>
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Import
        </button>
      </div>

      {/* Search */}
      {frameworks.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search frameworks..."
            className="w-full bg-gh-dark-700 border border-gh-dark-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      )}

      {/* Framework List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      ) : frameworks.length === 0 ? (
        <div className="bg-gh-dark-700/50 border border-dashed border-gh-dark-600 rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">No frameworks yet</h3>
          <p className="text-gray-500 text-sm mb-4">
            Import your favorite frameworks and methodologies to give Human OS context.
          </p>
          <button
            onClick={() => setShowImportModal(true)}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Import your first framework
          </button>
        </div>
      ) : filteredFrameworks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No frameworks match your search.
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredFrameworks.map((framework) => (
              <FrameworkCard
                key={framework.id}
                framework={framework}
                onEdit={() => {
                  setEditingFramework(framework);
                  setShowImportModal(true);
                }}
                onDelete={() => handleDelete(framework.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <ImportModal
            framework={editingFramework || undefined}
            onSave={handleSave}
            onClose={() => {
              setShowImportModal(false);
              setEditingFramework(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
