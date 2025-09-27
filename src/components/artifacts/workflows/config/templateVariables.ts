import { chartTemplates, getChartTemplate } from './chartTemplates';

export interface TemplateVariable {
  type: 'chart' | 'customer' | 'user' | 'date' | 'number' | 'text';
  category?: string;
  subcategory?: string;
  property?: string;
  defaultValue?: any;
}

// Template variable patterns and their resolvers
export const templateVariables: Record<string, TemplateVariable> = {
  // Chart templates
  'chart.yoyGrowth.falling': { type: 'chart', category: 'yoyGrowth', subcategory: 'falling' },
  'chart.yoyGrowth.flat': { type: 'chart', category: 'yoyGrowth', subcategory: 'flat' },
  'chart.yoyGrowth.rising': { type: 'chart', category: 'yoyGrowth', subcategory: 'rising' },
  
  'chart.lastMonth.falling': { type: 'chart', category: 'lastMonth', subcategory: 'falling' },
  'chart.lastMonth.flat': { type: 'chart', category: 'lastMonth', subcategory: 'flat' },
  'chart.lastMonth.rising': { type: 'chart', category: 'lastMonth', subcategory: 'rising' },
  
  'chart.usageTrend.falling': { type: 'chart', category: 'usageTrend', subcategory: 'falling' },
  'chart.usageTrend.flat': { type: 'chart', category: 'usageTrend', subcategory: 'flat' },
  'chart.usageTrend.rising': { type: 'chart', category: 'usageTrend', subcategory: 'rising' },
  
  'chart.userLicenses.falling': { type: 'chart', category: 'userLicenses', subcategory: 'falling' },
  'chart.userLicenses.flat': { type: 'chart', category: 'userLicenses', subcategory: 'flat' },
  'chart.userLicenses.rising': { type: 'chart', category: 'userLicenses', subcategory: 'rising' },

  // Customer variables
  'customer.name': { type: 'customer', property: 'name', defaultValue: 'Customer Name' },
  'customer.arr': { type: 'customer', property: 'arr', defaultValue: '$0' },
  'customer.renewalDate': { type: 'customer', property: 'renewalDate', defaultValue: 'Jan 1, 2025' },
  'customer.primaryContact': { type: 'customer', property: 'primaryContact', defaultValue: 'John Doe' },
  'customer.riskScore': { type: 'customer', property: 'riskScore', defaultValue: '5.0/10' },
  'customer.growthScore': { type: 'customer', property: 'growthScore', defaultValue: '5.0/10' },

  // User variables
  'user.first': { type: 'user', property: 'first', defaultValue: 'User' },
  'user.last': { type: 'user', property: 'last', defaultValue: 'Name' },
  'user.email': { type: 'user', property: 'email', defaultValue: 'user@example.com' },

  // Date variables
  'date.today': { type: 'date', property: 'today', defaultValue: new Date().toLocaleDateString() },
  'date.renewal': { type: 'date', property: 'renewal', defaultValue: 'Feb 27th' },
  'date.daysUntilRenewal': { type: 'number', property: 'daysUntilRenewal', defaultValue: 7 },

  // Number variables
  'number.licenseCount': { type: 'number', property: 'licenseCount', defaultValue: 100 },
  'number.usagePercentage': { type: 'number', property: 'usagePercentage', defaultValue: 75 },
  'number.growthRate': { type: 'number', property: 'growthRate', defaultValue: 2.5 }
};

// Resolve template variables in a string
export const resolveTemplateVariables = (template: string, context: any = {}): string => {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, variablePath) => {
    const variable = templateVariables[variablePath];
    
    if (!variable) {
      console.warn(`Unknown template variable: ${variablePath}`);
      return match; // Return original if not found
    }

    // Handle chart templates
    if (variable.type === 'chart' && variable.category && variable.subcategory) {
      const chartTemplate = getChartTemplate(
        variable.category as any, 
        variable.subcategory as 'falling' | 'flat' | 'rising'
      );
      
      if (variable.property) {
        return chartTemplate[variable.property] || variable.defaultValue || '';
      }
      
      return JSON.stringify(chartTemplate);
    }

    // Handle other variable types
    const value = getNestedValue(context, variablePath) || variable.defaultValue || '';
    return String(value);
  });
};

// Helper function to get nested object values
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

// Predefined template sets for common scenarios
export const templateSets = {
  // Declining customer scenario
  declining: {
    yoyGrowth: 'chart.yoyGrowth.falling',
    lastMonth: 'chart.lastMonth.falling',
    usageTrend: 'chart.usageTrend.falling',
    userLicenses: 'chart.userLicenses.falling'
  },
  
  // Stable customer scenario
  stable: {
    yoyGrowth: 'chart.yoyGrowth.flat',
    lastMonth: 'chart.lastMonth.flat',
    usageTrend: 'chart.usageTrend.flat',
    userLicenses: 'chart.userLicenses.flat'
  },
  
  // Growing customer scenario
  growing: {
    yoyGrowth: 'chart.yoyGrowth.rising',
    lastMonth: 'chart.lastMonth.rising',
    usageTrend: 'chart.usageTrend.rising',
    userLicenses: 'chart.userLicenses.rising'
  }
};

// Apply a template set to a workflow config
export const applyTemplateSet = (config: any, templateSet: keyof typeof templateSets, context: any = {}) => {
  const templates = templateSets[templateSet];
  const resolvedConfig = JSON.parse(JSON.stringify(config)); // Deep clone
  
  // Apply chart templates
  Object.entries(templates).forEach(([chartType, templateVariable]) => {
    if (resolvedConfig.customerOverview?.metrics?.[chartType]) {
      const chartTemplate = getChartTemplate(
        chartType as any,
        templateVariable.split('.').pop() as 'falling' | 'flat' | 'rising'
      );
      resolvedConfig.customerOverview.metrics[chartType] = chartTemplate;
    }
  });
  
  return resolvedConfig;
};
