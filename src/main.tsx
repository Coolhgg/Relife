import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import RootErrorBoundary from './components/RootErrorBoundary.tsx'
import { setupNotificationListeners } from './services/capacitor'
import { ServiceWorkerManager } from './services/service-worker-manager'

// Initialize Capacitor listeners
setupNotificationListeners();

// Initialize Enhanced Service Worker with Emotional Intelligence
const swManager = new ServiceWorkerManager();
console.log('🚀 Enhanced Service Worker initialized with emotional intelligence support');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
)
