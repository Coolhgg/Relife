/**
 * Simple Accessibility Integration Test
 * Verifies core accessibility functionality
 */

describe('Accessibility Integration', () => {
  test('should be able to import accessibility services without errors', async () => {
    // This tests that the imports don't crash
    const { default: AccessibilityPreferencesService } = await import('../services/accessibility-preferences');
    const { useAccessibilityPreferences } = await import('../hooks/useAccessibilityPreferences');
    const { KeyboardNavigationService } = await import('../utils/keyboard-navigation');
    
    expect(AccessibilityPreferencesService).toBeDefined();
    expect(useAccessibilityPreferences).toBeDefined();
    expect(KeyboardNavigationService).toBeDefined();
  });
  
  test('accessibility preferences should have proper structure', async () => {
    // Mock DOM environment
    (global as any).document = {
      documentElement: { style: { setProperty: () => {} } },
      body: { classList: { toggle: () => {} } },
      createElement: () => ({ textContent: '', appendChild: () => {} }),
      head: { appendChild: () => {} },
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    
    (global as any).window = {
      matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
      localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      navigator: { userAgent: 'Test' },
      speechSynthesis: { getVoices: () => [] },
    };
    
    const { default: AccessibilityPreferencesService } = await import('../services/accessibility-preferences');
    const service = AccessibilityPreferencesService.getInstance();
    const prefs = service.getPreferences();
    
    // Verify all expected properties exist
    expect(typeof prefs.highContrastMode).toBe('boolean');
    expect(typeof prefs.reducedMotion).toBe('boolean');
    expect(typeof prefs.keyboardNavigation).toBe('boolean');
    expect(typeof prefs.screenReaderOptimized).toBe('boolean');
    expect(['small', 'medium', 'large', 'extra-large']).toContain(prefs.fontSize);
  });
});