/**
 * Resizable Modal Component
 *
 * A modal dialog that can be resized by dragging edges/corners.
 * Used to wrap workflow/task mode when launched from the dashboard.
 *
 * Features:
 * - Drag edges or corners to resize
 * - Full-screen toggle
 * - Minimize (collapse to corner)
 * - Draggable header to reposition
 * - Constrained to viewport bounds
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Maximize2, Minimize2, Minus } from 'lucide-react';

// =====================================================
// Types
// =====================================================

export interface ResizableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  defaultWidth?: number; // percentage or pixels
  defaultHeight?: number; // percentage or pixels
  minWidth?: number;
  minHeight?: number;
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;

// =====================================================
// ResizableModal Component
// =====================================================

export const ResizableModal: React.FC<ResizableModalProps> = ({
  isOpen,
  onClose,
  title = 'Workflow',
  children,
  defaultWidth = 80, // 80% of viewport
  defaultHeight = 85, // 85% of viewport
  minWidth = 600,
  minHeight = 400
}) => {
  // Modal dimensions and position
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
    x: 0,
    y: 0
  });

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dimensionsStartRef = useRef({ width: 0, height: 0, x: 0, y: 0 });

  // Initialize dimensions on mount
  useEffect(() => {
    if (isOpen && dimensions.width === 0) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = typeof defaultWidth === 'number' && defaultWidth <= 100
        ? (vw * defaultWidth) / 100
        : defaultWidth;
      const height = typeof defaultHeight === 'number' && defaultHeight <= 100
        ? (vh * defaultHeight) / 100
        : defaultHeight;

      setDimensions({
        width: Math.max(width, minWidth),
        height: Math.max(height, minHeight),
        x: (vw - width) / 2,
        y: (vh - height) / 2
      });
    }
  }, [isOpen, defaultWidth, defaultHeight, minWidth, minHeight]);

  // =====================================================
  // Dragging (Reposition)
  // =====================================================

  const handleDragStart = (e: React.MouseEvent) => {
    if (isFullScreen) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    dimensionsStartRef.current = { ...dimensions };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      setDimensions(prev => ({
        ...prev,
        x: dimensionsStartRef.current.x + deltaX,
        y: dimensionsStartRef.current.y + deltaY
      }));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // =====================================================
  // Resizing
  // =====================================================

  const handleResizeStart = (e: React.MouseEvent, direction: ResizeDirection) => {
    if (isFullScreen) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    dimensionsStartRef.current = { ...dimensions };
  };

  useEffect(() => {
    if (!isResizing || !resizeDirection) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      const start = dimensionsStartRef.current;

      const newDimensions = { ...start };

      // Handle horizontal resizing
      if (resizeDirection.includes('e')) {
        newDimensions.width = Math.max(minWidth, start.width + deltaX);
      } else if (resizeDirection.includes('w')) {
        const newWidth = Math.max(minWidth, start.width - deltaX);
        if (newWidth > minWidth) {
          newDimensions.width = newWidth;
          newDimensions.x = start.x + (start.width - newWidth);
        }
      }

      // Handle vertical resizing
      if (resizeDirection.includes('s')) {
        newDimensions.height = Math.max(minHeight, start.height + deltaY);
      } else if (resizeDirection.includes('n')) {
        const newHeight = Math.max(minHeight, start.height - deltaY);
        if (newHeight > minHeight) {
          newDimensions.height = newHeight;
          newDimensions.y = start.y + (start.height - newHeight);
        }
      }

      // Constrain to viewport
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      newDimensions.x = Math.max(0, Math.min(newDimensions.x, vw - newDimensions.width));
      newDimensions.y = Math.max(0, Math.min(newDimensions.y, vh - newDimensions.height));

      setDimensions(newDimensions);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeDirection, minWidth, minHeight]);

  // =====================================================
  // Full Screen Toggle
  // =====================================================

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    if (isMinimized) setIsMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // =====================================================
  // Render
  // =====================================================

  if (!isOpen) return null;

  // Minimized state - small bar in bottom-right
  if (isMinimized) {
    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

        {/* Minimized bar */}
        <div
          className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl"
          style={{ width: '320px' }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-semibold text-gray-900 text-sm">{title}</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMinimize}
                className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                title="Restore"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const modalStyle = isFullScreen
    ? { width: '100vw', height: '100vh', top: 0, left: 0 }
    : {
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        top: `${dimensions.y}px`,
        left: `${dimensions.x}px`
      };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed z-50 bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden"
        style={modalStyle}
      >
        {/* Header (draggable) */}
        <div
          onMouseDown={handleDragStart}
          className={`flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0 ${
            !isFullScreen ? 'cursor-move' : ''
          }`}
        >
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>

          <div className="flex items-center space-x-2">
            {/* Minimize */}
            <button
              onClick={toggleMinimize}
              className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
              title="Minimize"
            >
              <Minus className="w-4 h-4" />
            </button>

            {/* Full Screen Toggle */}
            <button
              onClick={toggleFullScreen}
              className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
              title={isFullScreen ? 'Exit full screen' : 'Full screen'}
            >
              {isFullScreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>

        {/* Resize Handles */}
        {!isFullScreen && (
          <>
            {/* Edges */}
            <div
              className="absolute top-0 left-0 right-0 h-1 cursor-n-resize"
              onMouseDown={(e) => handleResizeStart(e, 'n')}
            />
            <div
              className="absolute bottom-0 left-0 right-0 h-1 cursor-s-resize"
              onMouseDown={(e) => handleResizeStart(e, 's')}
            />
            <div
              className="absolute top-0 left-0 bottom-0 w-1 cursor-w-resize"
              onMouseDown={(e) => handleResizeStart(e, 'w')}
            />
            <div
              className="absolute top-0 right-0 bottom-0 w-1 cursor-e-resize"
              onMouseDown={(e) => handleResizeStart(e, 'e')}
            />

            {/* Corners */}
            <div
              className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize"
              onMouseDown={(e) => handleResizeStart(e, 'nw')}
            />
            <div
              className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize"
              onMouseDown={(e) => handleResizeStart(e, 'ne')}
            />
            <div
              className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize"
              onMouseDown={(e) => handleResizeStart(e, 'sw')}
            />
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
              onMouseDown={(e) => handleResizeStart(e, 'se')}
            />
          </>
        )}
      </div>
    </>
  );
};
