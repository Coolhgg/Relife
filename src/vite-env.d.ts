/// <reference types="vite/client" />
/// <reference types="@testing-library/jest-dom" />
/// <reference lib="DOM" />
/// <reference lib="DOM.Iterable" />
/// <reference lib="WebWorker" />
/// <reference lib="ES2020" />

// Global type extensions for Browser APIs
declare global {
  interface Window {
    swManager?: import('./services/service-worker-manager').ServiceWorkerManager;
  }
  
  interface ServiceWorkerGlobalScope {
    skipWaiting(): void;
  }
}

// Ensure this file is treated as a module
export {};
