import React from 'react';
import { ArtifactsConfig } from '../config/WorkflowConfig';

interface ArtifactsPanelProps {
  config: ArtifactsConfig;
  className?: string;
  workflowConfigName?: string; // Add this to identify which config is being used
}

const LicenseAnalysisSection = ({ content }: { content: any }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h3 className="font-semibold text-gray-800 mb-6 text-lg">License Analysis</h3>
    <div className="space-y-4 text-sm">
      <div className="flex justify-between items-center py-2 border-b border-gray-100">
        <span className="text-gray-600">Current License:</span>
        <span className="font-medium">
          {content.currentLicense.tokens.toLocaleString()} tokens @ ${content.currentLicense.unitPrice} - <strong>${content.currentLicense.total.toLocaleString()}</strong>
        </span>
      </div>
      <div className="flex justify-between items-center py-2 border-b border-gray-100">
        <span className="text-gray-600">Anticipated Renewal Cost:</span>
        <span className="font-medium">
          {content.anticipatedRenewal.tokens.toLocaleString()} tokens @ ${content.anticipatedRenewal.unitPrice} = <strong>${content.anticipatedRenewal.total.toLocaleString()}</strong>
        </span>
      </div>
      <div className="flex justify-between items-center py-2 border-b border-gray-100">
        <span className="text-gray-600">Early Renewal Discount:</span>
        <span className="font-medium text-orange-600">
          {content.earlyDiscount.percentage}% - <strong>${content.earlyDiscount.total.toLocaleString()}</strong>
        </span>
      </div>
      <div className="flex justify-between items-center py-2">
        <span className="text-gray-600">Multi-year Discount:</span>
        <span className="font-medium text-green-600">
          {content.multiYearDiscount.percentage}% - <strong>${content.multiYearDiscount.total.toLocaleString()}</strong>
        </span>
      </div>
    </div>
  </div>
);

const EmailDraftSection = ({ content }: { content: any }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="font-semibold text-gray-800 text-lg">Draft Email</h3>
      <div className="flex space-x-2">
        <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
          Edit
        </button>
        <button className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">
          Send
        </button>
      </div>
    </div>

    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-3 gap-4 text-xs text-gray-500 border-b border-gray-100 pb-4">
        <div>
          <span className="block font-medium">To:</span>
          <span>{content.to}</span>
        </div>
        <div>
          <span className="block font-medium">Subject:</span>
          <span>{content.subject}</span>
        </div>
        <div>
          <span className="block font-medium">Priority:</span>
          <span>{content.priority}</span>
        </div>
      </div>

      <div className="space-y-4 leading-relaxed">
        {content.body.map((paragraph: string, i: number) => {
          if (paragraph.includes('\n')) {
            const [text, signature] = paragraph.split('\n');
            return (
              <div key={i} className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-gray-600">{text}<br/>{signature}</p>
              </div>
            );
          }
          return <p key={i}>{paragraph}</p>;
        })}
      </div>
    </div>
  </div>
);

const HtmlSection = ({ section }: { section: any }) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    {section.styles && (
      <style dangerouslySetInnerHTML={{ __html: section.styles }} />
    )}
    <div
      className="html-artifact-content"
      dangerouslySetInnerHTML={{ __html: section.htmlContent || '' }}
    />
  </div>
);

const CustomSection = ({ section }: { section: any }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h3 className="font-semibold text-gray-800 mb-6 text-lg">{section.title}</h3>
    <div className="text-sm text-gray-600">
      {JSON.stringify(section.content, null, 2)}
    </div>
  </div>
);

const ArtifactsPanel: React.FC<ArtifactsPanelProps> = ({ config, className = '', workflowConfigName = 'bluebird-planning' }) => {
  const visibleSections = config.sections.filter(s => s.visible);

  return (
    <div className={`bg-gray-50 h-full ${className}`}>
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="font-semibold text-gray-800">Artifacts</h3>
      </div>
      <div 
        className="p-6 text-gray-700" 
        style={{ 
          height: 'calc(100% - 60px)',
          overflowY: 'scroll'
        }}
      >
        <div className="space-y-8">
          {visibleSections.map((section) => {
            switch (section.type) {
              case 'license-analysis':
                return <LicenseAnalysisSection key={section.id} content={section.content} />;
              case 'email-draft':
                return <EmailDraftSection key={section.id} content={section.content} />;
              case 'html':
                return <HtmlSection key={section.id} section={section} />;
              case 'custom':
                return <CustomSection key={section.id} section={section} />;
              default:
                return null;
            }
          })}
        </div>
      </div>
    </div>
  );
};

export default ArtifactsPanel;