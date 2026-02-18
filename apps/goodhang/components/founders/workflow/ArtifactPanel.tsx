'use client';

export interface ArtifactPanelProps {
  children: React.ReactNode;
  showStepProgress?: boolean;
  className?: string;
}

export function ArtifactPanel({ children, className = '' }: ArtifactPanelProps) {
  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
