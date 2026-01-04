/**
 * ArtifactFooter - Action button area
 *
 * Provides:
 * - Consistent button/action layout
 * - Left/center/right alignment
 * - Optional secondary actions
 */

import React from 'react';

export type FooterAlign = 'left' | 'center' | 'right' | 'between';

export interface ArtifactFooterProps {
  /** Primary actions (buttons, links) */
  children: React.ReactNode;
  /** Secondary actions (left side when using 'between') */
  secondaryActions?: React.ReactNode;
  /** Button alignment */
  align?: FooterAlign;
  /** Additional CSS classes */
  className?: string;
  /** Debug section ID */
  sectionId?: string;
  /** Border on top */
  bordered?: boolean;
}

const ALIGN_CLASSES: Record<FooterAlign, string> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
  between: 'justify-between',
};

export const ArtifactFooter = React.memo(function ArtifactFooter({
  children,
  secondaryActions,
  align = 'right',
  className = '',
  sectionId,
  bordered = true,
}: ArtifactFooterProps) {
  const alignClass = ALIGN_CLASSES[align];

  return (
    <div
      id={sectionId}
      className={`
        px-6 py-4
        ${bordered ? 'border-t border-gray-200' : ''}
        ${className}
      `}
    >
      <div className={`flex items-center gap-3 ${alignClass}`}>
        {align === 'between' && secondaryActions ? (
          <>
            <div className="flex items-center gap-2">{secondaryActions}</div>
            <div className="flex items-center gap-2">{children}</div>
          </>
        ) : (
          children
        )}
      </div>
    </div>
  );
});

ArtifactFooter.displayName = 'ArtifactFooter';
export default ArtifactFooter;
