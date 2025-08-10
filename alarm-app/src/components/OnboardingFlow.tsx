import { useState } from 'react';
import { Bell, Mic, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import type { AppState } from '../types';
import { requestNotificationPermissions } from '../services/capacitor';

interface OnboardingFlowProps {
  onComplete: () => void;
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
}

type OnboardingStep = 'welcome' | 'notifications' | 'microphone' | 'complete';

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  appState,
  setAppState
}) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isLoading, setIsLoading] = useState(false);

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
        setCurrentStep('microphone');
      } else {
        // Still proceed to next step even if denied
        setCurrentStep('microphone');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setCurrentStep('microphone');
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
      
      setCurrentStep('complete');
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
      
      // Still proceed to complete
      setCurrentStep('complete');
    } finally {
      setIsLoading(false);
    }
  };

  const renderWelcomeStep = () => (
    <div className="text-center space-y-6">
      <div className="w-24 h-24 mx-auto bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
        <Clock className="w-12 h-12 text-primary-600 dark:text-primary-400" />
      </div>
      
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to Smart Alarm
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Wake up with personalized voice messages and never oversleep again!
        </p>
      </div>
      
      <div className="space-y-4 text-left max-w-sm mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <Bell className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <span className="text-gray-700 dark:text-gray-300">Smart notifications</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <Mic className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-gray-700 dark:text-gray-300">Voice-based dismissal</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-gray-700 dark:text-gray-300">Customizable voice moods</span>
        </div>
      </div>
      
      <button
        onClick={() => setCurrentStep('notifications')}
        className="alarm-button alarm-button-primary px-8 py-3 text-lg"
      >
        Get Started
        <ArrowRight className="w-5 h-5 ml-2" />
      </button>
    </div>
  );

  const renderNotificationsStep = () => (
    <div className="text-center space-y-6">
      <div className="w-24 h-24 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
        <Bell className="w-12 h-12 text-blue-600 dark:text-blue-400" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Enable Notifications
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Allow notifications so your alarms can wake you up even when the app is closed.
        </p>
      </div>
      
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-left max-w-md mx-auto">
        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
          Why we need this permission:
        </h4>
        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
          <li>• Send alarm notifications at the right time</li>
          <li>• Wake you up even when the app is closed</li>
          <li>• Provide snooze reminders</li>
        </ul>
      </div>
      
      <div className="space-y-3">
        <button
          onClick={handleNotificationPermission}
          disabled={isLoading}
          className="alarm-button alarm-button-primary w-full py-3"
        >
          {isLoading ? 'Requesting...' : 'Allow Notifications'}
        </button>
        
        <button
          onClick={() => setCurrentStep('microphone')}
          className="alarm-button alarm-button-secondary w-full py-3"
        >
          Skip for now
        </button>
      </div>
    </div>
  );

  const renderMicrophoneStep = () => (
    <div className="text-center space-y-6">
      <div className="w-24 h-24 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
        <Mic className="w-12 h-12 text-green-600 dark:text-green-400" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Enable Microphone
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Allow microphone access to dismiss alarms with your voice.
        </p>
      </div>
      
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-left max-w-md mx-auto">
        <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
          Voice dismissal features:
        </h4>
        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
          <li>• Say "stop" or "dismiss" to turn off alarms</li>
          <li>• Say "snooze" for 5 more minutes</li>
          <li>• Works with different voice moods</li>
        </ul>
      </div>
      
      <div className="space-y-3">
        <button
          onClick={handleMicrophonePermission}
          disabled={isLoading}
          className="alarm-button alarm-button-primary w-full py-3"
        >
          {isLoading ? 'Requesting...' : 'Allow Microphone'}
        </button>
        
        <button
          onClick={() => setCurrentStep('complete')}
          className="alarm-button alarm-button-secondary w-full py-3"
        >
          Skip for now
        </button>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <div className="w-24 h-24 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
        <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          All Set!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          You're ready to create your first smart alarm. Let's get started!
        </p>
      </div>
      
      <div className="space-y-2 text-left max-w-sm mx-auto">
        <div className={`flex items-center gap-3 ${
          appState.permissions.notifications.granted ? 'opacity-100' : 'opacity-50'
        }`}>
          <CheckCircle className={`w-5 h-5 ${
            appState.permissions.notifications.granted ? 'text-green-500' : 'text-gray-400'
          }`} />
          <span className="text-gray-700 dark:text-gray-300">Notifications enabled</span>
        </div>
        
        <div className={`flex items-center gap-3 ${
          appState.permissions.microphone.granted ? 'opacity-100' : 'opacity-50'
        }`}>
          <CheckCircle className={`w-5 h-5 ${
            appState.permissions.microphone.granted ? 'text-green-500' : 'text-gray-400'
          }`} />
          <span className="text-gray-700 dark:text-gray-300">Microphone enabled</span>
        </div>
      </div>
      
      <button
        onClick={onComplete}
        className="alarm-button alarm-button-primary px-8 py-3 text-lg"
      >
        Start Using Smart Alarm
        <ArrowRight className="w-5 h-5 ml-2" />
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
      case 'complete':
        return renderCompleteStep();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 dark:from-dark-900 dark:to-dark-800 flex items-center justify-center p-4 safe-top safe-bottom">
      <div className="w-full max-w-lg">
        {/* Progress indicators */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {['welcome', 'notifications', 'microphone', 'complete'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${
                  currentStep === step
                    ? 'bg-primary-600'
                    : index < ['welcome', 'notifications', 'microphone', 'complete'].indexOf(currentStep)
                    ? 'bg-green-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`} />
                {index < 3 && (
                  <div className={`w-8 h-0.5 mx-1 ${
                    index < ['welcome', 'notifications', 'microphone', 'complete'].indexOf(currentStep)
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Current step content */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl p-8 shadow-xl">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;