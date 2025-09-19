import React, { useEffect, useState } from 'react';
import DirectWorkflowView from './DirectWorkflowView';
import { acmeCorpConfig, intrasoftConfig } from './config/configs';
import { bluebirdMemorialPlanningConfig } from './config/configs/BluebirdMemorialConfig-Planning';
import { WorkflowConfig } from './config/WorkflowConfig';

// Config mapping for easy lookup
const configMap: Record<string, WorkflowConfig> = {
  'acme': acmeCorpConfig,
  'intrasoft': intrasoftConfig,
  'bluebird-planning': bluebirdMemorialPlanningConfig,
};

// Config name mapping for proper display
const configNames: Record<string, string> = {
  'acme': 'acme',
  'intrasoft': 'intrasoft',
  'bluebird-planning': 'bluebird-planning',
};

const StandaloneArtifactViewer: React.FC = () => {
  const [config, setConfig] = useState<WorkflowConfig | null>(null);
  const [configName, setConfigName] = useState<string>('');

  useEffect(() => {
    // Get config from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const configParam = urlParams.get('config');
    const artifactParam = urlParams.get('artifact');

    if (configParam && configMap[configParam]) {
      setConfig(configMap[configParam]);
      setConfigName(configParam);

      // Update document title
      document.title = `${configMap[configParam].customer.name} - Workflow`;
    } else {
      // Default to Bluebird if no config specified
      setConfig(bluebirdMemorialPlanningConfig);
      setConfigName('bluebird-planning');
      document.title = 'Workflow Viewer';
    }
  }, []);

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
      />
    </>
  );
};

export default StandaloneArtifactViewer;