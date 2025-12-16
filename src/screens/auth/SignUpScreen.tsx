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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { AuthStackParamList } from '../../types';
import { useUserStore, generateId } from '../../store';
import { AccountType } from '../../types';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

export default function SignUpScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const { setUser } = useUserStore();
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Validate school/edu email
  const validateSchoolEmail = (emailInput: string): { isValid: boolean; status: 'empty' | 'typing' | 'valid' | 'invalid' } => {
    if (!emailInput || emailInput.length === 0) {
      return { isValid: false, status: 'empty' };
    }
    
    // Common educational email domains
    const eduDomains = ['.edu', '.edu.au', '.ac.uk', '.edu.cn', '.edu.in', '.edu.ng', '.edu.za', '.edu.mx', '.edu.br', '.edu.co', '.ac.jp', '.edu.sg', '.edu.my', '.edu.pk', '.edu.ph', '.edu.eg', '.edu.sa', '.edu.ae', '.edu.gh', '.edu.ke'];
    const emailLower = emailInput.toLowerCase();
    
    // Check if it looks like an email is being typed
    if (!emailInput.includes('@')) {
      return { isValid: false, status: 'typing' };
    }
    
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      return { isValid: false, status: 'typing' };
    }
    
    // Check for edu domains
    const isEduEmail = eduDomains.some(domain => emailLower.endsWith(domain));
    
    return { isValid: isEduEmail, status: isEduEmail ? 'valid' : 'invalid' };
  };

  const schoolEmailValidation = validateSchoolEmail(schoolEmail);

  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslate = useRef(new Animated.Value(-20)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslate = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslate, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(formTranslate, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);
  }, []);

  const handleSignUp = async () => {
    setIsLoading(true);
    
    // Check if school email is a valid .edu email for student detection
    const hasValidSchoolEmail = schoolEmailValidation.isValid;
    const accountType: AccountType = hasValidSchoolEmail ? 'student' : 'standard';
    
    setTimeout(() => {
      setUser({
        id: generateId(),
        firstName: firstName || 'User',
        email: email,
        school: schoolEmail, // Store school email
        accountType: accountType,
        verification: hasValidSchoolEmail ? {
          status: 'pending',
          method: 'edu_email',
          verifiedEmail: schoolEmail,
          pendingSince: new Date(), // Track when verification started
          remindersSent: 0,
        } : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setIsLoading(false);
    }, 1500);
  };

  const isValid = firstName.length >= 2 && email.length > 0 && password.length >= 6;

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
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: headerOpacity,
                transform: [{ translateY: headerTranslate }],
              }
            ]}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            
            <View style={styles.logoMini}>
              <Text style={styles.logoMiniZ}>Z</Text>
            </View>
            
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Join Zeni to get started</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View 
            style={[
              styles.form,
              {
                opacity: formOpacity,
                transform: [{ translateY: formTranslate }],
              }
            ]}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.labelWithMargin}>Name</Text>
              <View style={[
                styles.inputContainer,
                focusedInput === 'firstName' && styles.inputFocused
              ]}>
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={focusedInput === 'firstName' ? colors.primary : colors.textTertiary} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.textTertiary}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  keyboardAppearance={isDark ? 'dark' : 'light'}
                  onFocus={() => setFocusedInput('firstName')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.labelWithMargin}>Email or Phone</Text>
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
                  placeholder="Enter your email or phone"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  keyboardAppearance={isDark ? 'dark' : 'light'}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.labelWithMargin}>Password</Text>
              <View style={[
                styles.inputContainer,
                focusedInput === 'password' && styles.inputFocused
              ]}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={focusedInput === 'password' ? colors.primary : colors.textTertiary} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  keyboardAppearance={isDark ? 'dark' : 'light'}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
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
              <View style={styles.labelRow}>
                <Text style={styles.label}>School Email</Text>
                <Text style={styles.optionalLabel}>Optional</Text>
              </View>
              <View style={[
                styles.inputContainer,
                focusedInput === 'school' && styles.inputFocused,
                schoolEmailValidation.status === 'valid' && styles.inputValid,
                schoolEmailValidation.status === 'invalid' && styles.inputInvalid,
              ]}>
                <Ionicons 
                  name="school-outline" 
                  size={20} 
                  color={
                    schoolEmailValidation.status === 'valid' ? colors.success :
                    schoolEmailValidation.status === 'invalid' ? colors.error :
                    focusedInput === 'school' ? colors.primary : colors.textTertiary
                  } 
                />
                <TextInput
                  style={styles.input}
                  placeholder="student@university.edu"
                  placeholderTextColor={colors.textTertiary}
                  value={schoolEmail}
                  onChangeText={setSchoolEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  keyboardAppearance={isDark ? 'dark' : 'light'}
                  onFocus={() => setFocusedInput('school')}
                  onBlur={() => setFocusedInput(null)}
                />
                {schoolEmailValidation.status === 'valid' && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                )}
                {schoolEmailValidation.status === 'invalid' && (
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                )}
              </View>
              
              {/* Validation feedback message */}
              {schoolEmailValidation.status === 'valid' ? (
                <View style={styles.validationMessage}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={[styles.validationText, { color: colors.success }]}>
                    Valid school email! You'll get free premium features
                  </Text>
                </View>
              ) : schoolEmailValidation.status === 'invalid' ? (
                <View style={styles.validationMessage}>
                  <Ionicons name="alert-circle" size={14} color={colors.error} />
                  <Text style={[styles.validationText, { color: colors.error }]}>
                    Please enter a valid .edu email (e.g., name@university.edu)
                  </Text>
                </View>
              ) : (
                <View style={styles.studentHint}>
                  <Ionicons name="sparkles" size={14} color={colors.primary} />
                  <Text style={styles.studentHintText}>
                    Enter your .edu email to unlock free premium features
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.signUpButton, !isValid && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={!isValid || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <>
                  <Text style={styles.signUpButtonText}>Create Account</Text>
                  <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
                </>
              )}
            </TouchableOpacity>

            {/* Social Login */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                <Ionicons name="logo-google" size={20} color={colors.textPrimary} />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                <Ionicons name="logo-apple" size={20} color={colors.textPrimary} />
                <Text style={styles.socialButtonText}>Apple</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text
                style={styles.signInLink}
                onPress={() => navigation.navigate('SignIn')}
              >
                Sign in
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
    marginBottom: spacing.xxl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoMini: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  logoMiniZ: {
    fontSize: 28,
    fontWeight: '800',
    fontStyle: 'italic',
    color: colors.textInverse,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  labelWithMargin: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  optionalLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    fontWeight: '500',
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
  inputValid: {
    borderColor: colors.success,
    backgroundColor: `${colors.success}10`,
  },
  inputInvalid: {
    borderColor: colors.error,
    backgroundColor: `${colors.error}10`,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  validationMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  validationText: {
    fontSize: typography.fontSize.xs,
    flex: 1,
  },
  studentHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  studentHintText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    flex: 1,
  },
  signUpButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    ...shadows.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  signUpButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textInverse,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
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
