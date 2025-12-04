import React from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../constants/theme';

interface ThemedTextInputProps extends TextInputProps {
  // Any additional custom props can be added here
}

/**
 * ThemedTextInput - A TextInput component that automatically applies
 * the correct keyboard appearance (dark/light) based on the current theme.
 * 
 * Use this component instead of the default TextInput throughout the app
 * to ensure consistent keyboard theming.
 */
export default function ThemedTextInput({ style, placeholderTextColor, ...props }: ThemedTextInputProps) {
  const { colors, isDark } = useTheme();

  return (
    <TextInput
      {...props}
      style={[styles.defaultInput, { color: colors.textPrimary }, style]}
      placeholderTextColor={placeholderTextColor || colors.textTertiary}
      keyboardAppearance={isDark ? 'dark' : 'light'}
      selectionColor={colors.primary}
    />
  );
}

const styles = StyleSheet.create({
  defaultInput: {
    fontSize: typography.fontSize.md,
  },
});
