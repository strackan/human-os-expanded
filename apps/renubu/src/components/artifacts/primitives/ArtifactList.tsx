/**
 * ArtifactList - Flexible list component
 *
 * Provides:
 * - Bullet, numbered, and icon list styles
 * - Consistent spacing
 * - Custom item rendering
 */

import React from 'react';

export type ListVariant = 'bullet' | 'numbered' | 'icon' | 'none';

export interface ListItem {
  /** Unique key */
  key: string;
  /** Primary text */
  content: React.ReactNode;
  /** Secondary text */
  secondary?: React.ReactNode;
  /** Icon for icon variant */
  icon?: React.ReactNode;
  /** Custom styling */
  className?: string;
}

export interface ArtifactListProps {
  /** List items */
  items: ListItem[];
  /** List style variant */
  variant?: ListVariant;
  /** Spacing between items */
  spacing?: 'tight' | 'normal' | 'relaxed';
  /** Additional CSS classes */
  className?: string;
  /** Debug section ID */
  sectionId?: string;
  /** Dividers between items */
  dividers?: boolean;
}

const SPACING_CLASSES = {
  tight: 'space-y-1',
  normal: 'space-y-2',
  relaxed: 'space-y-3',
};

export const ArtifactList = React.memo(function ArtifactList({
  items,
  variant = 'bullet',
  spacing = 'normal',
  className = '',
  sectionId,
  dividers = false,
}: ArtifactListProps) {
  const spacingClass = SPACING_CLASSES[spacing];

  const renderBullet = () => (
    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
  );

  const renderNumber = (index: number) => (
    <span className="w-5 h-5 bg-gray-100 rounded text-xs font-medium text-gray-600 flex items-center justify-center flex-shrink-0">
      {index + 1}
    </span>
  );

  const renderIcon = (icon?: React.ReactNode) => (
    <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-gray-500">
      {icon || '•'}
    </span>
  );

  const renderLeading = (item: ListItem, index: number) => {
    switch (variant) {
      case 'bullet':
        return renderBullet();
      case 'numbered':
        return renderNumber(index);
      case 'icon':
        return renderIcon(item.icon);
      case 'none':
        return null;
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <ul id={sectionId} className={`${spacingClass} ${className}`}>
      {items.map((item, index) => (
        <li
          key={item.key}
          className={`
            flex gap-2.5
            ${dividers && index > 0 ? 'pt-2 border-t border-gray-100' : ''}
            ${item.className || ''}
          `}
        >
          {renderLeading(item, index)}
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-700">{item.content}</div>
            {item.secondary && (
              <div className="text-xs text-gray-500 mt-0.5">{item.secondary}</div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
});

ArtifactList.displayName = 'ArtifactList';
export default ArtifactList;
