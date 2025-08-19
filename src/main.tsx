import React from 'react';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import RootErrorBoundary from './components/RootErrorBoundary.tsx'
import { setupNotificationListeners } from './services/capacitor'
import { ServiceWorkerManager } from './services/service-worker-manager'
import { initializeApp } from './config/initializeApp'
import { pwaManager } from './services/pwa-manager'

// Show loading screen while app initializes
const showLoadingScreen = () => {
  const loadingElement = document.createElement('div');
  loadingElement.id = 'app-loading';
  loadingElement.className = 'min-h-screen flex items-center justify-center bg-primary-900';
  loadingElement.innerHTML = `
    <div class="text-center text-white">
      <div class="w-16 h-16 mx-auto mb-4 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      <h2 class="text-xl font-semibold">Starting Relife Alarms...</h2>
      <p class="text-primary-200 mt-2">Initializing multi-language support...</p>
    </div>
  `;
  document.body.appendChild(loadingElement);
};

const hideLoadingScreen = () => {
  const loadingElement = document.getElementById('app-loading');
  if (loadingElement) {
    document.body.removeChild(loadingElement);
  }
};

// Initialize app
const startApp = async () => {
  showLoadingScreen();

  try {
    // Initialize app (including i18n)
    await initializeApp();

    // Initialize Capacitor listeners
    setupNotificationListeners();

    // Initialize Enhanced Service Worker with Emotional Intelligence
    const swManager = new ServiceWorkerManager();
    console.log('🚀 Enhanced Service Worker initialized with emotional intelligence support');

    // Initialize PWA Manager for mobile optimization
    console.log('📱 Initializing PWA Manager for mobile optimization...');
    // PWA Manager initializes automatically via singleton pattern

    // Hide loading screen
    hideLoadingScreen();

    // Render the app
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <RootErrorBoundary>
          <App />
        </RootErrorBoundary>
      </StrictMode>,
    );
  } catch (error) {
    console.error('Failed to start app:', error);
    hideLoadingScreen();

    // Show error screen
    const errorElement = document.createElement('div');
    errorElement.className = 'min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-900/10 p-4';
    errorElement.innerHTML = `
      <div class="text-center max-w-md mx-auto">
        <h2 class="text-xl font-bold text-red-800 dark:text-red-200 mb-2">App Initialization Failed</h2>
        <p class="text-red-600 dark:text-red-300 mb-4">
          There was a problem starting the application. Please refresh the page or try again later.
        </p>
        <button
          onclick="window.location.reload()"
          class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    `;
    document.body.appendChild(errorElement);
  }
};

// Start the app
startApp();