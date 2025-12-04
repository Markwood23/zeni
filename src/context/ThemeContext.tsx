import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, ThemeColors } from '../constants/theme';
import { generateColorVariants, PRESET_COLORS } from '../utils/colorUtils';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
  themeMode: ThemeMode;
  primaryColor: string;
  setThemeMode: (mode: ThemeMode) => void;
  setPrimaryColor: (color: string) => void;
  toggleTheme: () => void;
  hasSeenColorPicker: boolean;
  setHasSeenColorPicker: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@zeni_theme_mode';
const PRIMARY_COLOR_KEY = '@zeni_primary_color';
const COLOR_PICKER_SEEN_KEY = '@zeni_color_picker_seen';
const DEFAULT_PRIMARY_COLOR = '#3A7CFF';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [primaryColor, setPrimaryColorState] = useState<string>(DEFAULT_PRIMARY_COLOR);
  const [hasSeenColorPicker, setHasSeenColorPickerState] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [savedTheme, savedPrimaryColor, seenColorPicker] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(PRIMARY_COLOR_KEY),
          AsyncStorage.getItem(COLOR_PICKER_SEEN_KEY),
        ]);
        
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
        
        if (savedPrimaryColor) {
          setPrimaryColorState(savedPrimaryColor);
        }
        
        setHasSeenColorPickerState(seenColorPicker === 'true');
      } catch (error) {
        console.error('Error loading theme preferences:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadPreferences();
  }, []);

  // Save theme preference when it changes
  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Save primary color preference
  const setPrimaryColor = async (color: string) => {
    setPrimaryColorState(color);
    try {
      await AsyncStorage.setItem(PRIMARY_COLOR_KEY, color);
    } catch (error) {
      console.error('Error saving primary color:', error);
    }
  };

  // Mark color picker as seen
  const setHasSeenColorPicker = async (value: boolean) => {
    setHasSeenColorPickerState(value);
    try {
      await AsyncStorage.setItem(COLOR_PICKER_SEEN_KEY, value.toString());
    } catch (error) {
      console.error('Error saving color picker seen state:', error);
    }
  };

  // Determine if dark mode should be active
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  // Generate color variants based on primary color
  const colorVariants = generateColorVariants(primaryColor, isDark);

  // Get the appropriate colors based on theme and apply primary color + icon colors
  const baseColors = isDark ? darkColors : lightColors;
  const colors: ThemeColors = {
    ...baseColors,
    primary: colorVariants.primary,
    primaryLight: colorVariants.primaryLightRgba,
    primaryDark: colorVariants.primaryDark,
    // Apply dynamically generated icon colors
    scanIcon: colorVariants.scanIcon,
    editIcon: colorVariants.editIcon,
    convertIcon: colorVariants.convertIcon,
    askAiIcon: colorVariants.askAiIcon,
  };

  // Toggle between light and dark (ignoring system)
  const toggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider 
      value={{ 
        colors, 
        isDark, 
        themeMode, 
        primaryColor,
        setThemeMode, 
        setPrimaryColor,
        toggleTheme,
        hasSeenColorPicker,
        setHasSeenColorPicker,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export { PRESET_COLORS, DEFAULT_PRIMARY_COLOR };
export default ThemeContext;
