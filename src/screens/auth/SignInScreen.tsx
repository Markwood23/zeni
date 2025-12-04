import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { AuthStackParamList } from '../../types';
import { useUserStore, generateId } from '../../store';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignIn'>;

export default function SignInScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const { setUser } = useUserStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setUser({
        id: generateId(),
        firstName: 'Student',
        email: email,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setIsLoading(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email or Phone</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={colors.textTertiary} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email or phone"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  keyboardAppearance={isDark ? 'dark' : 'light'}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  keyboardAppearance={isDark ? 'dark' : 'light'}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.signInButton, (!email || !password) && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={!email || !password || isLoading}
            >
              <Text style={styles.signInButtonText}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text
                style={styles.signUpLink}
                onPress={() => navigation.navigate('SignUp')}
              >
                Sign up
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
  },
  header: {
    paddingTop: spacing.lg,
    marginBottom: spacing.xxxl,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: spacing.xl,
    marginLeft: -spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xxl,
  },
  forgotPasswordText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  signInButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  signInButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textInverse,
  },
  footer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  signUpLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
