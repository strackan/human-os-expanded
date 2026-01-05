'use client';

import { useEffect, useRef, ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  variant?: 'paper' | 'postcard' | 'index-card';
}

export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  variant = 'paper',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const variantClasses = {
    paper: 'rt-paper-note',
    postcard: 'rt-postcard',
    'index-card': 'rt-index-card',
  };

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={`${variantClasses[variant]} relative w-full max-w-lg my-auto rounded-lg p-6 pt-10`}
        style={{ marginTop: variant === 'paper' ? '8px' : '0' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-2 right-2 w-12 h-12 flex items-center justify-center text-[var(--rt-cork-dark)] hover:text-[var(--rt-rust)] hover:bg-[var(--rt-cork)]/20 transition-colors text-3xl font-bold rounded-full z-10"
          aria-label="Close"
        >
          ×
        </button>

        {/* Title */}
        {title && (
          <h2 className="rt-heading-elegant text-2xl font-bold text-[var(--rt-navy)] mb-4 pr-8">
            {title}
          </h2>
        )}

        {children}
      </div>
    </div>
  );
}
