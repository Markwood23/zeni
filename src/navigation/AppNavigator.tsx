import React, { useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useUserStore } from '../store';

// Screens
import OnboardingScreen from '../screens/OnboardingScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import HomeScreen from '../screens/home/HomeScreen';
import DocumentsHubScreen from '../screens/documents/DocumentsHubScreen';
import AllDocumentsScreen from '../screens/documents/AllDocumentsScreen';
import DocumentViewScreen from '../screens/documents/DocumentViewScreen';
import FolderViewScreen from '../screens/documents/FolderViewScreen';
import SharedFolderViewScreen from '../screens/documents/SharedFolderViewScreen';
import ActivityScreen from '../screens/ActivityScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ScanScreen from '../screens/scan/ScanScreen';
import ScanPreviewScreen from '../screens/scan/ScanPreviewScreen';
import EditScreen from '../screens/edit/EditScreen';
import EditDocumentScreen from '../screens/edit/EditDocumentScreen';
import ConvertScreen from '../screens/convert/ConvertScreen';
import AskAIScreen from '../screens/ai/AskAIScreen';
import AIChatScreen from '../screens/ai/AIChatScreen';
import SendScreen from '../screens/send/SendScreen';
import SendShareScreen from '../screens/send/SendShareScreen';
import NotificationCenterScreen from '../screens/notifications/NotificationCenterScreen';
import NotificationDetailScreen from '../screens/notifications/NotificationDetailScreen';

// Settings Screens
import AccountSettingsScreen from '../screens/settings/AccountSettingsScreen';
import NotificationsScreen from '../screens/settings/NotificationsScreen';
import StorageScreen from '../screens/settings/StorageScreen';
import SignaturesScreen from '../screens/settings/SignaturesScreen';
import PrivacySecurityScreen from '../screens/settings/PrivacySecurityScreen';
import HelpSupportScreen from '../screens/settings/HelpSupportScreen';
import AboutScreen from '../screens/settings/AboutScreen';
import AppearanceScreen from '../screens/settings/AppearanceScreen';
import StudentVerificationScreen from '../screens/settings/StudentVerificationScreen';

import type {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
  HomeStackParamList,
  DocumentsStackParamList,
  ProfileStackParamList,
} from '../types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const DocumentsStack = createNativeStackNavigator<DocumentsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

// Auth Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

// Home Stack Navigator
function HomeNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
      <HomeStack.Screen name="Scan" component={ScanScreen} />
      <HomeStack.Screen name="ScanPreview" component={ScanPreviewScreen} />
      <HomeStack.Screen name="Edit" component={EditScreen} />
      <HomeStack.Screen name="EditDocument" component={EditDocumentScreen} />
      <HomeStack.Screen name="Convert" component={ConvertScreen} />
      <HomeStack.Screen name="AskAI" component={AskAIScreen} />
      <HomeStack.Screen name="AIChat" component={AIChatScreen} />
      <HomeStack.Screen name="Send" component={SendScreen} />
      <HomeStack.Screen name="SendShare" component={SendShareScreen} />
      <HomeStack.Screen name="AllDocuments" component={AllDocumentsScreen} />
      <HomeStack.Screen name="DocumentView" component={DocumentViewScreen} />
      <HomeStack.Screen name="NotificationCenter" component={NotificationCenterScreen} />
      <HomeStack.Screen name="NotificationDetail" component={NotificationDetailScreen} />
      <HomeStack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <HomeStack.Screen name="SharedFolderView" component={SharedFolderViewScreen} />
    </HomeStack.Navigator>
  );
}

// Documents Stack Navigator
function DocumentsNavigator() {
  return (
    <DocumentsStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <DocumentsStack.Screen name="DocumentsHub" component={DocumentsHubScreen} />
      <DocumentsStack.Screen name="AllDocuments" component={AllDocumentsScreen} />
      <DocumentsStack.Screen name="DocumentView" component={DocumentViewScreen} />
      <DocumentsStack.Screen name="FolderView" component={FolderViewScreen} />
      <DocumentsStack.Screen name="SharedFolderView" component={SharedFolderViewScreen} />
    </DocumentsStack.Navigator>
  );
}

// Profile Stack Navigator
function ProfileNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <ProfileStack.Screen name="ProfileScreen" component={ProfileScreen} />
      <ProfileStack.Screen name="AccountSettings" component={AccountSettingsScreen} />
      <ProfileStack.Screen name="StudentVerification" component={StudentVerificationScreen} />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
      <ProfileStack.Screen name="Storage" component={StorageScreen} />
      <ProfileStack.Screen name="Signatures" component={SignaturesScreen} />
      <ProfileStack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
      <ProfileStack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <ProfileStack.Screen name="About" component={AboutScreen} />
      <ProfileStack.Screen name="Appearance" component={AppearanceScreen} />
    </ProfileStack.Navigator>
  );
}

// Main Tab Navigator
function MainTabNavigator() {
  const { colors } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Documents':
              iconName = focused ? 'folder' : 'folder-outline';
              break;
            case 'Activity':
              iconName = focused ? 'time' : 'time-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          paddingTop: 8,
          paddingBottom: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeNavigator} />
      <Tab.Screen name="Documents" component={DocumentsNavigator} />
      <Tab.Screen name="Activity" component={ActivityScreen} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}

// Root Navigator
export default function AppNavigator() {
  const { isAuthenticated, isOnboarded } = useUserStore();
  const { colors, isDark } = useTheme();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  // Handle deep links for shared folders
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      handleShareUrl(url);
    };

    const handleShareUrl = (url: string) => {
      // Handle share links: https://zenigh.online/share?token=xxx
      if (url.includes('share')) {
        try {
          const urlObj = new URL(url);
          const token = urlObj.searchParams.get('token');
          const password = urlObj.searchParams.get('p');
          
          if (token && navigationRef.current && isAuthenticated) {
            // Navigate to the shared folder view
            navigationRef.current.navigate('Main', {
              screen: 'Documents',
              params: {
                screen: 'SharedFolderView',
                params: { shareToken: token, password: password || undefined }
              }
            } as any);
          }
        } catch (e) {
          console.log('Error parsing share URL:', e);
        }
      }
    };

    // Handle deep links when app is opened from link
    Linking.getInitialURL().then((url) => {
      if (url) {
        // Delay to ensure navigation is ready
        setTimeout(() => handleShareUrl(url), 500);
      }
    });

    // Handle deep links when app is already open
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated]);

  const navigationTheme = {
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.borderLight,
      notification: colors.error,
    },
    fonts: DefaultTheme.fonts,
  };

  // Deep linking configuration
  const linking = {
    prefixes: ['https://zenigh.online', 'zeni://'],
    config: {
      screens: {
        Main: {
          screens: {
            Documents: {
              screens: {
                SharedFolderView: {
                  path: 'share',
                  parse: {
                    shareToken: (token: string) => token,
                    password: (p: string) => p,
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  return (
    <NavigationContainer 
      ref={navigationRef}
      theme={navigationTheme}
      linking={linking}
    >
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isOnboarded ? (
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : !isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <RootStack.Screen name="Main" component={MainTabNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
