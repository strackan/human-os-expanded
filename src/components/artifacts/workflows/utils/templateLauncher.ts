import { getTemplateGroup, availableConfigs } from '../config/templateGroups';

export interface LaunchOptions {
  width?: number;
  height?: number;
  features?: string;
}

const defaultLaunchOptions: LaunchOptions = {
  width: 1400,
  height: 900,
  features: 'menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes'
};

/**
 * Launch a single template in a clean standalone window
 */
export const launchTemplate = (configName: string, options: LaunchOptions = {}): Window | null => {
  const { width, height, features } = { ...defaultLaunchOptions, ...options };

  // Validate config exists
  if (!availableConfigs.includes(configName)) {
    console.warn(`Template config "${configName}" not found in available configs`);
    return null;
  }

  const url = `/standalone-viewer?config=${configName}`;
  const windowFeatures = features || `width=${width},height=${height},menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes`;

  return window.open(url, '_blank', windowFeatures);
};

/**
 * Launch a template group sequence in a clean standalone window
 */
export const launchTemplateGroup = (groupId: string, startIndex: number = 0, options: LaunchOptions = {}): Window | null => {
  const group = getTemplateGroup(groupId);
  if (!group) {
    console.warn(`Template group "${groupId}" not found`);
    return null;
  }

  if (group.templates.length === 0) {
    console.warn(`Template group "${groupId}" has no templates`);
    return null;
  }

  if (startIndex >= group.templates.length) {
    console.warn(`Start index ${startIndex} is out of range for group "${groupId}"`);
    return null;
  }

  const { width, height, features } = { ...defaultLaunchOptions, ...options };
  const url = `/standalone-viewer?group=${groupId}&index=${startIndex}`;
  const windowFeatures = features || `width=${width},height=${height},menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes`;

  return window.open(url, '_blank', windowFeatures);
};

/**
 * Launch template by customer naming convention (customer-scenario)
 */
export const launchCustomerTemplate = (customerName: string, scenario: string = 'planning', options: LaunchOptions = {}): Window | null => {
  const configName = `${customerName.toLowerCase()}-${scenario.toLowerCase()}`;
  return launchTemplate(configName, options);
};

/**
 * Resolve template name using various strategies
 */
export const resolveTemplateName = (input: string): string | null => {
  // Direct match
  if (availableConfigs.includes(input)) {
    return input;
  }

  // Try with common suffixes
  const commonSuffixes = ['planning', 'renewal', 'expansion', 'risk'];
  for (const suffix of commonSuffixes) {
    const withSuffix = `${input}-${suffix}`;
    if (availableConfigs.includes(withSuffix)) {
      return withSuffix;
    }
  }

  // Try partial matches
  const partialMatch = availableConfigs.find(config =>
    config.toLowerCase().includes(input.toLowerCase())
  );

  return partialMatch || null;
};

/**
 * Get demo launch URL for sharing or embedding
 */
export const getDemoUrl = (configOrGroupId: string, isGroup: boolean = false, index: number = 0): string => {
  const baseUrl = window.location.origin;

  if (isGroup) {
    return `${baseUrl}/standalone-viewer?group=${configOrGroupId}&index=${index}`;
  } else {
    return `${baseUrl}/standalone-viewer?config=${configOrGroupId}`;
  }
};

/**
 * Launch template with error handling and user feedback
 */
export const safeLaunchTemplate = (configName: string, options: LaunchOptions = {}): boolean => {
  try {
    const window = launchTemplate(configName, options);
    if (!window) {
      alert(`Failed to launch template "${configName}". Please check if the template exists.`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error launching template:', error);
    alert(`Failed to launch template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

/**
 * Launch template group with error handling and user feedback
 */
export const safeLaunchTemplateGroup = (groupId: string, startIndex: number = 0, options: LaunchOptions = {}): boolean => {
  try {
    const window = launchTemplateGroup(groupId, startIndex, options);
    if (!window) {
      alert(`Failed to launch template group "${groupId}". Please check if the group exists.`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error launching template group:', error);
    alert(`Failed to launch template group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};