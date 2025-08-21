import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Bell, Mic, Clock, CheckCircle, ArrowRight, Plus, Calendar, Volume2 } from 'lucide-react';
import type { AppState } from '../types';
import { requestNotificationPermissions } from '../services/capacitor';
import { useFocusRestoration } from '../hooks/useFocusRestoration';

interface OnboardingFlowProps {
  onComplete: () => void;
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
}

type OnboardingStep = 'welcome' | 'notifications' | 'microphone' | 'quick-setup' | 'complete';

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  appState,
  setAppState
}) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [stepAnnouncement, setStepAnnouncement] = useState('');
  const stepHeaderRef = useRef<HTMLHeadingElement>(null);
  const primaryActionRef = useRef<HTMLButtonElement>(null);

  const { moveFocus } = useFocusRestoration({
    announceRestoration: true,
    preventScroll: false,
  });

  const announceStep = (step: OnboardingStep) => {
    const stepLabels = {
      welcome: 'Welcome step',
      notifications: 'Notification permission step',
      microphone: 'Microphone permission step',
      'quick-setup': 'Quick setup step',
      complete: 'Setup complete step'
    };
    setStepAnnouncement(`Now on ${stepLabels[step]}`);
    setTimeout(() => setStepAnnouncement(''), 100);
  };

  const moveToStep = (step: OnboardingStep) => {
    setCurrentStep(step);
    announceStep(step);
  };

  // Effect to manage focus when step changes
  useEffect(() => {
    // Small delay to ensure DOM is updated
    const focusTimeout = setTimeout(() => {
      if (stepHeaderRef.current) {
        stepHeaderRef.current.focus({ preventScroll: false });
      } else if (primaryActionRef.current) {
        primaryActionRef.current.focus({ preventScroll: false });
      }
    }, 100);

    return () => clearTimeout(focusTimeout);
  }, [currentStep]);

  const handleNotificationPermission = async () => {
    setIsLoading(true);
    try {
      const granted = await requestNotificationPermissions();
      setAppState(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          notifications: {
            granted,
            requestedAt: new Date()
          }
        }
      }));

      if (granted) {
        moveToStep('microphone');
      } else {
        // Still proceed to next step even if denied
        moveToStep('microphone');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      moveToStep('microphone');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrophonePermission = async () => {
    setIsLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Stop the stream immediately
      stream.getTracks().forEach(track => track.stop());

      setAppState(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          microphone: {
            granted: true,
            requestedAt: new Date()
          }
        }
      }));

      moveToStep('complete');
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setAppState(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          microphone: {
            granted: false,
            requestedAt: new Date()
          }
        }
      }));

      // Still proceed to quick-setup
      moveToStep('quick-setup');
    } finally {
      setIsLoading(false);
    }
  };

  const renderWelcomeStep = () => (
    <div className="text-center space-y-6" role="region" aria-labelledby="welcome-heading">
      <div className="w-24 h-24 mx-auto bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center" role="img" aria-label="Smart Alarm app icon">
        <Clock className="w-12 h-12 text-primary-600 dark:text-primary-400" aria-hidden="true" />
      </div>

      <div>
        <h1
          ref={stepHeaderRef}
          id="welcome-heading"
          className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
          tabIndex={-1}
        >
          Welcome to Smart Alarm
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Wake up with personalized voice messages and never oversleep again!
        </p>
      </div>

      <ul className="space-y-4 text-left max-w-sm mx-auto" role="list" aria-label="App features">
        <li className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center" role="img" aria-label="Notifications feature">
            <Bell className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden="true" />
          </div>
          <span className="text-gray-700 dark:text-gray-300">Smart notifications</span>
        </li>

        <li className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center" role="img" aria-label="Voice feature">
            <Mic className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          </div>
          <span className="text-gray-700 dark:text-gray-300">Voice-based dismissal</span>
        </li>

        <li className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center" role="img" aria-label="Customization feature">
            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
          </div>
          <span className="text-gray-700 dark:text-gray-300">Customizable voice moods</span>
        </li>
      </ul>

      <button
        ref={primaryActionRef}
        onClick={() => moveToStep('notifications')}
        className="alarm-button alarm-button-primary px-8 py-3 text-lg"
        aria-describedby="get-started-desc"
      >
        Get Started
        <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
        <span id="get-started-desc" className="sr-only">Begin the setup process to configure permissions</span>
      </button>
    </div>
  );

  const renderNotificationsStep = () => (
    <div className="text-center space-y-6" role="region" aria-labelledby="notifications-heading">
      <div className="w-24 h-24 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center" role="img" aria-label="Notifications permission icon">
        <Bell className="w-12 h-12 text-blue-600 dark:text-blue-400" aria-hidden="true" />
      </div>

      <div>
        <h2
          ref={stepHeaderRef}
          id="notifications-heading"
          className="text-2xl font-bold text-gray-900 dark:text-white mb-4"
          tabIndex={-1}
        >
          Enable Notifications
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Allow notifications so your alarms can wake you up even when the app is closed.
        </p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-left max-w-md mx-auto" role="note">
        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
          Why we need this permission:
        </h4>
        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1" role="list">
          <li>• Send alarm notifications at the right time</li>
          <li>• Wake you up even when the app is closed</li>
          <li>• Provide snooze reminders</li>
        </ul>
      </div>

      <div className="space-y-3" role="group" aria-label="Notification permission actions">
        <button
          onClick={handleNotificationPermission}
          disabled={isLoading}
          className="alarm-button alarm-button-primary w-full py-3"
          aria-describedby="notifications-button-desc"
          aria-label={isLoading ? 'Requesting notification permission' : 'Allow notifications'}
        >
          {isLoading ? 'Requesting...' : 'Allow Notifications'}
          <span id="notifications-button-desc" className="sr-only">
            Grant permission for the app to send you alarm notifications
          </span>
        </button>

        <button
          onClick={() => moveToStep('microphone')}
          className="alarm-button alarm-button-secondary w-full py-3"
          aria-label="Skip notification permission and continue to microphone setup"
        >
          Skip for now
        </button>
      </div>
    </div>
  );

  const renderMicrophoneStep = () => (
    <div className="text-center space-y-6" role="region" aria-labelledby="microphone-heading">
      <div className="w-24 h-24 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center" role="img" aria-label="Microphone permission icon">
        <Mic className="w-12 h-12 text-green-600 dark:text-green-400" aria-hidden="true" />
      </div>

      <div>
        <h2 id="microphone-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Enable Microphone
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Allow microphone access to dismiss alarms with your voice.
        </p>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-left max-w-md mx-auto" role="note">
        <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
          Voice dismissal features:
        </h4>
        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1" role="list">
          <li>• Say "stop" or "dismiss" to turn off alarms</li>
          <li>• Say "snooze" for 5 more minutes</li>
          <li>• Works with different voice moods</li>
        </ul>
      </div>

      <div className="space-y-3" role="group" aria-label="Microphone permission actions">
        <button
          onClick={handleMicrophonePermission}
          disabled={isLoading}
          className="alarm-button alarm-button-primary w-full py-3"
          aria-describedby="microphone-button-desc"
          aria-label={isLoading ? 'Requesting microphone permission' : 'Allow microphone access'}
        >
          {isLoading ? 'Requesting...' : 'Allow Microphone'}
          <span id="microphone-button-desc" className="sr-only">
            Grant permission for the app to access your microphone for voice commands
          </span>
        </button>

        <button
          onClick={() => moveToStep('quick-setup')}
          className="alarm-button alarm-button-secondary w-full py-3"
          aria-label="Skip microphone permission and continue to quick setup"
        >
          Skip for now
        </button>
      </div>
    </div>
  );

  const renderQuickSetupStep = () => (
    <div className="text-center space-y-6" role="region" aria-labelledby="quick-setup-heading">
      <div className="w-24 h-24 mx-auto bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center" role="img" aria-label="Quick setup icon">
        <Plus className="w-12 h-12 text-purple-600 dark:text-purple-400" aria-hidden="true" />
      </div>

      <div>
        <h2 id="quick-setup-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Quick Setup
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Ready to create your first smart alarm? Let's set up your morning routine!
        </p>
      </div>

      <div className="space-y-4 text-left max-w-md mx-auto" role="list" aria-label="Setup options">
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
          <h4 className="font-medium text-primary-800 dark:text-primary-200 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" aria-hidden="true" />
            Quick Morning Alarm
          </h4>
          <p className="text-sm text-primary-700 dark:text-primary-300 mb-3">
            Perfect for getting started - a simple 7:00 AM alarm with motivational voice
          </p>
          <button
            onClick={() => {
              // This would trigger creating a default alarm
              console.log('Creating quick morning alarm at 7:00 AM');
              moveToStep('complete');
            }}
            className="alarm-button alarm-button-primary w-full"
            aria-label="Create quick morning alarm at 7:00 AM"
          >
            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
            Create Quick Alarm
          </button>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" aria-hidden="true" />
            Custom Setup
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
            Choose your own time, days, and voice mood for a personalized experience
          </p>
          <button
            onClick={() => {
              // This would trigger the alarm creation form
              console.log('Opening custom alarm setup');
              moveToStep('complete');
            }}
            className="alarm-button alarm-button-secondary w-full"
            aria-label="Open custom alarm setup form"
          >
            <Volume2 className="w-4 h-4 mr-2" aria-hidden="true" />
            Customize My Alarm
          </button>
        </div>
      </div>

      <button
        onClick={() => moveToStep('complete')}
        className="text-gray-600 dark:text-gray-400 underline hover:text-gray-900 dark:hover:text-white"
        aria-label="Skip alarm setup for now and complete onboarding"
      >
        I'll set this up later
      </button>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center space-y-6" role="region" aria-labelledby="complete-heading">
      <div className="w-24 h-24 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center" role="img" aria-label="Setup complete icon">
        <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" aria-hidden="true" />
      </div>

      <div>
        <h2 id="complete-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          All Set!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          You're ready to create your first smart alarm. Let's get started!
        </p>
      </div>

      <div className="space-y-2 text-left max-w-sm mx-auto" role="status" aria-label="Permission status summary">
        <div
          className={`flex items-center gap-3 ${
            appState.permissions.notifications.granted ? 'opacity-100' : 'opacity-50'
          }`}
          role="status"
          aria-label={`Notifications ${appState.permissions.notifications.granted ? 'enabled' : 'disabled'}`}
        >
          <CheckCircle
            className={`w-5 h-5 ${
              appState.permissions.notifications.granted ? 'text-green-500' : 'text-gray-400'
            }`}
            aria-hidden="true"
          />
          <span className="text-gray-700 dark:text-gray-300">
            Notifications {appState.permissions.notifications.granted ? 'enabled' : 'disabled'}
          </span>
        </div>

        <div
          className={`flex items-center gap-3 ${
            appState.permissions.microphone.granted ? 'opacity-100' : 'opacity-50'
          }`}
          role="status"
          aria-label={`Microphone ${appState.permissions.microphone.granted ? 'enabled' : 'disabled'}`}
        >
          <CheckCircle
            className={`w-5 h-5 ${
              appState.permissions.microphone.granted ? 'text-green-500' : 'text-gray-400'
            }`}
            aria-hidden="true"
          />
          <span className="text-gray-700 dark:text-gray-300">
            Microphone {appState.permissions.microphone.granted ? 'enabled' : 'disabled'}
          </span>
        </div>
      </div>

      <button
        onClick={onComplete}
        className="alarm-button alarm-button-primary px-8 py-3 text-lg"
        aria-describedby="complete-button-desc"
      >
        Start Using Smart Alarm
        <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
        <span id="complete-button-desc" className="sr-only">Complete setup and start using the Smart Alarm app</span>
      </button>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'notifications':
        return renderNotificationsStep();
      case 'microphone':
        return renderMicrophoneStep();
      case 'quick-setup':
        return renderQuickSetupStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 dark:from-dark-900 dark:to-dark-800 flex items-center justify-center p-4 safe-top safe-bottom" role="main">
      {/* Screen reader announcements */}
      {stepAnnouncement && (
        <div className="sr-only" role="status" aria-live="polite">
          {stepAnnouncement}
        </div>
      )}

      <div className="w-full max-w-lg">
        {/* Progress indicators */}
        <nav className="flex justify-center mb-8" role="navigation" aria-label="Setup progress">
          <ol className="flex items-center gap-2" role="list">
            {['welcome', 'notifications', 'microphone', 'quick-setup', 'complete'].map((step, index) => {
              const stepNames = ['Welcome', 'Notifications', 'Microphone', 'Quick Setup', 'Complete'];
              const currentIndex = ['welcome', 'notifications', 'microphone', 'quick-setup', 'complete'].indexOf(currentStep);
              const isActive = currentStep === step;
              const isCompleted = index < currentIndex;

              return (
                <li key={step} className="flex items-center" role="listitem">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isActive
                        ? 'bg-primary-600'
                        : isCompleted
                        ? 'bg-green-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    role="img"
                    aria-label={`Step ${index + 1}: ${stepNames[index]} - ${isActive ? 'current' : isCompleted ? 'completed' : 'pending'}`}
                  />
                  {index < 4 && (
                    <div
                      className={`w-8 h-0.5 mx-1 ${
                        index < currentIndex
                          ? 'bg-green-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      role="img"
                      aria-label={`Step ${index + 1}: ${stepNames[index]} - ${isActive ? 'current' : isCompleted ? 'completed' : 'pending'}`}
                    />
                  )}
                </li>
                );
              }
            )}
          </ol>
        </nav>

        {/* Current step content */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl p-8 shadow-xl">
          {renderCurrentStep()}
        </div>
      </div>
    </main>
  );
};

export default OnboardingFlow;