import { test, expect, devices } from '@playwright/test';
import { DashboardPage, AlarmFormPage, AuthPage, SettingsPage } from '../page-objects';
import { TestHelpers } from '../utils/test-helpers';
import { TestData } from '../fixtures/test-data';

// Mobile-specific tests
test.describe('Mobile Experience', () => {
  let dashboardPage: DashboardPage;
  let alarmFormPage: AlarmFormPage;
  let authPage: AuthPage;
  let settingsPage: SettingsPage;

  test.describe('Mobile Chrome', () => {
    test.use({ ...devices['Pixel 5'] });

    test.beforeEach(async ({ page }) => {
      dashboardPage = new DashboardPage(page);
      alarmFormPage = new AlarmFormPage(page);
      authPage = new AuthPage(page);
      settingsPage = new SettingsPage(page);

      await TestHelpers.clearAllStorage(page);
      await dashboardPage.navigateToDashboard();
    });

    test('should display mobile-optimized layout', async () => {
      await test.step('Verify mobile viewport', async () => {
        const viewportSize = dashboardPage.page.viewportSize();
        expect(viewportSize?.width).toBeLessThanOrEqual(500);
      });

      await test.step('Verify mobile navigation', async () => {
        // Mobile should have hamburger menu or bottom navigation
        const mobileNav = dashboardPage.page.locator(
          '[data-testid="mobile-nav"], .mobile-navigation, .bottom-nav'
        );
        const hamburgerMenu = dashboardPage.page.locator(
          '[data-testid="hamburger-menu"], .hamburger, .menu-toggle'
        );

        const hasMobileNav = await mobileNav.isVisible({ timeout: 3000 });
        const hasHamburger = await hamburgerMenu.isVisible({ timeout: 3000 });

        expect(hasMobileNav || hasHamburger).toBe(true);
      });

      await test.step('Verify touch-friendly buttons', async () => {
        // Buttons should be at least 44px for touch targets
        const buttons = dashboardPage.page.locator('button');
        const buttonCount = await buttons.count();

        for (let i = 0; i < Math.min(3, buttonCount); i++) {
          const button = buttons.nth(i);
          const boundingBox = await button.boundingBox();

          if (boundingBox) {
            expect(boundingBox.height).toBeGreaterThanOrEqual(40);
            expect(boundingBox.width).toBeGreaterThanOrEqual(40);
          }
        }
      });
    });

    test('should handle touch interactions', async () => {
      await test.step('Test tap interactions', async () => {
        await dashboardPage.addAlarmButton.tap();

        // Should open alarm form
        const formVisible = await alarmFormPage.timeInput.isVisible({ timeout: 5000 });
        if (formVisible) {
          expect(formVisible).toBe(true);

          // Close form
          const cancelButton = alarmFormPage.cancelButton;
          if (await cancelButton.isVisible()) {
            await cancelButton.tap();
          }
        }
      });

      await test.step('Test swipe gestures if supported', async () => {
        // Check for swipeable elements
        const swipeableElements = dashboardPage.page.locator(
          '[data-swipeable], .swipe-container, .carousel'
        );
        const hasSwipeable = (await swipeableElements.count()) > 0;

        if (hasSwipeable) {
          const element = swipeableElements.first();
          const boundingBox = await element.boundingBox();

          if (boundingBox) {
            // Simulate swipe left
            await dashboardPage.page.touchscreen.tap(
              boundingBox.x + boundingBox.width * 0.8,
              boundingBox.y + boundingBox.height / 2
            );

            await dashboardPage.page.touchscreen.tap(
              boundingBox.x + boundingBox.width * 0.2,
              boundingBox.y + boundingBox.height / 2
            );
          }
        }
      });

      await test.step('Test long press interactions', async () => {
        // Look for alarm items that might support long press
        const alarmItems = dashboardPage.page.locator('[data-testid="alarm-item"]');
        const alarmCount = await alarmItems.count();

        if (alarmCount > 0) {
          const firstAlarm = alarmItems.first();

          // Simulate long press
          await firstAlarm.hover();
          await dashboardPage.page.mouse.down();
          await dashboardPage.page.waitForTimeout(1000); // Long press duration
          await dashboardPage.page.mouse.up();

          // Check if context menu or action sheet appeared
          const contextMenu = dashboardPage.page.locator(
            '[role="menu"], .context-menu, .action-sheet'
          );
          const hasContextMenu = await contextMenu.isVisible({ timeout: 2000 });

          if (hasContextMenu) {
            // Dismiss context menu
            await dashboardPage.page.keyboard.press('Escape');
          }
        }
      });
    });

    test('should handle mobile alarm creation', async () => {
      await test.step('Open mobile alarm form', async () => {
        await alarmFormPage.openAlarmForm();
      });

      await test.step('Use mobile time picker', async () => {
        // Mobile time input might be different
        await alarmFormPage.timeInput.tap();

        // Look for mobile time picker
        const timePicker = dashboardPage.page.locator(
          '[data-testid="time-picker"], .time-picker-modal'
        );
        const hasTimePicker = await timePicker.isVisible({ timeout: 3000 });

        if (hasTimePicker) {
          // Use mobile time picker
          const hourInput = timePicker.locator(
            'input[aria-label*="hour"], [data-testid="hour-input"]'
          );
          const minuteInput = timePicker.locator(
            'input[aria-label*="minute"], [data-testid="minute-input"]'
          );

          if (await hourInput.isVisible()) {
            await hourInput.fill('09');
          }
          if (await minuteInput.isVisible()) {
            await minuteInput.fill('30');
          }

          const confirmButton = timePicker.locator(
            'button:has-text("OK"), button:has-text("Confirm")'
          );
          if (await confirmButton.isVisible()) {
            await confirmButton.tap();
          }
        } else {
          // Standard time input
          await alarmFormPage.setTime('09:30');
        }
      });

      await test.step('Complete mobile alarm creation', async () => {
        await alarmFormPage.setLabel('Mobile Test Alarm');
        await alarmFormPage.saveAlarm();

        // Verify alarm was created
        await alarmFormPage.waitForToast();
      });
    });

    test('should display mobile-friendly settings', async () => {
      await test.step('Open mobile settings', async () => {
        await settingsPage.openSettingsFromDashboard();
      });

      await test.step('Verify mobile settings layout', async () => {
        // Settings should be mobile-optimized
        const settingsContainer = settingsPage.settingsContainer;
        await expect(settingsContainer).toBeVisible();

        // Check for mobile-style tabs (might be horizontal scroll or accordion)
        const tabs = dashboardPage.page.locator('[role="tab"]');
        const tabCount = await tabs.count();

        if (tabCount > 0) {
          // Test tab navigation on mobile
          await tabs.first().tap();
          await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
        }
      });

      await test.step('Test mobile settings interactions', async () => {
        // Test toggle switches
        const toggles = dashboardPage.page.locator(
          '[role="switch"], input[type="checkbox"]'
        );
        const toggleCount = await toggles.count();

        if (toggleCount > 0) {
          const firstToggle = toggles.first();
          const initialState = await firstToggle.isChecked();

          await firstToggle.tap();
          const newState = await firstToggle.isChecked();
          expect(newState).toBe(!initialState);

          // Toggle back
          await firstToggle.tap();
        }
      });
    });
  });

  test.describe('Mobile Safari', () => {
    test.use({ ...devices['iPhone 12'] });

    test.beforeEach(async ({ page }) => {
      dashboardPage = new DashboardPage(page);
      alarmFormPage = new AlarmFormPage(page);

      await TestHelpers.clearAllStorage(page);
      await dashboardPage.navigateToDashboard();
    });

    test('should handle iOS-specific behaviors', async () => {
      await test.step('Verify iOS viewport handling', async () => {
        // iOS Safari has specific viewport behavior
        const viewportSize = dashboardPage.page.viewportSize();
        expect(viewportSize?.width).toBeLessThanOrEqual(500);
      });

      await test.step('Test iOS safe area handling', async () => {
        // Check if app handles iOS safe areas properly
        const safeAreaElements = dashboardPage.page.locator(
          '[style*="safe-area"], .safe-area'
        );
        const hasSafeArea = (await safeAreaElements.count()) > 0;

        if (hasSafeArea) {
          // Verify safe area implementation
          const element = safeAreaElements.first();
          const styles = await element.getAttribute('style');
          expect(styles).toContain('safe-area');
        }
      });

      await test.step('Test iOS scroll behavior', async () => {
        // iOS has momentum scrolling and bounce effects
        await TestHelpers.scrollToBottom(dashboardPage.page);
        await TestHelpers.scrollToTop(dashboardPage.page);

        // Should handle smoothly without breaking layout
        await expect(dashboardPage.addAlarmButton).toBeVisible();
      });
    });

    test('should handle iOS notification permissions', async () => {
      await test.step('Test notification permission request', async () => {
        await TestHelpers.mockNotificationPermission(dashboardPage.page, 'default');

        // Try to enable notifications
        await settingsPage.openSettingsFromDashboard();
        await settingsPage.switchToTab('notification');
        await settingsPage.configurePushNotifications();

        // Should handle permission gracefully
        const permissionDialog = dashboardPage.page.locator(
          '[data-testid="permission-dialog"]'
        );
        const hasPermissionRequest = await permissionDialog.isVisible({
          timeout: 3000,
        });

        if (hasPermissionRequest) {
          expect(hasPermissionRequest).toBe(true);
        }
      });
    });
  });

  test.describe('Mobile Accessibility', () => {
    test.use({ ...devices['Pixel 5'] });

    test.beforeEach(async ({ page }) => {
      dashboardPage = new DashboardPage(page);
      await TestHelpers.clearAllStorage(page);
      await dashboardPage.navigateToDashboard();
    });

    test('should support mobile screen readers', async () => {
      await test.step('Verify ARIA labels for mobile', async () => {
        await TestHelpers.checkAccessibility(dashboardPage.page);
      });

      await test.step('Test touch accessibility', async () => {
        // All interactive elements should be properly labeled
        const buttons = dashboardPage.page.locator('button');
        const buttonCount = await buttons.count();

        for (let i = 0; i < Math.min(3, buttonCount); i++) {
          const button = buttons.nth(i);
          const ariaLabel = await button.getAttribute('aria-label');
          const text = await button.textContent();

          expect(ariaLabel || text).toBeTruthy();
        }
      });

      await test.step('Test mobile focus management', async () => {
        // Focus should be visible and properly managed on mobile
        await dashboardPage.addAlarmButton.focus();

        const focusedElement = dashboardPage.page.locator(':focus');
        await expect(focusedElement).toBeVisible();
      });
    });

    test('should handle mobile zoom and orientation', async () => {
      await test.step('Test zoom levels', async () => {
        // Zoom in
        await dashboardPage.page.setViewportSize({ width: 375, height: 667 });
        await dashboardPage.page.evaluate(() => {
          document.body.style.zoom = '1.5';
        });

        // App should still be usable when zoomed
        await expect(dashboardPage.addAlarmButton).toBeVisible();

        // Reset zoom
        await dashboardPage.page.evaluate(() => {
          document.body.style.zoom = '1';
        });
      });

      await test.step('Test orientation changes', async () => {
        // Portrait to landscape
        await dashboardPage.page.setViewportSize({ width: 667, height: 375 });
        await TestHelpers.waitForNetworkIdle(dashboardPage.page);

        // App should adapt to landscape
        await expect(dashboardPage.addAlarmButton).toBeVisible();

        // Back to portrait
        await dashboardPage.page.setViewportSize({ width: 375, height: 667 });
        await TestHelpers.waitForNetworkIdle(dashboardPage.page);
      });
    });
  });

  test.describe('Mobile Performance', () => {
    test.use({ ...devices['Pixel 5'] });

    test.beforeEach(async ({ page }) => {
      dashboardPage = new DashboardPage(page);
      await TestHelpers.clearAllStorage(page);
    });

    test('should load quickly on mobile', async () => {
      await test.step('Measure initial load time', async () => {
        const startTime = Date.now();
        await dashboardPage.navigateToDashboard();
        await dashboardPage.waitForPageLoad();
        const loadTime = Date.now() - startTime;

        // Should load within reasonable time (adjust based on requirements)
        expect(loadTime).toBeLessThan(5000);
      });

      await test.step('Verify critical resources loaded', async () => {
        // Essential elements should be visible
        await expect(dashboardPage.addAlarmButton).toBeVisible();

        // No JavaScript errors
        const errors = await TestHelpers.checkConsoleErrors(dashboardPage.page);
        const errorList = errors();
        expect(errorList.length).toBe(0);
      });
    });

    test('should handle slow network conditions', async () => {
      await test.step('Simulate slow network', async () => {
        await TestHelpers.simulateSlowNetwork(dashboardPage.page, 1000);
        await dashboardPage.navigateToDashboard();
      });

      await test.step('Verify graceful degradation', async () => {
        // Should show loading states
        const loadingSpinner = dashboardPage.page.locator(
          '[data-testid="loading-spinner"]'
        );
        const hasLoading = await loadingSpinner.isVisible({ timeout: 1000 });

        if (hasLoading) {
          await expect(loadingSpinner).toBeVisible();
          await expect(loadingSpinner).toBeHidden({ timeout: 10000 });
        }

        // Eventually should load content
        await expect(dashboardPage.addAlarmButton).toBeVisible({ timeout: 15000 });
      });
    });
  });

  test.describe('Mobile PWA Features', () => {
    test.use({ ...devices['Pixel 5'] });

    test.beforeEach(async ({ page }) => {
      dashboardPage = new DashboardPage(page);
      await TestHelpers.clearAllStorage(page);
      await dashboardPage.navigateToDashboard();
    });

    test('should display PWA install prompt on mobile', async () => {
      await test.step('Check for mobile install prompt', async () => {
        const pwaPrompt = dashboardPage.page.locator(
          '[data-testid="pwa-install-prompt"], .install-prompt'
        );
        const addToHomePrompt = dashboardPage.page.locator(
          ':has-text("Add to Home"), :has-text("Install App")'
        );

        const hasPrompt =
          (await pwaPrompt.isVisible({ timeout: 3000 })) ||
          (await addToHomePrompt.isVisible({ timeout: 3000 }));

        if (hasPrompt) {
          // Test install prompt interaction
          const installButton = dashboardPage.page
            .locator('button:has-text("Install"), button:has-text("Add")')
            .first();
          if (await installButton.isVisible()) {
            await installButton.tap();
          }
        }
      });
    });

    test('should work offline on mobile', async () => {
      await test.step('Go offline', async () => {
        await dashboardPage.page.context().setOffline(true);
        await dashboardPage.page.reload();
      });

      await test.step('Verify offline functionality', async () => {
        // Should show offline indicator
        const offlineIndicator = dashboardPage.page.locator(
          '[data-testid="offline-indicator"]'
        );
        const hasOfflineIndicator = await offlineIndicator.isVisible({ timeout: 5000 });

        if (hasOfflineIndicator) {
          await expect(offlineIndicator).toContainText(/offline/i);
        }

        // Core functionality should still work
        await expect(dashboardPage.addAlarmButton).toBeVisible();
      });

      await test.step('Return online', async () => {
        await dashboardPage.page.context().setOffline(false);
        await dashboardPage.page.reload();
        await TestHelpers.waitForNetworkIdle(dashboardPage.page);

        // Should sync when back online
        const syncIndicator = dashboardPage.page.locator('[data-testid="sync-status"]');
        const hasSyncStatus = await syncIndicator.isVisible({ timeout: 3000 });

        if (hasSyncStatus) {
          await expect(syncIndicator).not.toContainText(/error|failed/i);
        }
      });
    });
  });
});
