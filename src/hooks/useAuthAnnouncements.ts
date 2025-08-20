import { useCallback } from "react";
import { useScreenReaderAnnouncements } from "./useScreenReaderAnnouncements";

export function useAuthAnnouncements() {
  const { announce } = useScreenReaderAnnouncements();

  // Login announcements
  const announceLoginStart = useCallback(
    (method: "email" | "google" | "apple" | "biometric") => {
      const methodNames = {
        email: "email and password",
        google: "Google account",
        apple: "Apple ID",
        biometric: "biometric authentication",
      };
      announce(
        `Signing in with ${methodNames[method]}. Please wait...`,
        "polite",
      );
    },
    [announce],
  );

  const announceLoginSuccess = useCallback(
    (username?: string) => {
      let message = "Login successful!";
      if (username) {
        message += ` Welcome back, ${username}.`;
      }
      message += " Redirecting to your dashboard.";
      announce(message, "assertive");
    },
    [announce],
  );

  const announceLoginError = useCallback(
    (error: string, suggestion?: string) => {
      let message = `Login failed: ${error}.`;
      if (suggestion) {
        message += ` ${suggestion}`;
      }
      announce(message, "assertive");
    },
    [announce],
  );

  // Registration announcements
  const announceRegistrationStart = useCallback(() => {
    announce("Creating your account. Please wait...", "polite");
  }, [announce]);

  const announceRegistrationSuccess = useCallback(
    (email: string) => {
      announce(
        `Account created successfully for ${email}! Please check your email for verification instructions.`,
        "assertive",
      );
    },
    [announce],
  );

  const announceRegistrationError = useCallback(
    (error: string) => {
      announce(
        `Registration failed: ${error}. Please correct the errors and try again.`,
        "assertive",
      );
    },
    [announce],
  );

  // Password reset announcements
  const announcePasswordResetRequest = useCallback(
    (email: string) => {
      announce(
        `Password reset email sent to ${email}. Please check your inbox and follow the instructions.`,
        "polite",
      );
    },
    [announce],
  );

  const announcePasswordResetSuccess = useCallback(() => {
    announce(
      "Password reset successful! You can now sign in with your new password.",
      "assertive",
    );
  }, [announce]);

  const announcePasswordResetError = useCallback(
    (error: string) => {
      announce(
        `Password reset failed: ${error}. Please try again.`,
        "assertive",
      );
    },
    [announce],
  );

  // Email verification announcements
  const announceEmailVerificationSent = useCallback(
    (email: string) => {
      announce(
        `Verification email sent to ${email}. Please check your inbox and click the verification link.`,
        "polite",
      );
    },
    [announce],
  );

  const announceEmailVerificationSuccess = useCallback(() => {
    announce(
      "Email verified successfully! Your account is now fully activated.",
      "assertive",
    );
  }, [announce]);

  const announceEmailVerificationError = useCallback(
    (error: string) => {
      announce(
        `Email verification failed: ${error}. Please try again or contact support.`,
        "assertive",
      );
    },
    [announce],
  );

  // Biometric authentication announcements
  const announceBiometricPrompt = useCallback(
    (type: "fingerprint" | "face" | "voice") => {
      const typeNames = {
        fingerprint: "fingerprint scanner",
        face: "face recognition camera",
        voice: "voice recognition microphone",
      };
      announce(`Please use the ${typeNames[type]} to authenticate.`, "polite");
    },
    [announce],
  );

  const announceBiometricSuccess = useCallback(
    (type: "fingerprint" | "face" | "voice") => {
      announce(`${type} authentication successful!`, "polite");
    },
    [announce],
  );

  const announceBiometricError = useCallback(
    (type: "fingerprint" | "face" | "voice", error: string) => {
      announce(
        `${type} authentication failed: ${error}. Please try again or use alternative method.`,
        "assertive",
      );
    },
    [announce],
  );

  // Two-factor authentication announcements
  const announceTwoFactorPrompt = useCallback(
    (method: "sms" | "email" | "authenticator") => {
      const methodNames = {
        sms: "SMS text message",
        email: "email",
        authenticator: "authenticator app",
      };
      announce(
        `Please enter the verification code sent to your ${methodNames[method]}.`,
        "polite",
      );
    },
    [announce],
  );

  const announceTwoFactorSuccess = useCallback(() => {
    announce("Two-factor authentication successful!", "polite");
  }, [announce]);

  const announceTwoFactorError = useCallback(
    (error: string, attemptsRemaining?: number) => {
      let message = `Two-factor authentication failed: ${error}.`;
      if (attemptsRemaining !== undefined && attemptsRemaining > 0) {
        message += ` You have ${attemptsRemaining} attempt${attemptsRemaining === 1 ? "" : "s"} remaining.`;
      } else if (attemptsRemaining === 0) {
        message += " Maximum attempts reached. Please try again later.";
      }
      announce(message, "assertive");
    },
    [announce],
  );

  // Session management announcements
  const announceSessionExpiring = useCallback(
    (minutesRemaining: number) => {
      announce(
        `Your session will expire in ${minutesRemaining} minute${minutesRemaining === 1 ? "" : "s"}. Please save your work and extend your session if needed.`,
        "assertive",
      );
    },
    [announce],
  );

  const announceSessionExpired = useCallback(() => {
    announce(
      "Your session has expired for security reasons. Please sign in again to continue.",
      "assertive",
    );
  }, [announce]);

  const announceSessionExtended = useCallback(() => {
    announce(
      "Session extended successfully. You can continue working.",
      "polite",
    );
  }, [announce]);

  // Logout announcements
  const announceLogoutStart = useCallback(() => {
    announce("Signing out. Please wait...", "polite");
  }, [announce]);

  const announceLogoutSuccess = useCallback(() => {
    announce(
      "You have been signed out successfully. Thank you for using the app!",
      "polite",
    );
  }, [announce]);

  const announceLogoutError = useCallback(
    (error: string) => {
      announce(
        `Logout failed: ${error}. Your session may still be active.`,
        "assertive",
      );
    },
    [announce],
  );

  // Account security announcements
  const announcePasswordStrength = useCallback(
    (strength: "weak" | "fair" | "good" | "strong") => {
      const messages = {
        weak: "Password strength: Weak. Consider using a longer password with mixed characters.",
        fair: "Password strength: Fair. Add numbers and special characters for better security.",
        good: "Password strength: Good. Your password meets most security requirements.",
        strong: "Password strength: Strong. Your password is secure!",
      };
      announce(messages[strength], "polite");
    },
    [announce],
  );

  const announceSecurityAlert = useCallback(
    (alertType: string, details: string) => {
      announce(
        `Security alert: ${alertType}. ${details}. Please review your account security settings.`,
        "assertive",
      );
    },
    [announce],
  );

  const announceAccountLocked = useCallback(
    (reason: string, unlockTime?: Date) => {
      let message = `Account temporarily locked: ${reason}.`;
      if (unlockTime) {
        message += ` You can try again at ${unlockTime.toLocaleTimeString()}.`;
      }
      announce(message, "assertive");
    },
    [announce],
  );

  // Privacy and permissions announcements
  const announcePermissionRequest = useCallback(
    (permission: string, reason: string) => {
      announce(
        `Permission request: The app needs access to ${permission}. ${reason} You can change this later in settings.`,
        "polite",
      );
    },
    [announce],
  );

  const announcePermissionGranted = useCallback(
    (permission: string) => {
      announce(`Permission granted for ${permission}. Thank you!`, "polite");
    },
    [announce],
  );

  const announcePermissionDenied = useCallback(
    (permission: string, impact: string) => {
      announce(
        `Permission denied for ${permission}. ${impact} You can enable this in your device settings if needed.`,
        "polite",
      );
    },
    [announce],
  );

  const announceDataUsageInfo = useCallback(
    (info: string) => {
      announce(`Data usage information: ${info}`, "polite");
    },
    [announce],
  );

  return {
    announceLoginStart,
    announceLoginSuccess,
    announceLoginError,
    announceRegistrationStart,
    announceRegistrationSuccess,
    announceRegistrationError,
    announcePasswordResetRequest,
    announcePasswordResetSuccess,
    announcePasswordResetError,
    announceEmailVerificationSent,
    announceEmailVerificationSuccess,
    announceEmailVerificationError,
    announceBiometricPrompt,
    announceBiometricSuccess,
    announceBiometricError,
    announceTwoFactorPrompt,
    announceTwoFactorSuccess,
    announceTwoFactorError,
    announceSessionExpiring,
    announceSessionExpired,
    announceSessionExtended,
    announceLogoutStart,
    announceLogoutSuccess,
    announceLogoutError,
    announcePasswordStrength,
    announceSecurityAlert,
    announceAccountLocked,
    announcePermissionRequest,
    announcePermissionGranted,
    announcePermissionDenied,
    announceDataUsageInfo,
  };
}
