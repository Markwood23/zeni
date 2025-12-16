import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useUserStore } from '../store';
import { spacing, borderRadius, typography, shadows } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    icon: 'scan-outline',
    title: 'Scan Documents',
    description: 'Turn paper into clean, professional PDFs instantly with your phone camera.',
    color: '#017DE9',
    bgColor: 'rgba(1, 125, 233, 0.1)',
    permission: 'camera',
  },
  {
    icon: 'create-outline',
    title: 'Edit & Sign',
    description: 'Fill forms, add text, and sign documents digitally - no printing needed.',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.1)',
    permission: null,
  },
  {
    icon: 'images-outline',
    title: 'Access Photos',
    description: 'Import documents from your photo library for editing and sharing.',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    permission: 'photos',
  },
  {
    icon: 'notifications-outline',
    title: 'Stay Updated',
    description: 'Get notified when your faxes are delivered and documents are ready.',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    permission: 'notifications',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [permissionGranted, setPermissionGranted] = useState<{ [key: string]: boolean }>({});
  const { setOnboarded } = useUserStore();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;

  const requestPermission = async (type: string | null) => {
    if (!type) return true;
    
    try {
      if (type === 'camera') {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setPermissionGranted(prev => ({ ...prev, camera: status === 'granted' }));
        return status === 'granted';
      } else if (type === 'photos') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        setPermissionGranted(prev => ({ ...prev, photos: status === 'granted' }));
        return status === 'granted';
      } else if (type === 'notifications') {
        // For notifications, we'll handle this later when needed
        setPermissionGranted(prev => ({ ...prev, notifications: true }));
        return true;
      }
    } catch (error) {
      console.log('Permission error:', error);
    }
    return false;
  };

  useEffect(() => {
    // Reset and play entrance animation
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    scaleAnim.setValue(0.8);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle icon animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconRotate, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(iconRotate, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [currentIndex]);

  const handleNext = async () => {
    // Request permission for current slide if needed
    const currentItem = onboardingData[currentIndex];
    if (currentItem.permission) {
      await requestPermission(currentItem.permission);
    }

    // Exit animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -30,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (currentIndex < onboardingData.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setOnboarded(true);
      }
    });
  };

  const handleSkip = () => {
    setOnboarded(true);
  };

  const currentItem = onboardingData[currentIndex];
  const isLastSlide = currentIndex === onboardingData.length - 1;

  const iconRotateInterpolate = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-5deg', '5deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Background decorations */}
      <View style={[styles.bgCircle1, { backgroundColor: currentItem.bgColor }]} />
      <View style={[styles.bgCircle2, { backgroundColor: currentItem.bgColor }]} />

      <View style={styles.header}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoZ}>Z</Text>
          </View>
        </View>
        
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          }
        ]}
      >
        <Animated.View 
          style={[
            styles.iconContainer,
            { backgroundColor: currentItem.bgColor },
            { transform: [{ rotate: iconRotateInterpolate }] }
          ]}
        >
          <Ionicons
            name={currentItem.icon as any}
            size={64}
            color={currentItem.color}
          />
        </Animated.View>

        <Text style={styles.title}>{currentItem.title}</Text>
        <Text style={styles.description}>{currentItem.description}</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {onboardingData.map((item, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && [
                  styles.activeDot,
                  { backgroundColor: currentItem.color }
                ],
              ]}
            />
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: currentItem.color }]} 
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {isLastSlide ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons 
            name={isLastSlide ? 'checkmark' : 'arrow-forward'} 
            size={20} 
            color={colors.textInverse} 
          />
        </TouchableOpacity>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { 
                width: `${((currentIndex + 1) / onboardingData.length) * 100}%`,
                backgroundColor: currentItem.color,
              }
            ]} 
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bgCircle1: {
    position: 'absolute',
    top: -150,
    right: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    opacity: 0.5,
  },
  bgCircle2: {
    position: 'absolute',
    bottom: 50,
    left: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  logoZ: {
    fontSize: 24,
    fontWeight: '800',
    fontStyle: 'italic',
    color: colors.textInverse,
  },
  skipButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxxl,
    ...shadows.lg,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  activeDot: {
    width: 28,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    ...shadows.md,
  },
  buttonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: spacing.xl,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
