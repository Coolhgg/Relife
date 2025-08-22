/// <reference lib="dom" />
import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }

  interface Navigator {
    standalone?: boolean;
  }
}

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  onInstall,
  onDismiss,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop' | 'other'>(
    'other'
  );

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInstalled = window.navigator.standalone === true || isStandalone;
    setIsInstalled(isInstalled);

    // Detect platform
    const userAgent = navigator.userAgent;
    if (/android/i.test(userAgent)) {
      setPlatform('android');
    } else if (/iPad|iPhone|iPod/.test(userAgent)) {
      setPlatform('ios');
    } else if (window.innerWidth >= 1024) {
      setPlatform('desktop');
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Show prompt after a delay if not already dismissed
      const hasBeenDismissed = localStorage.getItem('pwa-install-dismissed');
      if (!hasBeenDismissed && !isInstalled) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000); // Show after 3 seconds
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      console.log('PWA was installed successfully');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // For iOS, show manual install instructions
      if (platform === 'ios') {
        setShowPrompt(true);
        return;
      }
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        onInstall?.();
      } else {
        console.log('User dismissed the install prompt');
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    onDismiss?.();
  };

  const getInstallInstructions = () => {
    switch (platform) {
      case 'ios':
        return {
          title: 'Install Smart Alarm',
          steps: [
            'Tap the Share button',
            'Scroll down and tap "Add to Home Screen"',
            'Tap "Add" to install the app',
          ],
          icon: <Smartphone className="w-6 h-6" />,
        };
      case 'android':
        return {
          title: 'Install Smart Alarm',
          steps: [
            'Tap "Install" when prompted',
            'Or use browser menu "Add to Home screen"',
          ],
          icon: <Smartphone className="w-6 h-6" />,
        };
      case 'desktop':
        return {
          title: 'Install Smart Alarm',
          steps: [
            'Click the install button in your browser',
            'Or check the address bar for install option',
          ],
          icon: <Monitor className="w-6 h-6" />,
        };
      default:
        return {
          title: 'Install Smart Alarm',
          steps: ['Use your browser\'s "Add to Home Screen" option'],
          icon: <Download className="w-6 h-6" />,
        };
    }
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  const instructions = getInstallInstructions();

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:max-w-sm bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-200 p-4 z-50 animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {instructions.icon}
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {instructions.title}
          </h3>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
          Install for the best experience:
        </p>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          {instructions.steps.map((step, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-primary-600 dark:text-primary-400 font-medium">
                {index + 1}.
              </span>
              {step}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-2">
        {(deferredPrompt || platform === 'ios') && (
          <button
            onClick={handleInstall}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Install App
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white text-sm font-medium transition-colors"
        >
          Maybe Later
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-200">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Works offline • Background alarms • Native experience
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
