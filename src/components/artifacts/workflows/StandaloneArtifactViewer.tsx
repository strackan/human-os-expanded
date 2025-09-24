import React, { useEffect, useState } from 'react';
import DirectWorkflowView from './DirectWorkflowView';
import { 
  acmeCorpConfig, 
  intrasoftConfig,
  bluebirdMemorialPlanningConfig,
  priceIncreaseFlatConfig,
  strategicEngagementConfig,
  quoteArtifactConfig,
  contractAnalysisConfig,
  strategicPlanningConfig,
  priceOptimizationConfig
} from './config/configs';
import { WorkflowConfig } from './config/WorkflowConfig';
import { getTemplateGroup, getNextTemplateInGroup, isLastTemplateInGroup } from './config/templateGroups';

// Config mapping for easy lookup
const configMap: Record<string, WorkflowConfig> = {
  'acme': acmeCorpConfig,
  'intrasoft': intrasoftConfig,
  'bluebird-planning': bluebirdMemorialPlanningConfig,
  'price-increase-flat': priceIncreaseFlatConfig,
  'strategic-engagement': strategicEngagementConfig,
  'quote-artifact': quoteArtifactConfig,
  'contract-analysis': contractAnalysisConfig,
  'strategic-planning': strategicPlanningConfig,
  'price-optimization': priceOptimizationConfig,
};

// Config name mapping for proper display
const configNames: Record<string, string> = {
  'acme': 'acme',
  'intrasoft': 'intrasoft',
  'bluebird-planning': 'bluebird-planning',
  'price-increase-flat': 'price-increase-flat',
  'strategic-engagement': 'strategic-engagement',
  'quote-artifact': 'quote-artifact',
  'contract-analysis': 'contract-analysis',
  'strategic-planning': 'strategic-planning',
  'price-optimization': 'price-optimization',
};

interface StandaloneArtifactViewerProps {
  configName?: string;
  groupId?: string;
  groupIndex?: number;
  onClose?: () => void;
}

const StandaloneArtifactViewer: React.FC<StandaloneArtifactViewerProps> = ({
  configName: propConfigName,
  groupId: propGroupId,
  groupIndex: propGroupIndex,
  onClose
}) => {
  const [config, setConfig] = useState<WorkflowConfig | null>(null);
  const [configName, setConfigName] = useState<string>('');
  const [groupId, setGroupId] = useState<string>('');
  const [groupIndex, setGroupIndex] = useState<number>(0);
  const [isGroupMode, setIsGroupMode] = useState<boolean>(false);

  const handleNextCustomer = () => {
    if (!isGroupMode) return;

    const nextTemplate = getNextTemplateInGroup(groupId, groupIndex);
    if (nextTemplate) {
      // Navigate to next template in the group
      const newIndex = groupIndex + 1;
      const newUrl = `${window.location.pathname}?group=${groupId}&index=${newIndex}`;
      window.history.pushState({}, '', newUrl);

      // Update state
      setGroupIndex(newIndex);
      setConfigName(nextTemplate);

      // Load the new config
      if (configMap[nextTemplate]) {
        setConfig(configMap[nextTemplate]);
        document.title = `${configMap[nextTemplate].customer.name} - Workflow (${newIndex + 1} of ${getTemplateGroup(groupId)?.templates.length || 1})`;
      }
    } else {
      // Show completion message
      alert("That's it for now! You've completed the demo sequence.");
    }
  };

  useEffect(() => {
    // Check if props are provided first, otherwise fall back to URL parameters
    let configParam = propConfigName;
    let groupParam = propGroupId;
    let indexParam = propGroupIndex?.toString();

    // If no props provided, get from URL parameters
    if (!configParam && !groupParam) {
      const urlParams = new URLSearchParams(window.location.search);
      configParam = urlParams.get('config');
      groupParam = urlParams.get('group');
      indexParam = urlParams.get('index');
    }

    if (groupParam) {
      // Group mode
      const group = getTemplateGroup(groupParam);
      if (group && group.templates.length > 0) {
        const index = parseInt(indexParam || '0', 10);
        const templateName = group.templates[index] || group.templates[0];

        setIsGroupMode(true);
        setGroupId(groupParam);
        setGroupIndex(index);
        setConfigName(templateName);

        if (configMap[templateName]) {
          setConfig(configMap[templateName]);
          document.title = `${configMap[templateName].customer.name} - Workflow (${index + 1} of ${group.templates.length})`;
        } else {
          // Fallback if template not found
          setConfig(bluebirdMemorialPlanningConfig);
          setConfigName('bluebird-planning');
          document.title = 'Workflow Viewer';
        }
      } else {
        // Group not found, fallback to default
        setConfig(bluebirdMemorialPlanningConfig);
        setConfigName('bluebird-planning');
        document.title = 'Workflow Viewer';
      }
    } else if (configParam && configMap[configParam]) {
      // Single config mode
      setIsGroupMode(false);
      setConfig(configMap[configParam]);
      setConfigName(configParam);
      document.title = `${configMap[configParam].customer.name} - Workflow`;
    } else {
      // Default to Bluebird if no config specified
      setIsGroupMode(false);
      setConfig(bluebirdMemorialPlanningConfig);
      setConfigName('bluebird-planning');
      document.title = 'Workflow Viewer';
    }
  }, [propConfigName, propGroupId, propGroupIndex]);

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Workflow...</h2>
          <p className="text-gray-600">Preparing the standalone viewer</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DirectWorkflowView
        config={config}
        configName={configName}
        onNextCustomer={isGroupMode ? handleNextCustomer : undefined}
        groupProgress={isGroupMode ? `${groupIndex + 1} of ${getTemplateGroup(groupId)?.templates.length || 1}` : undefined}
        onClose={onClose}
      />
    </>
  );
};

export default StandaloneArtifactViewer;