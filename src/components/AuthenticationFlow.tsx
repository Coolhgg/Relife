import React from "react";
import { useState } from "react";
import { Clock } from "lucide-react";
import type { User } from "../types";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import ForgotPasswordForm from "./ForgotPasswordForm";

interface AuthenticationFlowProps {
  onAuthSuccess: (user: User) => void;
  onSignUp: (email: string, password: string, name: string) => Promise<void>;
  onSignIn: (email: string, password: string) => Promise<void>;
  onForgotPassword: (email: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  forgotPasswordSuccess: boolean;
}

type AuthView = "login" | "signup" | "forgot-password";

export default function AuthenticationFlow({
  onAuthSuccess,
  onSignUp,
  onSignIn,
  onForgotPassword,
  isLoading,
  error,
  forgotPasswordSuccess,
}: AuthenticationFlowProps) {
  const [currentView, setCurrentView] = useState<AuthView>("login");

  const renderCurrentView = () => {
    switch (currentView) {
      case "login":
        return (
          <LoginForm
            onLogin={onSignIn}
            onSwitchToSignUp={() => setCurrentView("signup")}
            onForgotPassword={() => setCurrentView("forgot-password")}
            isLoading={isLoading}
            error={error}
          />
        );
      case "signup":
        return (
          <SignUpForm
            onSignUp={onSignUp}
            onSwitchToLogin={() => setCurrentView("login")}
            isLoading={isLoading}
            error={error}
          />
        );
      case "forgot-password":
        return (
          <ForgotPasswordForm
            onResetPassword={onForgotPassword}
            onBackToLogin={() => setCurrentView("login")}
            isLoading={isLoading}
            error={error}
            success={forgotPasswordSuccess}
          />
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 dark:from-dark-900 dark:to-dark-800 flex items-center justify-center p-4 safe-top safe-bottom">
      <div className="w-full max-w-md">
        {/* App Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mb-4">
            <Clock
              className="w-8 h-8 text-primary-600 dark:text-primary-400"
              aria-hidden="true"
            />
          </div>
          <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-400">
            Smart Alarm
          </h2>
        </div>

        {/* Auth Form Container */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl p-8 shadow-xl">
          {renderCurrentView()}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
          <p>Your data is encrypted and secure</p>
        </div>
      </div>
    </main>
  );
}
