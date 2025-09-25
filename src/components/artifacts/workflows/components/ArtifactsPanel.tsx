/**
 * ArtifactsPanel Component with Collapsible Side Menu
 * 
 * Features:
 * - Collapsible side menu that extends to the right of artifacts
 * - Three methods: showSideMenu(), removeSideMenu(), toggleSideMenu()
 * - Keyboard accessible with proper ARIA labels
 * - Callback support for parent components to track state changes
 * - Ref-based API for programmatic control
 * 
 * Usage:
 * ```tsx
 * const sideMenuRef = useRef();
 * 
 * // Programmatically control side menu
 * sideMenuRef.current?.showSideMenu();
 * sideMenuRef.current?.removeSideMenu();
 * sideMenuRef.current?.toggleSideMenu();
 * 
 * <ArtifactsPanel
 *   config={config}
 *   sideMenuRef={sideMenuRef}
 *   onSideMenuToggle={(isVisible) => console.log('Side menu visible:', isVisible)}
 * />
 * ```
 */

import React, { useState, useImperativeHandle, useEffect } from 'react';
import { ArtifactsConfig } from '../config/WorkflowConfig';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ArtifactsPanelProps {
  config: ArtifactsConfig;
  className?: string;
  workflowConfigName?: string; // Add this to identify which config is being used
  visibleArtifacts?: Set<string>; // For dynamic mode - controls which artifacts are visible
  onSideMenuToggle?: (isVisible: boolean) => void; // Callback for side menu state changes
  sideMenuRef?: React.RefObject<{
    showSideMenu: () => void;
    removeSideMenu: () => void;
    toggleSideMenu: () => void;
  }>; // Ref to expose side menu methods to parent components
}

interface SideMenuState {
  isVisible: boolean;
  isCollapsed: boolean;
}

// Typing animation component for artifact content
const TypingText = ({ text, speed = 10 }: { text: string; speed?: number }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  return <span>{displayedText}</span>;
};

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

const EmailDraftSection = ({ content }: { content: any }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show content with typing animation after a short delay
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
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
            <span>{showContent ? <TypingText text={content.to} speed={13} /> : ''}</span>
          </div>
          <div>
            <span className="block font-medium">Subject:</span>
            <span>{showContent ? <TypingText text={content.subject} speed={13} /> : ''}</span>
          </div>
          <div>
            <span className="block font-medium">Priority:</span>
            <span>{showContent ? <TypingText text={content.priority || 'Normal'} speed={13} /> : ''}</span>
          </div>
        </div>

        <div className="space-y-4 leading-relaxed">
          {showContent && content.body && (
            <div className="text-gray-600">
              <TypingText text={content.body} speed={10} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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

// Side Menu Component
interface SideMenuProps {
  isVisible: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onRemove: () => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ isVisible, isCollapsed, onToggleCollapse, onRemove }) => {
  if (!isVisible) return null;

  return (
    <div 
      className={`bg-white border-l border-gray-200 shadow-lg transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-12' : 'w-48'
      }`}
      style={{ height: '100%' }}
    >
      {/* Side Menu Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        {!isCollapsed && (
          <h4 className="text-sm font-medium text-gray-700">Side Menu</h4>
        )}
        <div className="flex items-center space-x-1">
          <button
            onClick={onToggleCollapse}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleCollapse();
              }
            }}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
            title={isCollapsed ? "Expand menu" : "Collapse menu"}
            tabIndex={0}
            aria-label={isCollapsed ? "Expand menu" : "Collapse menu"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onRemove}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onRemove();
              }
            }}
            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
            title="Close menu"
            tabIndex={0}
            aria-label="Close side menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Side Menu Content */}
      {!isCollapsed && (
        <div className="p-4 space-y-4">
          <div className="text-sm text-gray-600">
            <h5 className="font-medium text-gray-800 mb-2">Placeholder Content</h5>
            <p className="text-xs text-gray-500 mb-3">
              This is placeholder content for the side menu. You can add any functionality here.
            </p>
            
            <div className="space-y-2">
              <div className="p-2 bg-blue-50 rounded border border-blue-200">
                <p className="text-xs font-medium text-blue-800">Feature 1</p>
                <p className="text-xs text-blue-600">Description of feature</p>
              </div>
              
              <div className="p-2 bg-green-50 rounded border border-green-200">
                <p className="text-xs font-medium text-green-800">Feature 2</p>
                <p className="text-xs text-green-600">Another feature description</p>
              </div>
              
              <div className="p-2 bg-purple-50 rounded border border-purple-200">
                <p className="text-xs font-medium text-purple-800">Feature 3</p>
                <p className="text-xs text-purple-600">Third feature description</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ArtifactsPanel: React.FC<ArtifactsPanelProps> = ({ config, className = '', workflowConfigName = 'bluebird-planning', visibleArtifacts, onSideMenuToggle, sideMenuRef }) => {
  // Side menu state
  const [sideMenuState, setSideMenuState] = useState<SideMenuState>({
    isVisible: false,
    isCollapsed: false
  });

  const visibleSections = config.sections.filter(s => {
    // If visibleArtifacts is provided (dynamic mode), use it to filter
    if (visibleArtifacts !== undefined) {
      return visibleArtifacts.has(s.id);
    }
    // Otherwise, use the default visibility from config
    return s.visible;
  });

  // Side menu methods
  const showSideMenu = () => {
    setSideMenuState(prev => ({
      ...prev,
      isVisible: true,
      isCollapsed: false
    }));
    onSideMenuToggle?.(true);
  };

  const removeSideMenu = () => {
    setSideMenuState(prev => ({
      ...prev,
      isVisible: false,
      isCollapsed: false
    }));
    onSideMenuToggle?.(false);
  };

  const toggleSideMenu = () => {
    setSideMenuState(prev => ({
      ...prev,
      isCollapsed: !prev.isCollapsed
    }));
  };

  // Expose side menu methods to parent components via ref
  useImperativeHandle(sideMenuRef, () => ({
    showSideMenu,
    removeSideMenu,
    toggleSideMenu
  }), []);

  return (
    <div className={`bg-gray-50 h-full ${className}`}>
      <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Artifacts</h3>
        <div className="flex items-center space-x-2">
          {!sideMenuState.isVisible && (
          <button
            onClick={showSideMenu}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showSideMenu();
              }
            }}
            className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            title="Show side menu"
            tabIndex={0}
            aria-label="Show side menu"
          >
            Show Menu
          </button>
          )}
        </div>
      </div>
      <div className="flex h-full" style={{ height: 'calc(100% - 60px)' }}>
        <div
          className="p-6 text-gray-700 flex-1"
          style={{
            overflowY: 'scroll'
          }}
        >
          {visibleSections.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">📄</div>
                <p>No artifacts yet</p>
                <p className="text-sm mt-2">Artifacts will appear here as you interact</p>
              </div>
            </div>
          ) : (
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
          )}
        </div>
        
        {/* Side Menu */}
        <SideMenu
          isVisible={sideMenuState.isVisible}
          isCollapsed={sideMenuState.isCollapsed}
          onToggleCollapse={toggleSideMenu}
          onRemove={removeSideMenu}
        />
      </div>
    </div>
  );
};

export default ArtifactsPanel;