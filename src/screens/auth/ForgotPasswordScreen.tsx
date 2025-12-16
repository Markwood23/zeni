import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type Step = 'email' | 'code' | 'newPassword' | 'success';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Code input refs
  const codeRefs = useRef<(TextInput | null)[]>([]);

  // Animations
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslate = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const animateTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslate, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      contentTranslate.setValue(20);
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslate, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleSendCode = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCountdown(60);
      animateTransition(() => setStep('code'));
    }, 1500);
  };

  const handleVerifyCode = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      animateTransition(() => setStep('newPassword'));
    }, 1500);
  };

  const handleResetPassword = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('success');
      Animated.spring(successScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }, 1500);
  };

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input
    if (text && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const isCodeComplete = code.every(digit => digit.length === 1);
  const isPasswordValid = newPassword.length >= 6 && newPassword === confirmPassword;

  const getStepTitle = () => {
    switch (step) {
      case 'email': return 'Forgot password?';
      case 'code': return 'Check your email';
      case 'newPassword': return 'Create new password';
      case 'success': return 'Password reset!';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'email': return "No worries, we'll send you reset instructions.";
      case 'code': return `We sent a code to ${email}`;
      case 'newPassword': return 'Your new password must be different from previous passwords.';
      case 'success': return 'Your password has been successfully reset.';
    }
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
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            {step !== 'success' && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  if (step === 'email') navigation.goBack();
                  else if (step === 'code') animateTransition(() => setStep('email'));
                  else if (step === 'newPassword') animateTransition(() => setStep('code'));
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            )}
            
            {/* Icon */}
            {step === 'success' ? (
              <Animated.View 
                style={[
                  styles.successIcon,
                  { transform: [{ scale: successScale }] }
                ]}
              >
                <Ionicons name="checkmark" size={48} color={colors.textInverse} />
              </Animated.View>
            ) : (
              <View style={[styles.stepIcon, step === 'code' && styles.stepIconAlt]}>
                <Ionicons 
                  name={
                    step === 'email' ? 'mail-outline' : 
                    step === 'code' ? 'keypad-outline' : 
                    'lock-closed-outline'
                  } 
                  size={32} 
                  color={step === 'code' ? colors.primary : colors.textInverse} 
                />
              </View>
            )}
            
            <Text style={styles.title}>{getStepTitle()}</Text>
            <Text style={styles.subtitle}>{getStepSubtitle()}</Text>
          </View>

          {/* Content */}
          <Animated.View 
            style={[
              styles.form,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslate }],
              }
            ]}
          >
            {step === 'email' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View style={[
                    styles.inputContainer,
                    focusedInput === 'email' && styles.inputFocused
                  ]}>
                    <Ionicons 
                      name="mail-outline" 
                      size={20} 
                      color={focusedInput === 'email' ? colors.primary : colors.textTertiary} 
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor={colors.textTertiary}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      keyboardAppearance={isDark ? 'dark' : 'light'}
                      onFocus={() => setFocusedInput('email')}
                      onBlur={() => setFocusedInput(null)}
                      autoFocus
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, !email && styles.buttonDisabled]}
                  onPress={handleSendCode}
                  disabled={!email || isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.textInverse} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {step === 'code' && (
              <>
                <View style={styles.codeContainer}>
                  {code.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref: TextInput | null) => { 
                        if (ref) codeRefs.current[index] = ref; 
                      }}
                      style={[
                        styles.codeInput,
                        digit && styles.codeInputFilled,
                      ]}
                      value={digit}
                      onChangeText={(text) => handleCodeChange(text.slice(-1), index)}
                      onKeyPress={({ nativeEvent }) => handleCodeKeyPress(nativeEvent.key, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      keyboardAppearance={isDark ? 'dark' : 'light'}
                      autoFocus={index === 0}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.resendContainer}
                  disabled={countdown > 0}
                  onPress={() => {
                    setCountdown(60);
                    // Resend code logic
                  }}
                >
                  <Text style={styles.resendText}>
                    Didn't receive the code?{' '}
                    {countdown > 0 ? (
                      <Text style={styles.countdownText}>Resend in {countdown}s</Text>
                    ) : (
                      <Text style={styles.resendLink}>Resend</Text>
                    )}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryButton, !isCodeComplete && styles.buttonDisabled]}
                  onPress={handleVerifyCode}
                  disabled={!isCodeComplete || isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.textInverse} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Verify Code</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {step === 'newPassword' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={[
                    styles.inputContainer,
                    focusedInput === 'newPassword' && styles.inputFocused
                  ]}>
                    <Ionicons 
                      name="lock-closed-outline" 
                      size={20} 
                      color={focusedInput === 'newPassword' ? colors.primary : colors.textTertiary} 
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Min. 6 characters"
                      placeholderTextColor={colors.textTertiary}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showPassword}
                      keyboardAppearance={isDark ? 'dark' : 'light'}
                      onFocus={() => setFocusedInput('newPassword')}
                      onBlur={() => setFocusedInput(null)}
                      autoFocus
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

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={[
                    styles.inputContainer,
                    focusedInput === 'confirmPassword' && styles.inputFocused,
                    confirmPassword && confirmPassword !== newPassword && styles.inputError,
                  ]}>
                    <Ionicons 
                      name="lock-closed-outline" 
                      size={20} 
                      color={
                        confirmPassword && confirmPassword !== newPassword 
                          ? colors.error 
                          : focusedInput === 'confirmPassword' 
                            ? colors.primary 
                            : colors.textTertiary
                      } 
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm your password"
                      placeholderTextColor={colors.textTertiary}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                      keyboardAppearance={isDark ? 'dark' : 'light'}
                      onFocus={() => setFocusedInput('confirmPassword')}
                      onBlur={() => setFocusedInput(null)}
                    />
                    {confirmPassword && newPassword === confirmPassword && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    )}
                  </View>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <Text style={styles.errorText}>Passwords don't match</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, !isPasswordValid && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={!isPasswordValid || isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.textInverse} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Reset Password</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {step === 'success' && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('SignIn' as never)}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Back to Sign In</Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Footer */}
          {step === 'email' && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Remember your password?{' '}
                <Text
                  style={styles.signInLink}
                  onPress={() => navigation.goBack()}
                >
                  Sign in
                </Text>
              </Text>
            </View>
          )}
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
    marginBottom: spacing.xxl,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.huge,
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  stepIconAlt: {
    backgroundColor: colors.primaryLight,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.huge,
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: spacing.lg,
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
    paddingVertical: Platform.OS === 'ios' ? spacing.md + 2 : spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.md,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.textPrimary,
  },
  codeInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  resendText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  countdownText: {
    color: colors.textTertiary,
  },
  resendLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    ...shadows.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
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
  signInLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
