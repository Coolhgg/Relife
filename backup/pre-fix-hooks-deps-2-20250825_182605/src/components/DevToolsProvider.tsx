/**
 * Developer Tools Initialization and Integration
 *
 * This file provides setup and integration for all developer tools
 * in the Relife application.
 */

import React, { useState, useEffect } from 'react';
import { DeveloperDashboard } from './DeveloperDashboard';

// Dev tools hotkey and initialization
export const DevToolsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [showDevTools, setShowDevTools] = useState(false);

  // Only available in development
  const isDev = process.env.NODE_ENV === 'development';

  // Keyboard shortcut to toggle dev tools
  useEffect(() => {
    if (!isDev) return;

    const handleKeydown = (e: KeyboardEvent) => {
      // Ctrl+Shift+D (or Cmd+Shift+D on Mac) to toggle dev tools
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDevTools(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isDev]);

  // Add global dev tools access
  useEffect(() => {
    if (!isDev) return;

    (window as any).__RELIFE_DEV_TOOLS__ = {
      show: () => setShowDevTools(true),
      hide: () => setShowDevTools(false),
      toggle: () => setShowDevTools(prev => !prev),
    };

    console.log('🛠️ Relife Developer Tools loaded!');
    console.log('📋 Available tools:');
    console.log('  - Redux DevTools (browser extension)');
    console.log('  - Performance Monitor');
    console.log('  - API Monitor');
    console.log('  - Accessibility Tester');
    console.log('  - Component Inspector');
    console.log('  - Error Tracker');
    console.log('  - Theme Debugger');
    console.log('  - Storage Inspector');
    console.log('  - Network Monitor');
    console.log('  - Analytics Panel');
    console.log('');
    console.log('🔑 Hotkey: Ctrl+Shift+D (Cmd+Shift+D on Mac)');
    console.log('🖥️ Global: window.__RELIFE_DEV_TOOLS__.show()');

    return () => {
      delete (window as any).__RELIFE_DEV_TOOLS__;
    };
  }, [isDev]);

  if (!isDev) return <>{children}</>;

  return (
    <>
      {children}
      <DeveloperDashboard
        isOpen={showDevTools}
        onClose={() => setShowDevTools(false)}
      />

      {/* Dev tools indicator */}
      {showDevTools && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-1 rounded text-sm z-[10000]">
          Dev Tools Active
        </div>
      )}
    </>
  );
};

// Hook for accessing dev tools programmatically
export const useDevTools = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDevTools = () => {
    if ((window as any).__RELIFE_DEV_TOOLS__) {
      (window as any).__RELIFE_DEV_TOOLS__.toggle();
      setIsOpen(prev => !prev);
    }
  };

  const showDevTools = () => {
    if ((window as any).__RELIFE_DEV_TOOLS__) {
      (window as any).__RELIFE_DEV_TOOLS__.show();
      setIsOpen(true);
    }
  };

  const hideDevTools = () => {
    if ((window as any).__RELIFE_DEV_TOOLS__) {
      (window as any).__RELIFE_DEV_TOOLS__.hide();
      setIsOpen(false);
    }
  };

  return {
    isOpen,
    toggle: toggleDevTools,
    show: showDevTools,
    hide: hideDevTools,
  };
};
