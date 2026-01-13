/**
 * ReportArtifact
 *
 * A structured report component designed for PDF-ability and clean printing.
 * Supports multiple sections with consistent styling.
 */

'use client';

import React from 'react';
import { FileText, Download, Printer, Calendar, User, Building2 } from 'lucide-react';
import {
  ArtifactContainer,
  ArtifactHeader,
  ArtifactSection,
  ArtifactList,
  ArtifactTable,
  ArtifactAlert,
  ArtifactMetric,
  ArtifactFooter,
  type TableColumn,
  type ListItem,
  type AlertSeverity,
} from '@/components/artifacts/primitives';

export type ReportSectionType =
  | 'text'
  | 'list'
  | 'table'
  | 'metrics'
  | 'alert'
  | 'custom';

export interface ReportMetric {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export interface ReportSection {
  id: string;
  title?: string;
  type: ReportSectionType;
  /** For text sections */
  content?: React.ReactNode;
  /** For list sections */
  items?: ListItem[];
  listVariant?: 'bullet' | 'numbered' | 'icon' | 'none';
  /** For table sections */
  columns?: TableColumn<any>[];
  tableData?: any[];
  /** For metrics sections */
  metrics?: ReportMetric[];
  /** For alert sections */
  alertSeverity?: AlertSeverity;
  alertTitle?: string;
  alertContent?: React.ReactNode;
  /** For custom sections */
  customContent?: React.ReactNode;
}

export interface ReportMetadata {
  author?: string;
  date?: string;
  version?: string;
  customer?: string;
}

export interface ReportArtifactProps {
  /** Artifact ID for debugging */
  artifactId?: string;
  /** Report title */
  title: string;
  /** Report subtitle */
  subtitle?: string;
  /** Report metadata */
  metadata?: ReportMetadata;
  /** Report sections */
  sections: ReportSection[];
  /** Executive summary at the top */
  executiveSummary?: string;
  /** Show print/download buttons */
  showActions?: boolean;
  /** Custom action buttons */
  customActions?: React.ReactNode;
  /** Navigation handlers */
  onPrint?: () => void;
  onDownload?: () => void;
  onBack?: () => void;
  onContinue?: () => void;
  /** States */
  isLoading?: boolean;
  error?: string;
}

function MetricsRow({ metrics }: { metrics: ReportMetric[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <ArtifactMetric
          key={index}
          label={metric.label}
          value={metric.value}
          prefix={metric.prefix}
          suffix={metric.suffix}
          trend={metric.trend}
          trendValue={metric.trendValue}
          size="sm"
          className="bg-gray-50 rounded-lg p-3"
        />
      ))}
    </div>
  );
}

function ReportSectionRenderer({ section }: { section: ReportSection }) {
  switch (section.type) {
    case 'text':
      return (
        <div className="prose prose-sm max-w-none text-gray-700">
          {typeof section.content === 'string' ? (
            <p>{section.content}</p>
          ) : (
            section.content
          )}
        </div>
      );

    case 'list':
      return section.items ? (
        <ArtifactList
          items={section.items}
          variant={section.listVariant || 'bullet'}
          spacing="normal"
        />
      ) : null;

    case 'table':
      return section.columns && section.tableData ? (
        <ArtifactTable
          columns={section.columns}
          data={section.tableData}
          striped
          density="comfortable"
        />
      ) : null;

    case 'metrics':
      return section.metrics ? (
        <MetricsRow metrics={section.metrics} />
      ) : null;

    case 'alert':
      return section.alertContent ? (
        <ArtifactAlert
          severity={section.alertSeverity || 'info'}
          title={section.alertTitle}
        >
          {section.alertContent}
        </ArtifactAlert>
      ) : null;

    case 'custom':
      return <>{section.customContent}</>;

    default:
      return null;
  }
}

export function ReportArtifact({
  artifactId = 'report',
  title,
  subtitle,
  metadata,
  sections,
  executiveSummary,
  showActions = true,
  customActions,
  onPrint,
  onDownload,
  onBack,
  onContinue,
  isLoading = false,
  error,
}: ReportArtifactProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <ArtifactContainer
      artifactId={artifactId}
      variant="report"
      isLoading={isLoading}
      error={error}
      className="print:shadow-none print:border-0"
    >
      <ArtifactHeader
        title={title}
        subtitle={subtitle}
        icon={<FileText className="w-5 h-5" />}
        variant="report"
        actions={
          showActions && (
            <div className="flex items-center gap-2 print:hidden">
              {customActions}
              <button
                onClick={handlePrint}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Print report"
              >
                <Printer className="w-4 h-4" />
              </button>
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        }
      />

      {/* Metadata Bar */}
      {metadata && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-4 text-xs text-gray-600 print:bg-white">
          {metadata.customer && (
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-gray-400" />
              <span>{metadata.customer}</span>
            </div>
          )}
          {metadata.author && (
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span>{metadata.author}</span>
            </div>
          )}
          {metadata.date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>{metadata.date}</span>
            </div>
          )}
          {metadata.version && (
            <div className="text-gray-400">
              v{metadata.version}
            </div>
          )}
        </div>
      )}

      <div className="px-6 py-6 space-y-6">
        {/* Executive Summary */}
        {executiveSummary && (
          <ArtifactSection
            title="Executive Summary"
            titleSize="lg"
            variant="highlighted"
            padding="md"
          >
            <p className="text-sm text-gray-700 leading-relaxed">{executiveSummary}</p>
          </ArtifactSection>
        )}

        {/* Report Sections */}
        {sections.map((section) => (
          <ArtifactSection
            key={section.id}
            sectionId={section.id}
            title={section.title}
            titleSize="base"
            variant="transparent"
            padding="none"
          >
            <ReportSectionRenderer section={section} />
          </ArtifactSection>
        ))}
      </div>

      {/* Footer Navigation */}
      {(onBack || onContinue) && (
        <ArtifactFooter align="between" className="print:hidden">
          {onBack ? (
            <button
              onClick={onBack}
              className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-900"
            >
              Back
            </button>
          ) : (
            <div />
          )}
          {onContinue && (
            <button
              onClick={onContinue}
              className="px-5 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium"
            >
              Continue
            </button>
          )}
        </ArtifactFooter>
      )}
    </ArtifactContainer>
  );
}

ReportArtifact.displayName = 'ReportArtifact';
export default ReportArtifact;
