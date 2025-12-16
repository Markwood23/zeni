// Dynamic Expo configuration with environment variables
export default {
  expo: {
    name: "Zeni",
    slug: "zeni",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#f8fafc"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.zeni.app",
      infoPlist: {
        NSCameraUsageDescription: "Zeni needs camera access to scan documents",
        NSPhotoLibraryUsageDescription: "Zeni needs photo library access to import and save documents"
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#F5F5F5"
      },
      edgeToEdgeEnabled: true,
      package: "com.zeni.app",
      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-camera",
        {
          cameraPermission: "Allow Zeni to access your camera to scan documents"
        }
      ],
      [
        "expo-media-library",
        {
          photosPermission: "Allow Zeni to access your photos",
          savePhotosPermission: "Allow Zeni to save documents"
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "Allow Zeni to access your photos"
        }
      ]
    ],
    // Extra configuration for environment variables
    extra: {
      openaiApiKey: process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY || "",
      eas: {
        projectId: process.env.EAS_PROJECT_ID || ""
      }
    }
  }
};
