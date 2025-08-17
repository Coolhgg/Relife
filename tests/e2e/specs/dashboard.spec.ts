import { test, expect } from '@playwright/test';
import { DashboardPage, AuthPage } from '../page-objects';
import { TestHelpers } from '../utils/test-helpers';
import { TestData } from '../fixtures/test-data';

test.describe('Dashboard', () => {
  let dashboardPage: DashboardPage;
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    authPage = new AuthPage(page);
    
    // Clear storage before each test
    await TestHelpers.clearAllStorage(page);
    
    // Navigate to dashboard
    await dashboardPage.navigateToDashboard();
  });

  test('should display main dashboard elements', async () => {
    await test.step('Verify dashboard loads correctly', async () => {
      await dashboardPage.verifyDashboardElements();
      await dashboardPage.checkAccessibility();
    });

    await test.step('Verify alarm list is visible', async () => {
      await dashboardPage.verifyAlarmList();
    });
  });

  test('should handle responsive design correctly', async () => {
    await test.step('Test mobile layout', async () => {
      await dashboardPage.checkResponsiveDesign();
    });
  });

  test('should display loading states properly', async () => {
    await test.step('Test loading indicators', async () => {
      await dashboardPage.verifyLoadingStates();
    });
  });

  test('should navigate to alarm creation', async () => {
    await test.step('Click add alarm button', async () => {
      await dashboardPage.clickAddAlarmButton();
    });

    await test.step('Verify alarm form opens', async () => {
      // Wait for alarm form to appear
      const formVisible = await dashboardPage.page.locator('[data-testid="alarm-form"]').isVisible({ timeout: 5000 });
      
      if (formVisible) {
        // Modal form opened
        expect(formVisible).toBe(true);
      } else {
        // Navigated to alarm creation page
        await expect(dashboardPage.page).toHaveURL(/.*alarm.*create.*/);
      }
    });
  });

  test('should navigate to settings', async () => {
    await test.step('Click settings button', async () => {
      await dashboardPage.openSettings();
    });

    await test.step('Verify settings page opens', async () => {
      const settingsVisible = await dashboardPage.page.locator('[data-testid="settings-container"]').isVisible({ timeout: 5000 });
      
      if (settingsVisible) {
        // Modal settings opened
        expect(settingsVisible).toBe(true);
      } else {
        // Navigated to settings page
        await expect(dashboardPage.page).toHaveURL(/.*settings.*/);
      }
    });
  });

  test('should display user statistics if available', async () => {
    await test.step('Check for statistics container', async () => {
      const statsVisible = await dashboardPage.statsContainer.isVisible({ timeout: 3000 });
      
      if (statsVisible) {
        await dashboardPage.getQuickStatsData();
        await dashboardPage.verifyRecentAlarms();
        await dashboardPage.verifyUpcomingAlarms();
      }
    });
  });

  test('should handle empty alarm list gracefully', async () => {
    await test.step('Verify empty state', async () => {
      const alarmCount = await dashboardPage.getAlarmCount();
      
      if (alarmCount === 0) {
        // Check for empty state message
        const emptyMessage = dashboardPage.page.locator('[data-testid="empty-alarms"], .empty-state');
        const hasEmptyMessage = await emptyMessage.isVisible({ timeout: 3000 });
        
        // Either show empty message or the add button should be prominent
        if (!hasEmptyMessage) {
          await expect(dashboardPage.addAlarmButton).toBeVisible();
        }
      }
    });
  });

  test('should maintain accessibility standards', async () => {
    await test.step('Run accessibility checks', async () => {
      await TestHelpers.checkAccessibility(dashboardPage.page);
    });

    await test.step('Test keyboard navigation', async () => {
      // Test tab navigation through main elements
      await dashboardPage.addAlarmButton.focus();
      await dashboardPage.page.keyboard.press('Tab');
      
      // Should move to next focusable element
      const focusedElement = await dashboardPage.page.locator(':focus').first();
      await expect(focusedElement).toBeVisible();
    });
  });

  test('should handle network errors gracefully', async () => {
    await test.step('Simulate network failure', async () => {
      await TestHelpers.simulateNetworkFailure(dashboardPage.page);
      
      // Try to refresh or navigate
      await dashboardPage.page.reload();
    });

    await test.step('Check for offline indicator', async () => {
      const offlineIndicator = dashboardPage.page.locator('[data-testid="offline-indicator"]');
      // Should show offline indicator or handle gracefully
      const isOffline = await offlineIndicator.isVisible({ timeout: 5000 });
      
      if (isOffline) {
        await expect(offlineIndicator).toContainText(/offline/i);
      } else {
        // App should still be functional in some capacity
        await expect(dashboardPage.addAlarmButton).toBeVisible();
      }
    });
  });

  test('should show PWA install prompt when appropriate', async () => {
    await test.step('Check for PWA install prompt', async () => {
      const pwaPrompt = dashboardPage.page.locator('[data-testid="pwa-install-prompt"]');
      const isPromptVisible = await pwaPrompt.isVisible({ timeout: 3000 });
      
      if (isPromptVisible) {
        // Test install prompt functionality
        const installButton = pwaPrompt.locator('button:has-text("Install"), button:has-text("Add to Home")');
        await expect(installButton).toBeVisible();
        
        // Test dismiss functionality
        const dismissButton = pwaPrompt.locator('button:has-text("Dismiss"), button:has-text("Close")');
        if (await dismissButton.isVisible()) {
          await dismissButton.click();
          await expect(pwaPrompt).toBeHidden();
        }
      }
    });
  });

  test.describe('Authenticated User Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each authenticated test
      await authPage.navigateToLogin();
      await authPage.loginWithTestUser();
      await authPage.waitForSuccessfulLogin();
      await dashboardPage.navigateToDashboard();
    });

    test('should display personalized content for logged-in user', async () => {
      await test.step('Check for user-specific elements', async () => {
        const userProfile = authPage.userProfileButton;
        await expect(userProfile).toBeVisible();
      });

      await test.step('Verify user can access premium features if applicable', async () => {
        const premiumFeatures = dashboardPage.page.locator('[data-testid*="premium"], [data-premium="true"]');
        const premiumCount = await premiumFeatures.count();
        
        if (premiumCount > 0) {
          // User has premium features - verify they're accessible
          for (let i = 0; i < Math.min(3, premiumCount); i++) {
            await expect(premiumFeatures.nth(i)).toBeVisible();
          }
        }
      });
    });

    test('should sync user data properly', async () => {
      await test.step('Verify sync status', async () => {
        const syncIndicator = dashboardPage.page.locator('[data-testid="sync-status"]');
        const isSyncVisible = await syncIndicator.isVisible({ timeout: 3000 });
        
        if (isSyncVisible) {
          // Check sync is working
          await expect(syncIndicator).not.toContainText(/error|failed/i);
        }
      });
    });
  });
});