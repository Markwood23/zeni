import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useUserStore } from '../../store';
import { VerificationStatus } from '../../types';

export default function StudentVerificationScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const { user, setUser } = useUserStore();
  
  const [eduEmail, setEduEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'info' | 'email' | 'code' | 'success' | 'verified'>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Check if already verified
    if (user?.verification?.status === 'verified') {
      setStep('verified');
    }
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendVerification = () => {
    if (!eduEmail.toLowerCase().endsWith('.edu')) {
      Alert.alert('Invalid Email', 'Please enter a valid .edu email address');
      return;
    }
    
    setIsLoading(true);
    // Simulate sending verification email
    setTimeout(() => {
      setIsLoading(false);
      setStep('code');
      setCountdown(60);
    }, 1500);
  };

  const handleVerifyCode = () => {
    if (verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification code');
      return;
    }
    
    setIsLoading(true);
    // Simulate verification
    setTimeout(() => {
      setIsLoading(false);
      
      // Update user with verified student status
      if (user) {
        setUser({
          ...user,
          accountType: 'student',
          verification: {
            status: 'verified',
            method: 'edu_email',
            verifiedEmail: eduEmail,
            verifiedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            institutionName: extractInstitutionName(eduEmail),
          },
          isPremium: true, // Give premium for verified students
          updatedAt: new Date(),
        });
      }
      
      setStep('success');
    }, 1500);
  };

  const extractInstitutionName = (email: string): string => {
    const domain = email.split('@')[1];
    if (!domain) return 'Unknown Institution';
    const name = domain.replace('.edu', '').split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1) + ' University';
  };

  const benefits = [
    { icon: 'cloud-outline', title: 'Unlimited Storage', desc: 'Store all your documents without limits', color: colors.uploadedIcon },
    { icon: 'flash-outline', title: 'Priority Processing', desc: 'Faster scans, conversions & AI responses', color: colors.warning },
    { icon: 'send-outline', title: 'Send & Share', desc: 'Unlimited document sharing', color: colors.primary },
    { icon: 'sparkles-outline', title: 'Advanced AI', desc: 'Full access to AI study tools', color: colors.askAiIcon },
    { icon: 'shield-checkmark-outline', title: 'Verified Badge', desc: 'Show your student status', color: colors.success },
  ];

  const renderInfo = () => (
    <View style={styles.content}>
      <View style={styles.iconContainer}>
        <Ionicons name="school" size={48} color={colors.primary} />
      </View>
      
      <Text style={styles.title}>Student Benefits</Text>
      <Text style={styles.subtitle}>
        Verify your student status to unlock premium features for free
      </Text>

      <View style={styles.benefitsList}>
        {benefits.map((benefit, index) => (
          <View key={index} style={styles.benefitItem}>
            <View style={[styles.benefitIcon, { backgroundColor: benefit.color + '15' }]}>
              <Ionicons name={benefit.icon as any} size={24} color={benefit.color} />
            </View>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>{benefit.title}</Text>
              <Text style={styles.benefitDesc}>{benefit.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setStep('email')}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryButtonText}>Verify with .edu Email</Text>
        <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Don't have a .edu email? Contact support for alternative verification options.
      </Text>
    </View>
  );

  const renderEmailStep = () => (
    <View style={styles.content}>
      <View style={styles.iconContainer}>
        <Ionicons name="mail" size={48} color={colors.primary} />
      </View>
      
      <Text style={styles.title}>Enter Your .edu Email</Text>
      <Text style={styles.subtitle}>
        We'll send a verification code to confirm your student status
      </Text>

      <View style={styles.inputGroup}>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color={colors.textTertiary} />
          <TextInput
            style={styles.input}
            placeholder="your.name@university.edu"
            placeholderTextColor={colors.textTertiary}
            value={eduEmail}
            onChangeText={setEduEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            keyboardAppearance={isDark ? 'dark' : 'light'}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, !eduEmail.includes('@') && styles.buttonDisabled]}
        onPress={handleSendVerification}
        disabled={!eduEmail.includes('@') || isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>Send Verification Code</Text>
            <Ionicons name="send" size={20} color={colors.textInverse} />
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setStep('info')} style={styles.backLink}>
        <Text style={styles.backLinkText}>← Back to benefits</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCodeStep = () => (
    <View style={styles.content}>
      <View style={styles.iconContainer}>
        <Ionicons name="key" size={48} color={colors.primary} />
      </View>
      
      <Text style={styles.title}>Enter Verification Code</Text>
      <Text style={styles.subtitle}>
        We sent a 6-digit code to{'\n'}
        <Text style={styles.emailHighlight}>{eduEmail}</Text>
      </Text>

      <View style={styles.codeInputContainer}>
        <TextInput
          style={styles.codeInput}
          placeholder="000000"
          placeholderTextColor={colors.textTertiary}
          value={verificationCode}
          onChangeText={(text) => setVerificationCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          keyboardAppearance={isDark ? 'dark' : 'light'}
          maxLength={6}
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, verificationCode.length !== 6 && styles.buttonDisabled]}
        onPress={handleVerifyCode}
        disabled={verificationCode.length !== 6 || isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>Verify & Unlock</Text>
            <Ionicons name="checkmark-circle" size={20} color={colors.textInverse} />
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={countdown === 0 ? handleSendVerification : undefined}
        disabled={countdown > 0}
        style={styles.resendContainer}
      >
        <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
          {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.content}>
      <View style={[styles.iconContainer, styles.successIcon]}>
        <Ionicons name="checkmark-circle" size={64} color={colors.success} />
      </View>
      
      <Text style={styles.title}>You're Verified! 🎉</Text>
      <Text style={styles.subtitle}>
        Welcome to Zeni Student! You now have access to all premium features.
      </Text>

      <View style={styles.verifiedBadge}>
        <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
        <Text style={styles.verifiedBadgeText}>Verified Student</Text>
      </View>

      <View style={styles.institutionInfo}>
        <Text style={styles.institutionLabel}>Institution</Text>
        <Text style={styles.institutionName}>{extractInstitutionName(eduEmail)}</Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryButtonText}>Start Using Premium</Text>
        <Ionicons name="rocket" size={20} color={colors.textInverse} />
      </TouchableOpacity>
    </View>
  );

  const renderAlreadyVerified = () => (
    <View style={styles.content}>
      <View style={[styles.iconContainer, styles.successIcon]}>
        <Ionicons name="shield-checkmark" size={64} color={colors.success} />
      </View>
      
      <Text style={styles.title}>Already Verified</Text>
      <Text style={styles.subtitle}>
        You're enjoying all the benefits of Zeni Student
      </Text>

      <View style={styles.verifiedBadge}>
        <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
        <Text style={styles.verifiedBadgeText}>Verified Student</Text>
      </View>

      {user?.verification?.institutionName && (
        <View style={styles.institutionInfo}>
          <Text style={styles.institutionLabel}>Institution</Text>
          <Text style={styles.institutionName}>{user.verification.institutionName}</Text>
        </View>
      )}

      {user?.verification?.expiresAt && (
        <View style={styles.institutionInfo}>
          <Text style={styles.institutionLabel}>Valid Until</Text>
          <Text style={styles.institutionName}>
            {new Date(user.verification.expiresAt).toLocaleDateString()}
          </Text>
        </View>
      )}

      <View style={styles.benefitsList}>
        {benefits.slice(0, 3).map((benefit, index) => (
          <View key={index} style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <Ionicons name={benefit.icon as any} size={24} color={colors.success} />
            </View>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>{benefit.title}</Text>
              <Text style={styles.benefitDesc}>{benefit.desc}</Text>
            </View>
            <Ionicons name="checkmark" size={20} color={colors.success} />
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Verification</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {step === 'info' && renderInfo()}
          {step === 'email' && renderEmailStep()}
          {step === 'code' && renderCodeStep()}
          {step === 'success' && renderSuccess()}
          {step === 'verified' && renderAlreadyVerified()}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  content: {
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  successIcon: {
    backgroundColor: `${colors.success}15`,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  emailHighlight: {
    color: colors.primary,
    fontWeight: '600',
  },
  benefitsList: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  benefitDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  inputGroup: {
    width: '100%',
    marginBottom: spacing.lg,
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
  input: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  codeInputContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  codeInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 8,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
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
  disclaimer: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  backLink: {
    marginTop: spacing.lg,
    padding: spacing.sm,
  },
  backLinkText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: '500',
  },
  resendContainer: {
    marginTop: spacing.lg,
    padding: spacing.sm,
  },
  resendText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: '500',
  },
  resendDisabled: {
    color: colors.textTertiary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    marginBottom: spacing.xl,
  },
  verifiedBadgeText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  institutionInfo: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  institutionLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  institutionName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
