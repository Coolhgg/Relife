import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import './index.css'
import App from './App.tsx'
import RootErrorBoundary from './components/RootErrorBoundary.tsx'
import { setupNotificationListeners } from './services/capacitor'
import { ServiceWorkerManager } from './services/service-worker-manager'
import LocationThemeService from './services/LocationThemeService'

// Initialize Capacitor listeners
setupNotificationListeners();

// Initialize Enhanced Service Worker with Emotional Intelligence
const swManager = new ServiceWorkerManager();
console.log('🚀 Enhanced Service Worker initialized with emotional intelligence support');

// Initialize Location Theme Service
const locationThemeService = LocationThemeService.getInstance();
locationThemeService.initialize();
console.log('🌍 Location Theme Service initialized');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem={true}
      disableTransitionOnChange={false}
    >
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
)
