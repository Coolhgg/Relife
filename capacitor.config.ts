import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.scrapybara.relife',
  appName: 'Relife Alarm',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true, // For local development
    allowNavigation: [
      '*.supabase.co',
      '*.googleapis.com',
      'localhost',
      '*.scrapybara.com',
    ],
  },
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      launchFadeOutDuration: 1000,
      backgroundColor: '#667eea',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      spinnerColor: '#ffffff',
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#667eea',
    },
    Notifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
      iconColor: '#667eea',
    },
    LocalNotifications: {
      iconColor: '#667eea',
      sound: 'beep.wav',
      smallIcon: 'ic_stat_icon_config_sample',
    },
    Haptics: {
      // Enable haptic feedback
    },
    Device: {
      // Enable device info access
    },
    Network: {
      // Enable network status monitoring
    },
    BackgroundMode: {
      // Enable background processing for alarms
      enabled: true,
      title: 'Relife Alarm is running',
      text: 'Keeping your alarms ready',
      silent: false,
      resume: true,
      // Additional background mode options
      hidden: false,
      color: '667eea',
      icon: 'ic_launcher',
    },
    CapacitorUpdater: {
      // Auto-update configuration
      autoUpdate: false,
      resetWhenUpdate: true,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    Screen: {
      // Screen orientation and wake lock
    },
    App: {
      // App state handling
    },
    Browser: {
      // In-app browser configuration
    },
    Camera: {
      // Camera permissions for profile pictures
    },
    Filesystem: {
      // File system access for alarm sounds
    },
    Geolocation: {
      // Location-based alarms
    },
    Share: {
      // Share functionality
    },
    Badge: {
      // Enable app badge for pending alarms
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    // Enhanced Android configuration
    backgroundColor: '#667eea',
    loggingBehavior: 'debug',
    // Splash screen configuration
    hideLogs: false,
    // Keyboard configuration
    resizeOnFullScreen: true,
    // Security
    allowBackup: false,
    // Performance optimizations
    useLegacyBridge: false,
  },
  ios: {
    scheme: 'Relife',
    contentInset: 'automatic',
    // Enhanced iOS configuration
    backgroundColor: '#667eea',
    // Scroll configuration
    scrollEnabled: true,
    overrideUserInterfaceStyle: 'automatic',
    // Keyboard configuration
    hideKeyboardAccessoryBar: false,
    keyboardDisplayRequiresUserAction: true,
    // Security and privacy
    allowsLinkPreview: false,
    // Performance
    limitsNavigationsToAppBoundDomains: true,
  },

  // Development server configuration
  ...(process.env.NODE_ENV === 'development' && {
    server: {
      url: 'http://localhost:5173',
      cleartext: true,
    },
  }),
};

export default config;
