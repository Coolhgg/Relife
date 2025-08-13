import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.scrapybara.relife',
  appName: 'Relife Alarm',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      launchFadeOutDuration: 1000,
      backgroundColor: "#667eea",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      spinnerColor: "#ffffff"
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: "#667eea"
    },
    Notifications: {
      presentationOptions: ["badge", "sound", "alert"],
      iconColor: "#667eea"
    },
    LocalNotifications: {
      iconColor: "#667eea",
      sound: "beep.wav",
      smallIcon: "ic_stat_icon_config_sample"
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
      title: "Relife Alarm is running",
      text: "Keeping your alarms ready",
      silent: false,
      resume: true
    },
    Badge: {
      // Enable app badge for pending alarms
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  ios: {
    scheme: "Relife",
    contentInset: "automatic"
  }
};

export default config;