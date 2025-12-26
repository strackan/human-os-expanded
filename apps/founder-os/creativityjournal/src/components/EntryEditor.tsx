import React from 'react';
import TiptapEditor from './TiptapEditor';

interface EntryEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onWordCountChange: (count: number) => void;
  onCharCountChange: (count: number) => void;
  onEditorReady: (editor: any) => void;
  entryId?: number;
  writingMode: boolean;
  lastSaved: string;
  wordCount: number;
  charCount: number;
  wordTarget?: number;
  onSnippetCreated?: () => void;
}

export default function EntryEditor({
  content,
  onContentChange,
  onWordCountChange,
  onCharCountChange,
  onEditorReady,
  entryId,
  writingMode,
  lastSaved,
  wordCount,
  charCount,
  wordTarget = 500,
  onSnippetCreated
}: EntryEditorProps) {
  const targetMet = wordCount >= wordTarget;
  
  return (
    <div className="mt-4">
      <div id="entry_form" aria-label="Journal entry form">
        {/* Stats bar - only show in normal mode */}
        {!writingMode && (
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <p className="text-gray-600 text-sm">
                Last saved: {lastSaved || 'Not saved yet'}
              </p>
              <div className="flex items-center space-x-4">
                <p className={`text-sm font-medium ${targetMet ? 'text-green-600 font-bold' : 'text-gray-600'}`}>
                  {wordCount} / {wordTarget} words
                  {targetMet && (
                    <span className="ml-2 text-green-600">
                      ✓ Target reached!
                    </span>
                  )}
                </p>
                <p className="text-gray-600 text-sm">
                  {charCount} characters
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Editor */}
        <div className="w-full mb-6" style={{ minHeight: writingMode ? '70vh' : '380px' }}>
          <TiptapEditor
            content={content}
            onChange={onContentChange}
            onWordCountChange={onWordCountChange}
            onCharCountChange={onCharCountChange}
            entryId={entryId}
            onSnippetCreated={onSnippetCreated}
            onEditorReady={onEditorReady}
          />
        </div>
      </div>
    </div>
  );
} 