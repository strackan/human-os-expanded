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
  'price-optimization'
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