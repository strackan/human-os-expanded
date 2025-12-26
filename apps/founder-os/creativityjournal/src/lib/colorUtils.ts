// Utility function to determine if a color is dark
export const isColorDark = (hexColor: string): boolean => {
  // Remove # if present
  const color = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  // Calculate relative luminance using the formula for perceived brightness
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // If luminance is less than 0.5, it's considered dark
  return luminance < 0.5;
};

// Get appropriate text color based on background color
export const getTextColor = (backgroundColor: string): string => {
  return isColorDark(backgroundColor) ? '#ffffff' : '#000000';
}; 