import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Animated,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { AuthStackParamList } from '../../types';
import { useUserStore, generateId } from '../../store';

WebBrowser.maybeCompleteAuthSession();

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { setUser } = useUserStore();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  // Google Auth configuration
  // Note: In production, replace these with your actual client IDs from Google Cloud Console
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  });

  // Handle Google Auth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        handleGoogleSignIn(authentication.accessToken);
      }
    } else if (response?.type === 'error') {
      setIsGoogleLoading(false);
      Alert.alert('Sign In Error', 'Google sign in was cancelled or failed. Please try again.');
    }
  }, [response]);

  const handleGoogleSignIn = async (accessToken: string) => {
    try {
      // Fetch user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userInfo = await userInfoResponse.json();
      
      // Create user with Google info
      setUser({
        id: generateId(),
        firstName: userInfo.given_name || userInfo.name?.split(' ')[0] || 'User',
        email: userInfo.email,
        avatar: userInfo.picture,
        accountType: 'standard',
        authProvider: 'google',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to get user information from Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsAppleLoading(true);
    try {
      // For a complete implementation, use expo-apple-authentication
      // For now, simulate Apple sign in
      Alert.alert(
        'Apple Sign In',
        'Apple Sign In requires additional setup with Apple Developer account. For demo purposes, we\'ll create a test account.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setIsAppleLoading(false) },
          {
            text: 'Continue Demo',
            onPress: () => {
              setUser({
                id: generateId(),
                firstName: 'Apple User',
                email: 'user@privaterelay.appleid.com',
                accountType: 'standard',
                authProvider: 'apple',
                createdAt: new Date(),
                updatedAt: new Date(),
              });
              setIsAppleLoading(false);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Apple Sign In failed. Please try again.');
      setIsAppleLoading(false);
    }
  };

  const handleGooglePress = () => {
    setIsGoogleLoading(true);
    // For demo without proper OAuth setup, create a demo account
    if (!request) {
      Alert.alert(
        'Google Sign In',
        'Google Sign In requires OAuth client IDs setup. For demo purposes, we\'ll create a test account.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setIsGoogleLoading(false) },
          {
            text: 'Continue Demo',
            onPress: () => {
              setUser({
                id: generateId(),
                firstName: 'Google User',
                email: 'user@gmail.com',
                accountType: 'standard',
                authProvider: 'google',
                createdAt: new Date(),
                updatedAt: new Date(),
              });
              setIsGoogleLoading(false);
            },
          },
        ]
      );
    } else {
      promptAsync();
    }
  };

  // Animations
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(30)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslate = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    // Staggered entrance animations
    Animated.sequence([
      // Logo animation
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Content animation
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslate, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Buttons animation
      Animated.parallel([
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsTranslate, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const features = [
    { icon: 'scan-outline', text: 'Scan', color: colors.primary },
    { icon: 'create-outline', text: 'Edit & Sign', color: '#22c55e' },
    { icon: 'swap-horizontal-outline', text: 'Convert', color: '#8b5cf6' },
    { icon: 'sparkles-outline', text: 'AI Assistant', color: '#f59e0b' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Background decoration */}
      <View style={styles.bgDecoration1} />
      <View style={styles.bgDecoration2} />

      <View style={styles.content}>
        {/* Logo */}
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            }
          ]}
        >
          <View style={styles.logoIcon}>
            <Text style={styles.logoZ}>Z</Text>
          </View>
          <View style={styles.logoTextContainer}>
            <Text style={styles.logoTextZ}>Z</Text>
            <Text style={styles.logoTextEni}>eni</Text>
          </View>
          <Text style={styles.tagline}>Smart Document Workspace</Text>
        </Animated.View>

        {/* Features - Clean horizontal layout */}
        <Animated.View 
          style={[
            styles.featuresContainer,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslate }],
            }
          ]}
        >
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${feature.color}12` }]}>
                <Ionicons name={feature.icon as any} size={22} color={feature.color} />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Auth Buttons */}
      <Animated.View 
        style={[
          styles.footer,
          {
            opacity: buttonsOpacity,
            transform: [{ translateY: buttonsTranslate }],
          }
        ]}
      >
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('SignUp')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('SignIn')}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialButtons}>
          <TouchableOpacity 
            style={styles.socialButton} 
            activeOpacity={0.7}
            onPress={handleGooglePress}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <Ionicons name="logo-google" size={22} color={colors.textPrimary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.socialButton} 
            activeOpacity={0.7}
            onPress={handleAppleSignIn}
            disabled={isAppleLoading}
          >
            {isAppleLoading ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <Ionicons name="logo-apple" size={22} color={colors.textPrimary} />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.link} onPress={() => Linking.openURL('https://zenigh.online/terms.html')}>Terms</Text> and{' '}
          <Text style={styles.link} onPress={() => Linking.openURL('https://zenigh.online/privacy.html')}>Privacy Policy</Text>
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bgDecoration1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primaryLight,
    opacity: 0.5,
  },
  bgDecoration2: {
    position: 'absolute',
    bottom: 100,
    left: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primaryLight,
    opacity: 0.3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.huge,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  logoZ: {
    fontSize: 44,
    fontWeight: '800',
    fontStyle: 'italic',
    color: colors.textInverse,
  },
  logoTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  logoTextZ: {
    fontSize: 48,
    fontWeight: '800',
    fontStyle: 'italic',
    color: colors.primary,
  },
  logoTextEni: {
    fontSize: 48,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  tagline: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureText: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    fontWeight: '500',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textInverse,
  },
  secondaryButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    color: colors.primary,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
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
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  terms: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: colors.primary,
    fontWeight: '500',
  },
});
