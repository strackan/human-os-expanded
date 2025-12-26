'use client';

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CodeBlock from '@tiptap/extension-code-block';
import Blockquote from '@tiptap/extension-blockquote';

import { useEffect, useState, useRef, useCallback } from 'react';
import TaskModal from './TaskModal';
import SnippetsPanel from './SnippetsPanel';
import CreateSnippetModal from './CreateSnippetModal';
import { useTextSelection } from '@/hooks/useTextSelection';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useToast } from './Toast';
import { isColorDark } from '@/lib/colorUtils';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  onWordCountChange: (count: number) => void;
  onCharCountChange: (count: number) => void;
  onEditorReady?: (editor: any) => void;
  entryId?: number;
  onSnippetCreated?: () => void;
}

interface Snippet {
  id: number;
  snippet: string;
  startIndex: number;
  endIndex: number;
  highlightColor: string;
}

// Custom Toolbar Component
function Toolbar({ editor, entryId, onSnippetCreated }: { editor: any; entryId?: number; onSnippetCreated?: () => void }) {
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [showSnippetsPanel, setShowSnippetsPanel] = useState(false);
  const [showCreateSnippetModal, setShowCreateSnippetModal] = useState(false);
  const [labels, setLabels] = useState<{ id: number; name: string; color: string }[]>([]);
  const { selectedText, clearSelection } = useTextSelection();
  const { showToast } = useToast();

  // Fetch labels for snippet creation
  const fetchLabels = useCallback(async () => {
    try {
      const response = await fetch('/api/labels');
      if (response.ok) {
        const data = await response.json();
        setLabels(data);
      }
    } catch (error) {
      console.error('Error fetching labels:', error);
    }
  }, []);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  // Hotkey for creating snippets (Ctrl+Shift+S)
  useHotkeys([
    {
      key: 's',
      ctrl: true,
      shift: true,
      handler: (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (selectedText && entryId) {
          setShowCreateSnippetModal(true);
        }
      },
    },
  ]);

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('Enter URL');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('Enter image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addTask = () => {
    setShowTaskPanel(true);
    if (selectedText) {
      clearSelection();
    }
  };

  const handleCreateSnippet = async (description: string, highlightColor: string, labelId?: number) => {
    if (!selectedText || !entryId) {
      showToast('Please select some text first and ensure you have an entry ID', 'error');
      return;
    }

    try {
      const response = await fetch('/api/snippets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryId,
          snippet: selectedText,
          description: description || '',
          startIndex: editor.state.selection.from,
          endIndex: editor.state.selection.to,
          highlightColor: highlightColor || '#FFEB3B',
          labelId: labelId || null,
        }),
      });

      if (response.ok) {
        clearSelection();
        if (onSnippetCreated) {
          onSnippetCreated();
        }
        showToast('Snippet created successfully!', 'success');
      } else {
        showToast('Failed to create snippet', 'error');
      }
    } catch (error) {
      console.error('Error creating snippet:', error);
      showToast('Error creating snippet', 'error');
    }
  };

  return (
    <div className="border-b border-gray-200 bg-gray-50 p-3 rounded-t-xl">
      <div className="flex flex-wrap gap-2 items-center">
        {/* Text Formatting */}
        <div className="flex gap-1 border-r border-gray-300 pr-3">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-300' : ''}`}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-300' : ''}`}
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('underline') ? 'bg-gray-300' : ''}`}
            title="Underline"
          >
            <u>U</u>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('strike') ? 'bg-gray-300' : ''}`}
            title="Strikethrough"
          >
            <s>S</s>
          </button>
        </div>

        {/* Headings */}
        <div className="flex gap-1 border-r border-gray-300 pr-3">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''}`}
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''}`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''}`}
            title="Heading 3"
          >
            H3
          </button>
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r border-gray-300 pr-3">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-300' : ''}`}
            title="Bullet List"
          >
            •
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-300' : ''}`}
            title="Numbered List"
          >
            1.
          </button>
        </div>

        {/* Text Alignment */}
        <div className="flex gap-1 border-r border-gray-300 pr-3">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : ''}`}
            title="Align Left"
          >
            ←
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : ''}`}
            title="Align Center"
          >
            ↔
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : ''}`}
            title="Align Right"
          >
            →
          </button>
        </div>

        {/* Special Elements */}
        <div className="flex gap-1 border-r border-gray-300 pr-3">
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('blockquote') ? 'bg-gray-300' : ''}`}
            title="Quote"
          >
            "
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('codeBlock') ? 'bg-gray-300' : ''}`}
            title="Code Block"
          >
            {'</>'}
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('code') ? 'bg-gray-300' : ''}`}
            title="Inline Code"
          >
            {'<>'}
          </button>
        </div>

        {/* Custom Controls */}
        <div className="flex gap-1 border-r border-gray-300 pr-3">
          <button
            onClick={addLink}
            className="p-2 rounded hover:bg-gray-200"
            title="Add Link"
          >
            🔗
          </button>
          <button
            onClick={addImage}
            className="p-2 rounded hover:bg-gray-200"
            title="Add Image"
          >
            🖼️
          </button>
        </div>

        {/* Journal-Specific Controls */}
        <div className="flex gap-1">
          <button
            onClick={addTask}
            className="p-2 rounded hover:bg-gray-200"
            title="Add Task (from selection)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
          </button>
          <button
            onClick={() => {
              if (selectedText && entryId) {
                setShowCreateSnippetModal(true);
              } else {
                showToast('Please select some text first and ensure you have an entry ID', 'error');
              }
            }}
            className="p-2 rounded hover:bg-gray-200"
            title="Add Snippet (from selection) - Ctrl+Shift+S"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"/>
            </svg>
          </button>
          <button
            onClick={() => setShowSnippetsPanel(true)}
            className="p-2 rounded hover:bg-gray-200"
            title="View Snippets"
          >
            📋
          </button>
        </div>
      </div>
      {/* TaskModal */}
      <TaskModal
        selectedText={selectedText}
        onTaskCreated={() => {
          setShowTaskPanel(false);
        }}
        onClose={() => setShowTaskPanel(false)}
        isOpen={showTaskPanel}
        entryId={entryId}
      />

      {/* SnippetsPanel Modal */}
      {showSnippetsPanel && entryId && (
        <SnippetsPanel
          entryId={entryId}
          isOpen={showSnippetsPanel}
          onClose={() => setShowSnippetsPanel(false)}
          onSnippetCreated={() => {
            if (onSnippetCreated) {
              onSnippetCreated();
            }
          }}
        />
      )}

      {/* CreateSnippetModal */}
      {showCreateSnippetModal && selectedText && entryId && (
        <CreateSnippetModal
          isOpen={showCreateSnippetModal}
          onClose={() => setShowCreateSnippetModal(false)}
          onSave={handleCreateSnippet}
          selectedText={selectedText}
          labels={labels}
          onLabelsUpdated={fetchLabels}
        />
      )}
    </div>
  );
}

export default function TiptapEditor({ 
  content, 
  onChange, 
  onWordCountChange, 
  onCharCountChange,
  onEditorReady,
  entryId,
  onSnippetCreated
}: TiptapEditorProps) {
  const [isClient, setIsClient] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoadingSnippets, setIsLoadingSnippets] = useState(false);
  const contentRef = useRef(content);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Fetch snippets for the current entry
  const fetchSnippets = useCallback(async () => {
    if (!entryId || isLoadingSnippets) {
      console.log('[TiptapEditor] Skipping snippet fetch - no entryId or already loading');
      return [];
    }
    
    console.log('[TiptapEditor] Fetching snippets for entry:', entryId);
    setIsLoadingSnippets(true);
    
    try {
      const response = await fetch(`/api/snippets?entryId=${entryId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('[TiptapEditor] Fetched snippets:', data);
        setSnippets(data);
        return data;
      } else {
        console.error('[TiptapEditor] Failed to fetch snippets:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('[TiptapEditor] Error fetching snippets:', error);
    } finally {
      setIsLoadingSnippets(false);
    }
    return [];
  }, [entryId]);

  // Apply highlighting to snippets in the editor
  const applySnippetHighlighting = useCallback((editor: any) => {
    if (!editor || !snippets.length) {
      console.log('[TiptapEditor] Skipping highlighting - no editor or snippets');
      return;
    }
    
    console.log('[TiptapEditor] Starting highlighting for', snippets.length, 'snippets');
    
    // Check if any snippets are already highlighted to avoid re-applying
    const content = editor.getHTML();
    const alreadyHighlighted = snippets.some(snippet => 
      content.includes(`data-snippet-id="${snippet.id}"`)
    );
    
    if (alreadyHighlighted) {
      console.log('[TiptapEditor] Some snippets already highlighted, skipping');
      return;
    }
    
    // For now, just disable highlighting to resolve the performance issue
    // TODO: Implement a more robust highlighting mechanism
    console.log('[TiptapEditor] Highlighting temporarily disabled to resolve performance issues');
  }, [snippets]);

  // Helper function to update counts
  const updateCounts = useCallback((editor: any) => {
    if (!editor) return;
    const html = editor.getHTML();
    
    // Use the same calculation logic as the backend to ensure consistency
    // Add spaces around block-level elements to ensure proper word separation
    const plainText = html
      .replace(/<\/?(p|div|br|h[1-6]|li|blockquote|pre)[^>]*>/gi, ' ') // Replace block elements with spaces
      .replace(/<[^>]*>/g, '') // Strip remaining HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&lt;/g, '<')   // Decode common HTML entities
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' '); // Normalize multiple spaces to single space
    
    const trimmedText = plainText.trim();
    
    const wordCount = trimmedText ? trimmedText.split(/\s+/).length : 0;
    const charCount = trimmedText.length; // Count only meaningful characters
    
    onChange(html);
    onWordCountChange(wordCount);
    onCharCountChange(charCount);
  }, [onChange, onWordCountChange, onCharCountChange]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 p-4 rounded-lg font-mono text-sm',
        },
      }),
      Blockquote.configure({
        HTMLAttributes: {
          class: 'border-l-4 border-core-green pl-4 italic text-gray-600',
        },
      }),
    ],
    content: contentRef.current,
    onUpdate: ({ editor }) => {
      // Don't trigger updates when we're applying highlighting
      if (!editor.isHighlighting) {
        updateCounts(editor);
      }
    },
    onCreate: ({ editor }) => {
      setIsEditorReady(true);
      // Set content after editor is created if needed
      if (contentRef.current && contentRef.current !== editor.getHTML()) {
        editor.commands.setContent(contentRef.current);
        // Trigger count update after setting content
        updateCounts(editor);
      }
      // Call the onEditorReady callback if provided
      if (onEditorReady) {
        onEditorReady(editor);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none p-4 tiptap-editor-text',
      },
    },
    immediatelyRender: false,
  }, [isClient, updateCounts]);

  // Update editor content when prop changes (after editor is ready)
  useEffect(() => {
    if (editor && isEditorReady && content !== editor.getHTML()) {
      editor.commands.setContent(content);
      // Trigger count update after setting content
      updateCounts(editor);
    }
  }, [content, editor, isEditorReady, updateCounts]);

  // Fetch snippets when entryId changes
  useEffect(() => {
    if (entryId && isEditorReady) {
      console.log('[TiptapEditor] Triggering snippet fetch for entryId:', entryId);
      fetchSnippets();
    }
  }, [entryId, isEditorReady, fetchSnippets]);

  // Apply highlighting when snippets are loaded
  useEffect(() => {
    if (editor && isEditorReady && snippets.length > 0) {
      console.log('[TiptapEditor] Applying highlighting for', snippets.length, 'snippets');
      // Add a small delay to ensure content is fully loaded
      const timeoutId = setTimeout(() => applySnippetHighlighting(editor), 200);
      return () => clearTimeout(timeoutId);
    }
  }, [editor, isEditorReady, snippets.length, applySnippetHighlighting]);

  // Callback to refresh snippets after creation
  const handleSnippetCreated = useCallback(() => {
    if (onSnippetCreated) {
      onSnippetCreated();
    }
    // Just fetch snippets - highlighting will be applied by the useEffect
    fetchSnippets();
  }, [onSnippetCreated, fetchSnippets]);

  // Prevent hydration mismatch by not rendering until client is ready
  if (!isClient) {
    return (
      <div className="tiptap-editor-container rounded-xl border border-core-green bg-white shadow-sm h-full">
        <div className="border-b border-gray-200 bg-gray-50 p-3 rounded-t-xl">
          <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
        </div>
        <div className="p-8">
          <div className="animate-pulse bg-gray-200 h-6 rounded mb-2"></div>
          <div className="animate-pulse bg-gray-200 h-6 rounded mb-2"></div>
          <div className="animate-pulse bg-gray-200 h-6 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  // Don't render editor until client is ready
  if (!isEditorReady) {
    return (
      <div className="tiptap-editor-container rounded-xl border border-core-green bg-white shadow-sm h-full">
        <div className="border-b border-gray-200 bg-gray-50 p-3 rounded-t-xl">
          <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
        </div>
        <div className="p-8">
          <div className="animate-pulse bg-gray-200 h-6 rounded mb-2"></div>
          <div className="animate-pulse bg-gray-200 h-6 rounded mb-2"></div>
          <div className="animate-pulse bg-gray-200 h-6 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="tiptap-editor-container rounded-lg border border-gray-300 bg-white shadow-sm flex flex-col relative h-full">
      <Toolbar editor={editor} entryId={entryId} onSnippetCreated={handleSnippetCreated} />
      <div className="tiptap-editor-content flex-1 bg-white overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
      
      {/* Bubble Menu for selected text */}
      {editor && (
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ duration: 100 }}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-1"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1 rounded hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1 rounded hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
          >
            <em>I</em>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1 rounded hover:bg-gray-100 ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
          >
            <u>U</u>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1 rounded hover:bg-gray-100 ${editor.isActive('code') ? 'bg-gray-200' : ''}`}
          >
            {'<>'}
          </button>
        </BubbleMenu>
      )}
    </div>
  );
} 