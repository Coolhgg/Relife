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

  interface ImportMeta {
    env: Record<string, any>; // auto: added to satisfy Vite environment variable usage
  }
}

// React Component property extensions for ErrorBoundary classes
declare module 'react' {
  interface Component<P = {}, S = {}, SS = any> {
    state: S; // auto: added to satisfy ErrorBoundary usage
    props: P; // auto: added to satisfy ErrorBoundary usage
    setState: (
      partialState: Partial<S> | ((prevState: S, props: P
) => Partial<S>)
    
) => void; // auto: added to satisfy ErrorBoundary usage
  }
}

// Ensure this file is treated as a module
export {};
