import React from 'react';
// Consent Banner Component for GDPR/CCPA Compliance
// Provides a user-friendly way to collect privacy consent

import { useState } from 'react';
import { Shield, Settings, Check, X, Info } from 'lucide-react';
import PrivacyComplianceService, { type ConsentSettings } from '../services/privacy-compliance';

interface ConsentBannerProps {
  onConsentGiven: (consents: ConsentSettings) => void;
  onConsentDenied: () => void;
  isVisible: boolean;
  userId?: string;
}

export default function ConsentBanner({ onConsentGiven, onConsentDenied, isVisible, userId }: ConsentBannerProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [consents, setConsents] = useState<ConsentSettings>({
    analytics: false,
    performance: false,
    errorTracking: true, // Pre-checked as it's beneficial for app stability
    sessionRecording: false,
    marketing: false,
    functional: true // Always true as it's essential
  });

  const privacyService = PrivacyComplianceService.getInstance();

  if (!isVisible) return null;

  const handleAcceptAll = () => {
    const allConsents: ConsentSettings = {
      analytics: true,
      performance: true,
      errorTracking: true,
      sessionRecording: false, // Keep this opt-in only
      marketing: false,
      functional: true
    };
    
    privacyService.setBulkConsent(allConsents, 'banner', userId);
    onConsentGiven(allConsents);
  };

  const handleRejectAll = () => {
    const minimalConsents: ConsentSettings = {
      analytics: false,
      performance: false,
      errorTracking: false,
      sessionRecording: false,
      marketing: false,
      functional: true // Essential functionality only
    };
    
    privacyService.setBulkConsent(minimalConsents, 'banner', userId);
    onConsentDenied();
  };

  const handleSavePreferences = () => {
    privacyService.setBulkConsent(consents, 'banner', userId);
    onConsentGiven(consents);
  };

  const handleConsentChange = (type: keyof ConsentSettings, value: boolean) => {
    setConsents(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const consentDescriptions = {
    functional: {
      title: 'Essential',
      description: 'Required for the app to function properly. Includes authentication, alarm management, and core features.',
      required: true
    },
    errorTracking: {
      title: 'Error Tracking',
      description: 'Helps us identify and fix bugs to improve app stability. No personal data is collected.',
      required: false
    },
    performance: {
      title: 'Performance',
      description: 'Monitors app performance and loading times to optimize your experience.',
      required: false
    },
    analytics: {
      title: 'Analytics',
      description: 'Helps us understand how you use the app to improve features. Data is anonymized.',
      required: false
    },
    sessionRecording: {
      title: 'Session Recording',
      description: 'Records user interactions to help debug issues. All sensitive data is masked.',
      required: false
    },
    marketing: {
      title: 'Marketing',
      description: 'Allows us to show you relevant content and features. You can opt-out anytime.',
      required: false
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center p-4">
      <div 
        className="bg-white dark:bg-dark-800 rounded-t-lg md:rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="consent-banner-title"
        aria-describedby="consent-banner-description"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-dark-200">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
            <h2 id="consent-banner-title" className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Privacy Matters
            </h2>
          </div>
          <p id="consent-banner-description" className="text-gray-600 dark:text-gray-300 leading-relaxed">
            We respect your privacy and want to be transparent about how we collect and use your data. 
            Please choose what you're comfortable with to help us improve your alarm app experience.
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showDetails ? (
            // Simple banner view
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  <Check className="w-4 h-4 mr-1" aria-hidden="true" />
                  Essential Functions
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                  <Info className="w-4 h-4 mr-1" aria-hidden="true" />
                  Error Reporting
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                  Analytics &amp; Performance
                </span>
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400">
                We use essential cookies and may collect anonymized usage data to improve the app. 
                <button
                  onClick={() => setShowDetails(true)}
                  className="text-primary-600 dark:text-primary-400 hover:underline ml-1"
                >
                  Learn more about our data practices
                </button>
              </p>
            </div>
          ) : (
            // Detailed consent options
            <div className="space-y-6">
              <div className="grid gap-4">
                {Object.entries(consentDescriptions).map(([key, config]) => (
                  <div key={key} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <div className="flex items-center h-5">
                      <input
                        id={`consent-${key}`}
                        type="checkbox"
                        checked={consents[key as keyof ConsentSettings]}
                        disabled={config.required}
                        onChange={(e) => handleConsentChange(key as keyof ConsentSettings, e.target.checked)}
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 disabled:opacity-50"
                        aria-describedby={`consent-${key}-description`}
                      />
                    </div>
                    <div className="flex-1">
                      <label 
                        htmlFor={`consent-${key}`} 
                        className="flex items-center gap-2 font-medium text-gray-900 dark:text-white mb-1 cursor-pointer"
                      >
                        {config.title}
                        {config.required && (
                          <span className="text-xs bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400 px-2 py-0.5 rounded">
                            Required
                          </span>
                        )}
                      </label>
                      <p id={`consent-${key}-description`} className="text-sm text-gray-600 dark:text-gray-300">
                        {config.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400 mb-2">
                  <Info className="w-4 h-4" aria-hidden="true" />
                  <span className="font-medium">Your Rights</span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  You can change these preferences anytime in Settings. You also have the right to export or delete your data.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-dark-200 bg-gray-50 dark:bg-dark-700">
          {!showDetails ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAcceptAll}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                type="button"
              >
                Accept All
              </button>
              <button
                onClick={() => setShowDetails(true)}
                className="flex items-center justify-center gap-2 flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-dark-600 dark:hover:bg-dark-500 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                type="button"
              >
                <Settings className="w-4 h-4" aria-hidden="true" />
                Customize
              </button>
              <button
                onClick={handleRejectAll}
                className="sm:w-auto bg-white hover:bg-gray-100 dark:bg-dark-800 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-dark-300 px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                type="button"
              >
                Reject All
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSavePreferences}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                type="button"
              >
                Save My Preferences
              </button>
              <button
                onClick={() => setShowDetails(false)}
                className="sm:w-auto bg-gray-200 hover:bg-gray-300 dark:bg-dark-600 dark:hover:bg-dark-500 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                type="button"
              >
                Back
              </button>
            </div>
          )}
        </div>

        {/* Legal links */}
        <div className="px-6 py-3 bg-gray-100 dark:bg-dark-900 text-center rounded-b-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            By using this app, you agree to our{' '}
            <a href="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
              Privacy Policy
            </a>{' '}
            and{' '}
            <a href="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">
              Terms of Service
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}