// Zeni App Theme - Minimalist Grayscale Design with Accent Colors

// Accent colors for interactive elements
export const accentColors = {
  primary: '#000000',      // Black - primary actions
  accent: '#FF5722',       // Deep orange - highlight/accent
  accentLight: '#FFF3E0',  // Light orange tint
  success: '#4CAF50',      // Green for success states
  error: '#F44336',        // Red for errors
  warning: '#FF9800',      // Orange for warnings
};

// Light theme colors - Grayscale with accents
export const lightColors = {
  // Primary colors (Blue for interactive elements)
  primary: '#3A7CFF',
  primaryLight: 'rgba(58, 124, 255, 0.08)',
  primaryDark: '#2E63CC',
  
  // Accent color for highlights
  accent: '#FF5722',
  accentLight: '#FFF3E0',
  
  // Neutral grayscale
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSecondary: 'rgba(0, 0, 0, 0.015)',
  iconBackground: 'rgba(0, 0, 0, 0.02)',
  
  // Text colors - grayscale hierarchy
  textPrimary: '#000000',
  textSecondary: '#555555',
  textTertiary: '#888888',
  textInverse: '#FFFFFF',
  
  // Status colors (only these have color)
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#000000',
  
  // Border and dividers - subtle grays
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  divider: '#EEEEEE',
  
  // Shadows
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowDark: 'rgba(0, 0, 0, 0.15)',
  
  // Icon colors - grayscale
  scanIcon: '#000000',
  editIcon: '#333333',
  convertIcon: '#333333',
  askAiIcon: '#333333',
  
  // Keep blue for backward compatibility but won't use
  blue: '#000000',
  blueLight: 'rgba(0, 0, 0, 0.02)',
  blueDark: '#000000',
};

// Dark theme colors - Grayscale with accents
export const darkColors = {
  // Primary colors (Blue for interactive elements)
  primary: '#5A94FF',
  primaryLight: 'rgba(90, 148, 255, 0.12)',
  primaryDark: '#3A7CFF',
  
  // Accent color for highlights
  accent: '#FF7043',
  accentLight: '#3D2A24',
  
  // Neutral grayscale
  background: '#0A0A0A',
  surface: '#141414',
  surfaceSecondary: 'rgba(255, 255, 255, 0.025)',
  iconBackground: 'rgba(255, 255, 255, 0.03)',
  
  // Text colors - grayscale hierarchy
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA',
  textTertiary: '#666666',
  textInverse: '#000000',
  
  // Status colors
  success: '#66BB6A',
  error: '#EF5350',
  warning: '#FFA726',
  info: '#FFFFFF',
  
  // Border and dividers
  border: '#333333',
  borderLight: '#222222',
  divider: '#2A2A2A',
  
  // Shadows
  shadow: 'rgba(0, 0, 0, 0.4)',
  shadowDark: 'rgba(0, 0, 0, 0.6)',
  
  // Icon colors
  scanIcon: '#FFFFFF',
  editIcon: '#CCCCCC',
  convertIcon: '#CCCCCC',
  askAiIcon: '#CCCCCC',
  
  // Keep for backward compatibility
  blue: '#FFFFFF',
  blueLight: 'rgba(255, 255, 255, 0.02)',
  blueDark: '#FFFFFF',
};

// Default to light colors for backward compatibility
export const colors = lightColors;

export type ThemeColors = typeof lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 9999,
};

export const typography = {
  // Font families (using system fonts for now)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
  
  // Font sizes
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

export default {
  colors,
  lightColors,
  darkColors,
  spacing,
  borderRadius,
  typography,
  shadows,
};
