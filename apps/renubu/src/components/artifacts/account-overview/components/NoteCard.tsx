import React from 'react';
import { LucideIcon, ChevronRight } from 'lucide-react';

interface NoteCardProps {
  icon: LucideIcon;
  title: string;
  items?: string[];
  description?: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  iconColor: string;
}

/**
 * Reusable card component for displaying notes, warnings, or lists
 *
 * Used for pricing caps, non-standard terms, unsigned amendments, etc.
 */
export function NoteCard({
  icon: Icon,
  title,
  items,
  description,
  borderColor,
  bgColor,
  textColor,
  iconColor
}: NoteCardProps) {
  return (
    <div className={`border-l-4 ${borderColor} ${bgColor} rounded-r-lg p-3`}>
      <div className="flex items-start gap-2">
        <Icon className={`w-4 h-4 ${iconColor} mt-0.5 flex-shrink-0`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${textColor} mb-1`}>{title}</p>

          {items && items.length > 0 && (
            <ul className={`text-sm ${textColor} space-y-1`}>
              {items.map((item, index) => (
                <li key={index} className="flex items-start gap-1">
                  <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}

          {description && (
            <p className={`text-sm ${textColor}`}>{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
