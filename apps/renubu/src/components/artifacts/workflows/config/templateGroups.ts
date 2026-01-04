export interface TemplateGroup {
  id: string;
  name: string;
  description: string;
  templates: string[]; // Array of config names
  currentIndex?: number;
  tags?: string[];
}

// Registry of available template groups for demos
export const templateGroups: Record<string, TemplateGroup> = {
  'healthcare-demo': {
    id: 'healthcare-demo',
    name: 'Healthcare Demo',
    description: 'Complete healthcare customer journey demo',
    templates: ['bluebird-planning'],
    tags: ['healthcare', 'hospital', 'demo']
  },
  'enterprise-demo': {
    id: 'enterprise-demo',
    name: 'Enterprise Demo',
    description: 'Enterprise customer workflow demonstration',
    templates: ['acme', 'intrasoft'],
    tags: ['enterprise', 'b2b', 'demo']
  },
  'demo-VIP': {
    id: 'demo-VIP',
    name: 'VIP Demo Suite',
    description: 'Comprehensive demo showcasing all workflow capabilities',
    templates: [
      'price-increase-flat',
      'strategic-engagement',
      'quote-artifact',
      'contract-analysis',
      'strategic-planning',
      'price-optimization'
    ],
    tags: ['demo', 'vip', 'comprehensive', 'workflow']
  },
  'dynamic-chat-demo': {
    id: 'dynamic-chat-demo',
    name: 'Dynamic Chat Demo',
    description: 'Demonstrates the new dynamic conversation flow with conditional branching and artifact launching',
    templates: ['dynamic-ai', 'dynamic-user', 'simple-dynamic'],
    tags: ['demo', 'dynamic', 'chat', 'conversation', 'interactive']
  },
  'demo-v1': {
    id: 'demo-v1',
    name: 'Demo V1',
    description: 'Combined demo: Bluebird Memorial traditional mode followed by dynamic AI slide-based mode',
    templates: ['bluebird-planning', 'dynamic-ai'],
    tags: ['demo', 'v1', 'combined', 'traditional', 'dynamic']
  },
  'artifact-showcase-suite': {
    id: 'artifact-showcase-suite',
    name: 'Artifact Showcase Suite',
    description: 'Comprehensive demos showcasing all artifact types and their integration in real-world workflows',
    templates: [
      'all-artifacts-master-demo',
      'planning-checklist-demo',
      'contact-strategy-demo',
      'contract-demo',
      'pricing-analysis-demo',
      'plan-summary-demo'
    ],
    tags: ['artifacts', 'showcase', 'comprehensive', 'training', 'demo']
  }
};

// Get all available config names from the existing mapping
export const availableConfigs = [
  'bluebird-planning',
  'acme',
  'intrasoft',
  'price-increase-flat',
  'strategic-engagement',
  'quote-artifact',
  'contract-analysis',
  'strategic-planning',
  'price-optimization',
  'simple-dynamic',
  'dynamic-ai',
  'dynamic-user',
  // Artifact Showcase Demos
  'planning-checklist-demo',
  'contract-demo',
  'contact-strategy-demo',
  'plan-summary-demo',
  'pricing-analysis-demo',
  'all-artifacts-master-demo'
];

// Helper functions
export const getTemplateGroup = (groupId: string): TemplateGroup | null => {
  return templateGroups[groupId] || null;
};

export const getAllTemplateGroups = (): TemplateGroup[] => {
  return Object.values(templateGroups);
};

export const createTemplateGroup = (group: Omit<TemplateGroup, 'id'>): TemplateGroup => {
  const id = group.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return {
    ...group,
    id
  };
};

export const addTemplateGroup = (group: TemplateGroup): void => {
  templateGroups[group.id] = group;
};

export const removeTemplateGroup = (groupId: string): void => {
  delete templateGroups[groupId];
};

export const getNextTemplateInGroup = (groupId: string, currentIndex: number): string | null => {
  const group = getTemplateGroup(groupId);
  if (!group || currentIndex >= group.templates.length - 1) {
    return null;
  }
  return group.templates[currentIndex + 1];
};

export const isLastTemplateInGroup = (groupId: string, currentIndex: number): boolean => {
  const group = getTemplateGroup(groupId);
  if (!group) return true;
  return currentIndex >= group.templates.length - 1;
};