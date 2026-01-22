/**
 * Artifact Canvas
 *
 * Resizable container for displaying artifacts (tables, documents, etc.).
 * Supports multiple artifacts with tabs and full-screen mode.
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Table,
  Users,
  Calendar,
  Code,
  Sparkles,
} from 'lucide-react';

export interface ArtifactInstance {
  id: string;
  type: string;
  title: string;
  data: Record<string, unknown>;
  status: 'draft' | 'confirmed' | 'saved';
  generatedAt: string;
  source: 'awaken' | 'conversation' | 'manual';
}

interface ArtifactCanvasProps {
  artifacts: ArtifactInstance[];
  activeArtifactId?: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onArtifactSelect: (id: string) => void;
  onArtifactClose: (id: string) => void;
  onArtifactConfirm?: (id: string) => void;
  renderArtifact: (artifact: ArtifactInstance) => React.ReactNode;
  /** Enable drag-to-resize functionality */
  resizable?: boolean;
  /** Current width in pixels (only used when resizable=true) */
  width?: number;
  /** Callback when width changes via drag */
  onWidthChange?: (width: number) => void;
  /** Minimum width when resizable */
  minWidth?: number;
  /** Maximum width when resizable */
  maxWidth?: number;
}

const ARTIFACT_ICONS: Record<string, typeof FileText> = {
  document: FileText,
  table: Table,
  persona: Users,
  calendar: Calendar,
  code: Code,
  default: Sparkles,
};

export function ArtifactCanvas({
  artifacts,
  activeArtifactId,
  collapsed,
  onToggleCollapse,
  onArtifactSelect,
  onArtifactClose,
  onArtifactConfirm,
  renderArtifact,
  resizable = false,
  width = 400,
  onWidthChange,
  minWidth = 300,
  maxWidth = 600,
}: ArtifactCanvasProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const activeArtifact = artifacts.find((a) => a.id === activeArtifactId);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(width);

  // Resize handler
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!resizable || !onWidthChange) return;
      e.preventDefault();
      isDragging.current = true;
      startX.current = e.clientX;
      startWidth.current = width;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current) return;
        // Drag left to increase width (since panel is on the right)
        const delta = startX.current - moveEvent.clientX;
        const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth.current + delta));
        onWidthChange(newWidth);
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [resizable, onWidthChange, width, minWidth, maxWidth]
  );

  const getIcon = (type: string) => {
    const Icon = ARTIFACT_ICONS[type] || ARTIFACT_ICONS.default;
    return <Icon className="w-4 h-4" />;
  };

  const getStatusColor = (status: ArtifactInstance['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'saved':
        return 'bg-blue-500';
      default:
        return 'bg-amber-500';
    }
  };

  if (artifacts.length === 0) {
    return (
      <motion.div
        initial={false}
        animate={{ width: collapsed ? 0 : 400 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="h-full bg-gh-dark-900 border-l border-gh-dark-700 overflow-hidden"
      >
        {!collapsed && (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gh-dark-800 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              No Artifacts Yet
            </h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Artifacts will appear here as they're generated from your
              conversation and setup process.
            </p>
          </div>
        )}
      </motion.div>
    );
  }

  // Determine width based on state
  const panelWidth = isFullscreen ? '100%' : collapsed ? 48 : (resizable ? width : 400);

  return (
    <motion.div
      initial={false}
      animate={{
        width: panelWidth,
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 50 : 'auto',
      }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-full bg-gh-dark-900 border-l border-gh-dark-700 flex flex-col relative"
    >
      {/* Resize handle - only shown when resizable and not collapsed */}
      {resizable && !collapsed && !isFullscreen && (
        <div
          onMouseDown={handleMouseDown}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 transition-colors group z-10"
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 -ml-1.5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-1 h-6 bg-blue-500 rounded-full" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-gh-dark-700 bg-gh-dark-800">
        {!collapsed && (
          <>
            {/* Tabs */}
            <div className="flex-1 flex items-center gap-1 overflow-x-auto">
              {artifacts.map((artifact) => (
                <button
                  key={artifact.id}
                  onClick={() => onArtifactSelect(artifact.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm whitespace-nowrap transition-colors ${
                    activeArtifactId === artifact.id
                      ? 'bg-gh-dark-700 text-white'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gh-dark-700/50'
                  }`}
                >
                  <div className="relative">
                    {getIcon(artifact.type)}
                    <div
                      className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${getStatusColor(
                        artifact.status
                      )}`}
                    />
                  </div>
                  <span className="max-w-24 truncate">{artifact.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onArtifactClose(artifact.id);
                    }}
                    className="p-0.5 hover:bg-gh-dark-600 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 hover:bg-gh-dark-700 rounded transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4 text-gray-400" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {!isFullscreen && (
                <button
                  onClick={onToggleCollapse}
                  className="p-1.5 hover:bg-gh-dark-700 rounded transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </>
        )}

        {collapsed && (
          <button
            onClick={onToggleCollapse}
            className="w-full p-2 hover:bg-gh-dark-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-400 mx-auto" />
          </button>
        )}
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {activeArtifact && (
              <motion.div
                key={activeArtifact.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                {renderArtifact(activeArtifact)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Footer - Confirm button for draft artifacts */}
      {!collapsed && activeArtifact?.status === 'draft' && onArtifactConfirm && (
        <div className="p-3 border-t border-gh-dark-700 bg-gh-dark-800">
          <button
            onClick={() => onArtifactConfirm(activeArtifact.id)}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Confirm & Save
          </button>
        </div>
      )}

      {/* Collapsed indicator */}
      {collapsed && (
        <div className="flex-1 flex flex-col items-center gap-2 pt-4">
          {artifacts.slice(0, 5).map((artifact) => (
            <button
              key={artifact.id}
              onClick={() => {
                onArtifactSelect(artifact.id);
                onToggleCollapse();
              }}
              className={`p-2 rounded transition-colors ${
                activeArtifactId === artifact.id
                  ? 'bg-gh-dark-700'
                  : 'hover:bg-gh-dark-700'
              }`}
              title={artifact.title}
            >
              <div className="relative">
                {getIcon(artifact.type)}
                <div
                  className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${getStatusColor(
                    artifact.status
                  )}`}
                />
              </div>
            </button>
          ))}
          {artifacts.length > 5 && (
            <span className="text-xs text-gray-500">+{artifacts.length - 5}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default ArtifactCanvas;
