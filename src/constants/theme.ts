// Zeni App Theme - Modern Design with Blue Primary Color

// Primary brand color
export const brandColors = {
  primary: '#017DE9',      // Zeni Blue - primary brand color
  primaryLight: 'rgba(1, 125, 233, 0.1)',
  primaryDark: '#0165BB',
};

// Accent colors for interactive elements
export const accentColors = {
  primary: '#017DE9',      // Zeni Blue - primary actions
  accent: '#FF5722',       // Deep orange - highlight/accent
  accentLight: '#FFF3E0',  // Light orange tint
  success: '#22c55e',      // Green for success states
  error: '#ef4444',        // Red for errors
  warning: '#f59e0b',      // Orange for warnings
};

// Light theme colors
export const lightColors = {
  // Primary colors (Zeni Blue)
  primary: '#017DE9',
  primaryLight: 'rgba(1, 125, 233, 0.08)',
  primaryDark: '#0165BB',
  
  // Accent color for highlights
  accent: '#8b5cf6',
  accentLight: 'rgba(139, 92, 246, 0.1)',
  
  // Neutral backgrounds
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F8FAFC',
  iconBackground: '#F1F5F9',
  
  // Text colors - hierarchy
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  textInverse: '#FFFFFF',
  
  // Status colors
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#017DE9',
  
  // Border and dividers
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  divider: '#e2e8f0',
  
  // Shadows
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowDark: 'rgba(0, 0, 0, 0.15)',
  
  // Feature icon colors
  scanIcon: '#017DE9',
  editIcon: '#22c55e',
  convertIcon: '#8b5cf6',
  askAiIcon: '#f59e0b',
  
  // Document type icon colors
  uploadedIcon: '#06b6d4',    // Cyan for uploaded
  faxedIcon: '#ec4899',       // Pink for faxed
  importedIcon: '#14b8a6',    // Teal for imported
  
  // Action icon colors
  shareIcon: '#3b82f6',       // Blue for share
  deleteIcon: '#ef4444',      // Red for delete
  folderIcon: '#f59e0b',      // Amber for folders
  notificationIcon: '#8b5cf6', // Purple for notifications
  settingsIcon: '#64748b',    // Slate for settings
  profileIcon: '#06b6d4',     // Cyan for profile
  
  // Legacy support
  blue: '#017DE9',
  blueLight: 'rgba(1, 125, 233, 0.08)',
  blueDark: '#0165BB',
};

// Dark theme colors
export const darkColors = {
  // Primary colors (Zeni Blue for dark mode)
  primary: '#3b9eff',
  primaryLight: 'rgba(59, 158, 255, 0.12)',
  primaryDark: '#017DE9',
  
  // Accent color for highlights
  accent: '#a78bfa',
  accentLight: 'rgba(167, 139, 250, 0.15)',
  
  // True dark backgrounds (comfortable dark, not pure black)
  background: '#121212',
  surface: '#1e1e1e',
  surfaceSecondary: '#2a2a2a',
  iconBackground: '#2a2a2a',
  
  // Text colors - hierarchy
  textPrimary: '#ffffff',
  textSecondary: '#ebebf5',
  textTertiary: '#8e8e93',
  textInverse: '#000000',
  
  // Status colors
  success: '#4ade80',
  error: '#f87171',
  warning: '#fbbf24',
  info: '#3b9eff',
  
  // Border and dividers
  border: '#38383a',
  borderLight: '#2c2c2e',
  divider: '#38383a',
  
  // Shadows
  shadow: 'rgba(0, 0, 0, 0.4)',
  shadowDark: 'rgba(0, 0, 0, 0.6)',
  
  // Feature icon colors
  scanIcon: '#3b9eff',
  editIcon: '#4ade80',
  convertIcon: '#a78bfa',
  askAiIcon: '#fbbf24',
  
  // Document type icon colors
  uploadedIcon: '#22d3ee',    // Cyan for uploaded
  faxedIcon: '#f472b6',       // Pink for faxed
  importedIcon: '#2dd4bf',    // Teal for imported
  
  // Action icon colors
  shareIcon: '#60a5fa',       // Blue for share
  deleteIcon: '#f87171',      // Red for delete
  folderIcon: '#fbbf24',      // Amber for folders
  notificationIcon: '#a78bfa', // Purple for notifications
  settingsIcon: '#94a3b8',    // Slate for settings
  profileIcon: '#22d3ee',     // Cyan for profile
  
  // Legacy support
  blue: '#3b9eff',
  blueLight: 'rgba(59, 158, 255, 0.15)',
  blueDark: '#017DE9',
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
