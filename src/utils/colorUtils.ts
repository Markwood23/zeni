// Color utility functions for generating color variants

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Lighten a color by a percentage
 */
export function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l = Math.min(100, hsl.l + percent);

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

/**
 * Darken a color by a percentage
 */
export function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l = Math.max(0, hsl.l - percent);

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

/**
 * Get luminance of a color (for contrast calculations)
 */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const a = [rgb.r, rgb.g, rgb.b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Check if a color is light or dark
 */
export function isLightColor(hex: string): boolean {
  return getLuminance(hex) > 0.5;
}

/**
 * Generate color variants from a primary color
 */
export interface ColorVariants {
  primary: string;
  primaryLight: string;
  primaryLightRgba: string;
  primaryDark: string;
  primaryText: string; // Text color that contrasts with primary
  // Icon colors - harmonious with primary
  scanIcon: string;
  editIcon: string;
  convertIcon: string;
  askAiIcon: string;
}

/**
 * Shift hue by degrees
 */
export function shiftHue(hex: string, degrees: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.h = (hsl.h + degrees + 360) % 360;

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

/**
 * Adjust saturation
 */
export function adjustSaturation(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.s = Math.max(0, Math.min(100, hsl.s + amount));

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

/**
 * Generate harmonious icon colors based on primary color
 * Uses analogous and complementary color theory
 */
export function generateIconColors(primaryColor: string, isDark: boolean = false): {
  scanIcon: string;
  editIcon: string;
  convertIcon: string;
  askAiIcon: string;
} {
  const primary = primaryColor.startsWith('#') ? primaryColor : `#${primaryColor}`;
  
  // Generate harmonious colors using color theory
  // Scan: Primary color (most important action)
  // Edit: Analogous (30° shift)
  // Convert: Complementary-adjacent (150° shift)
  // AI: Triadic (120° shift)
  
  const scanColor = primary;
  const editColor = shiftHue(primary, 30);
  const convertColor = shiftHue(primary, 150);
  const aiColor = shiftHue(primary, -60); // Purple-ish shift for AI
  
  if (isDark) {
    // Lighten colors for dark mode visibility
    return {
      scanIcon: lightenColor(scanColor, 10),
      editIcon: lightenColor(editColor, 10),
      convertIcon: lightenColor(convertColor, 10),
      askAiIcon: lightenColor(aiColor, 10),
    };
  }
  
  return {
    scanIcon: scanColor,
    editIcon: editColor,
    convertIcon: convertColor,
    askAiIcon: aiColor,
  };
}

export function generateColorVariants(primaryColor: string, isDark: boolean = false): ColorVariants {
  const primary = primaryColor.startsWith('#') ? primaryColor : `#${primaryColor}`;
  const iconColors = generateIconColors(primary, isDark);
  
  // For light theme
  if (!isDark) {
    return {
      primary,
      primaryLight: lightenColor(primary, 40),
      primaryLightRgba: `${primary}14`, // ~8% opacity
      primaryDark: darkenColor(primary, 15),
      primaryText: isLightColor(primary) ? '#000000' : '#FFFFFF',
      ...iconColors,
    };
  }
  
  // For dark theme - make the primary slightly lighter for visibility
  const adjustedPrimary = lightenColor(primary, 10);
  return {
    primary: adjustedPrimary,
    primaryLight: `${adjustedPrimary}1F`, // ~12% opacity
    primaryLightRgba: `${adjustedPrimary}1F`,
    primaryDark: primary,
    primaryText: isLightColor(adjustedPrimary) ? '#000000' : '#FFFFFF',
    ...iconColors,
  };
}

/**
 * Preset color options for the color picker
 */
export const PRESET_COLORS = [
  { name: 'Blue', color: '#3A7CFF' },
  { name: 'Purple', color: '#8B5CF6' },
  { name: 'Pink', color: '#EC4899' },
  { name: 'Rose', color: '#F43F5E' },
  { name: 'Red', color: '#EF4444' },
  { name: 'Orange', color: '#F97316' },
  { name: 'Amber', color: '#F59E0B' },
  { name: 'Yellow', color: '#EAB308' },
  { name: 'Lime', color: '#84CC16' },
  { name: 'Green', color: '#22C55E' },
  { name: 'Emerald', color: '#10B981' },
  { name: 'Teal', color: '#14B8A6' },
  { name: 'Cyan', color: '#06B6D4' },
  { name: 'Sky', color: '#0EA5E9' },
  { name: 'Indigo', color: '#6366F1' },
  { name: 'Violet', color: '#7C3AED' },
];

export default {
  hexToRgb,
  rgbToHex,
  lightenColor,
  darkenColor,
  getLuminance,
  isLightColor,
  generateColorVariants,
  PRESET_COLORS,
};
