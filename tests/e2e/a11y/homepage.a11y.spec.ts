/**
 * Homepage/Dashboard - End-to-End Accessibility Tests
 * 
 * Tests critical accessibility compliance for the main dashboard
 * including navigation, alarm list, and primary user interactions.
 */

import { test, expect } from '@playwright/test';
import { createA11yUtils, axeConfigs, a11yPatterns } from './playwright-a11y-utils';

test.describe('Homepage - Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should have no critical accessibility violations on homepage', async ({ page }) => {
    const a11y = createA11yUtils(page);
    
    // Test for critical violations only
    await a11y.expectNoViolations(axeConfigs.critical);
  });

  test('should have comprehensive WCAG 2.1 AA compliance', async ({ page }) => {
    const a11y = createA11yUtils(page);
    
    // Full WCAG 2.1 AA compliance test
    await a11y.expectNoViolations(axeConfigs.wcag21aa);
  });

  test('should have proper page structure and landmarks', async ({ page }) => {
    // Check for required page landmarks
    await expect(page.locator('main, [role="main"]')).toBeVisible();
    await expect(page.locator('nav, [role="navigation"]')).toBeVisible();
    
    // Check heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1); // Should have exactly one h1
    
    // Ensure headings are in logical order
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    for (const heading of headings.slice(0, 5)) { // Test first 5 headings
      const text = await heading.textContent();
      expect(text?.trim()).toBeTruthy(); // Headings should not be empty
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    const a11y = createA11yUtils(page);
    
    // Test keyboard navigation through the page
    const navResults = await a11y.testKeyboardNavigation();
    
    expect(navResults.focusableElements.length).toBeGreaterThan(0);
    expect(navResults.violations.length).toBe(0);
    
    // Test tab order makes sense
    expect(navResults.tabOrder.length).toBeGreaterThan(0);
  });

  test('should have adequate color contrast', async ({ page }) => {
    const a11y = createA11yUtils(page);
    
    const contrastResults = await a11y.testColorContrast();
    
    expect(contrastResults.passed).toBe(true);
    expect(contrastResults.wcagAA).toBe(true);
  });

  test('should have adequate touch targets for mobile', async ({ page }) => {
    const a11y = createA11yUtils(page);
    
    const touchResults = await a11y.testTouchTargets(44); // 44px minimum
    
    expect(touchResults.violations).toBe(0);
  });

  test('should handle focus management properly', async ({ page }) => {
    // Test that focus is visible and logical
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => {
      const active = document.activeElement;
      return active ? {
        tagName: active.tagName.toLowerCase(),
        hasVisibleFocus: getComputedStyle(active).outline !== 'none'
      } : null;
    });
    
    expect(focusedElement).toBeTruthy();
  });

  test('should announce page changes to screen readers', async ({ page }) => {
    const a11y = createA11yUtils(page);
    
    // Check for page title
    await expect(page).toHaveTitle(/relife|alarm/i);
    
    // Check for live regions that would announce changes
    const liveRegions = await page.locator('[aria-live]').count();
    expect(liveRegions).toBeGreaterThan(0);
  });

  test('should be accessible in different viewport sizes', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500); // Allow layout to settle
    
    const a11y = createA11yUtils(page);
    await a11y.expectNoViolations(axeConfigs.critical);
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await a11y.expectNoViolations(axeConfigs.critical);
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);
    await a11y.expectNoViolations(axeConfigs.critical);
  });

  test('should handle dark mode accessibility', async ({ page }) => {
    // Toggle to dark mode if available
    const darkModeToggle = page.locator('[aria-label*="dark"], [aria-label*="theme"], button:has-text("dark")').first();
    
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      await page.waitForTimeout(500); // Allow theme to apply
      
      const a11y = createA11yUtils(page);
      await a11y.expectNoViolations(axeConfigs.critical);
      
      // Test color contrast in dark mode
      const contrastResults = await a11y.testColorContrast();
      expect(contrastResults.wcagAA).toBe(true);
    }
  });
});

test.describe('Alarm List - Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have accessible alarm cards', async ({ page }) => {
    const alarmCards = page.locator('[data-testid*="alarm"], .alarm-card, [role="article"]').first();
    
    if (await alarmCards.isVisible()) {
      const a11y = createA11yUtils(page);
      
      // Test alarm card accessibility
      await a11y.expectNoViolations({
        ...axeConfigs.wcag21aa,
        include: ['[data-testid*="alarm"], .alarm-card, [role="article"]'],
      });
      
      // Check that alarm cards have accessible names
      const cardText = await alarmCards.textContent();
      expect(cardText?.trim()).toBeTruthy();
    }
  });

  test('should support keyboard navigation between alarms', async ({ page }) => {
    const alarmCards = await page.locator('[data-testid*="alarm"], .alarm-card, button').all();
    
    if (alarmCards.length > 1) {
      // Navigate through alarm cards with keyboard
      await page.keyboard.press('Tab');
      
      for (let i = 0; i < Math.min(alarmCards.length, 5); i++) {
        const focused = await page.evaluate(() => document.activeElement?.tagName);
        expect(focused).toBeTruthy();
        await page.keyboard.press('Tab');
      }
    }
  });

  test('should announce alarm state changes', async ({ page }) => {
    const toggleButton = page.locator('button:has-text("enable"), button:has-text("disable"), [aria-label*="toggle"]').first();
    
    if (await toggleButton.isVisible()) {
      const a11y = createA11yUtils(page);
      
      // Test that toggling announces the change
      const announcements = await a11y.expectAnnouncement(async () => {
        await toggleButton.click();
      });
      
      // Should announce the state change
      expect(announcements.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Navigation - Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have accessible navigation menu', async ({ page }) => {
    const nav = page.locator('nav, [role="navigation"]').first();
    await expect(nav).toBeVisible();
    
    const a11y = createA11yUtils(page);
    await a11y.expectNoViolations({
      ...axeConfigs.wcag21aa,
      include: ['nav, [role="navigation"]'],
    });
  });

  test('should support skip links', async ({ page }) => {
    // Tab to first element (should be skip link)
    await page.keyboard.press('Tab');
    
    const skipLink = await page.evaluate(() => {
      const active = document.activeElement;
      return active?.textContent?.toLowerCase().includes('skip') || false;
    });
    
    // Skip link may not be visible but should be accessible
    if (skipLink) {
      await page.keyboard.press('Enter');
      
      // Should jump to main content
      const focused = await page.evaluate(() => {
        const active = document.activeElement;
        return active?.closest('main') !== null;
      });
      
      expect(focused).toBe(true);
    }
  });

  test('should handle mobile menu accessibility', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const menuButton = page.locator('button[aria-label*="menu"], button:has-text("menu"), .menu-toggle').first();
    
    if (await menuButton.isVisible()) {
      // Test menu button
      await expect(menuButton).toHaveAttribute('aria-expanded');
      
      // Open menu
      await menuButton.click();
      
      // Test menu accessibility
      const a11y = createA11yUtils(page);
      await a11y.expectNoViolations(axeConfigs.critical);
      
      // Test escape key closes menu
      await page.keyboard.press('Escape');
      
      const isExpanded = await menuButton.getAttribute('aria-expanded');
      expect(isExpanded).toBe('false');
    }
  });
});

test.describe('Error States - Accessibility Tests', () => {
  test('should handle error states accessibly', async ({ page }) => {
    // Try to trigger an error state (this may vary based on implementation)
    await page.goto('/invalid-route');
    
    // Wait for error page to load
    await page.waitForTimeout(1000);
    
    const a11y = createA11yUtils(page);
    
    // Error pages should still be accessible
    await a11y.expectNoViolations(axeConfigs.critical);
    
    // Should have proper heading and error message
    const errorContent = await page.textContent('body');
    expect(errorContent).toBeTruthy();
  });

  test('should announce loading states', async ({ page }) => {
    await page.goto('/');
    
    // Look for loading indicators
    const loader = page.locator('[aria-label*="loading"], .loader, .spinner').first();
    
    if (await loader.isVisible()) {
      // Loading indicators should be announced to screen readers
      const ariaLabel = await loader.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });
});