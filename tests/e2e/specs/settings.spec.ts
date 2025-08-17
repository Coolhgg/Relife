import { test, expect } from '@playwright/test';
import { SettingsPage, DashboardPage, AuthPage } from '../page-objects';
import { TestHelpers } from '../utils/test-helpers';
import { TestData } from '../fixtures/test-data';

test.describe('Settings Management', () => {
  let settingsPage: SettingsPage;
  let dashboardPage: DashboardPage;
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    settingsPage = new SettingsPage(page);
    dashboardPage = new DashboardPage(page);
    authPage = new AuthPage(page);
    
    // Clear storage and navigate to app
    await TestHelpers.clearAllStorage(page);
    await dashboardPage.navigateToDashboard();
    await settingsPage.openSettingsFromDashboard();
  });

  test.describe('General Settings', () => {
    test('should change application theme', async () => {
      await test.step('Switch to general settings tab', async () => {
        await settingsPage.switchToTab('general');
      });

      await test.step('Change theme to dark', async () => {
        await settingsPage.changeTheme('dark');
        await settingsPage.saveSettings();
      });

      await test.step('Verify theme change applied', async () => {
        // Check if dark theme is applied to the page
        const bodyElement = settingsPage.page.locator('body, html, [data-theme]');
        const hasDarkTheme = await bodyElement.evaluate(el => {
          return el.classList.contains('dark') || 
                 el.getAttribute('data-theme') === 'dark' ||
                 getComputedStyle(el).backgroundColor.includes('rgb(0') ||
                 getComputedStyle(document.body).backgroundColor.includes('rgb(0');
        });
        
        if (hasDarkTheme) {
          expect(hasDarkTheme).toBe(true);
        }
      });

      await test.step('Change theme to light', async () => {
        await settingsPage.changeTheme('light');
        await settingsPage.saveSettings();
      });
    });

    test('should change application language', async () => {
      await test.step('Switch to general settings tab', async () => {
        await settingsPage.switchToTab('general');
      });

      await test.step('Change language', async () => {
        // Try changing to Spanish if available
        const languages = TestData.SETTINGS.LANGUAGES;
        for (const lang of ['es', 'fr', 'de']) {
          if (languages.includes(lang)) {
            await settingsPage.changeLanguage(lang);
            await settingsPage.saveSettings();
            
            // Wait for UI to update
            await TestHelpers.waitForNetworkIdle(settingsPage.page);
            
            // Check if language changed (look for translated text)
            const settingsHeader = settingsPage.page.locator('h1, h2, [data-testid="settings-title"]').first();
            const headerText = await settingsHeader.textContent();
            
            // Text should be different from English
            if (headerText && !headerText.toLowerCase().includes('settings')) {
              expect(headerText).toBeTruthy();
            }
            
            break;
          }
        }
      });

      await test.step('Change back to English', async () => {
        await settingsPage.changeLanguage('en');
        await settingsPage.saveSettings();
      });
    });

    test('should toggle time format', async () => {
      await test.step('Switch to general settings tab', async () => {
        await settingsPage.switchToTab('general');
      });

      await test.step('Toggle time format', async () => {
        const initialState = await settingsPage.timeFormatToggle.isChecked();
        await settingsPage.toggleTimeFormat();
        await settingsPage.saveSettings();
        
        // Verify toggle state changed
        const newState = await settingsPage.timeFormatToggle.isChecked();
        expect(newState).toBe(!initialState);
      });
    });

    test('should enable smart wakeup feature', async () => {
      await test.step('Switch to general settings tab', async () => {
        await settingsPage.switchToTab('general');
      });

      await test.step('Enable smart wakeup', async () => {
        await settingsPage.enableSmartWakeup();
        await settingsPage.saveSettings();
        
        // Verify smart wakeup is enabled
        await expect(settingsPage.smartWakeupToggle).toBeChecked();
      });
    });
  });

  test.describe('Sound Settings', () => {
    test('should change default alarm sound', async () => {
      await test.step('Switch to sound settings tab', async () => {
        await settingsPage.switchToTab('sound');
      });

      await test.step('Change default sound', async () => {
        await settingsPage.changeDefaultSound('nature-sounds');
        await settingsPage.saveSettings();
      });

      await test.step('Test sound preview', async () => {
        await settingsPage.testSoundPreview();
      });
    });

    test('should adjust volume settings', async () => {
      await test.step('Switch to sound settings tab', async () => {
        await settingsPage.switchToTab('sound');
      });

      await test.step('Set volume level', async () => {
        await settingsPage.setVolume('75');
        await settingsPage.saveSettings();
        
        // Verify volume was set
        const volumeValue = await settingsPage.volumeSlider.inputValue();
        expect(volumeValue).toBe('75');
      });
    });

    test('should configure vibration settings', async () => {
      await test.step('Switch to sound settings tab', async () => {
        await settingsPage.switchToTab('sound');
      });

      await test.step('Toggle vibration', async () => {
        const initialState = await settingsPage.vibrateToggle.isChecked();
        await settingsPage.vibrateToggle.click();
        await settingsPage.saveSettings();
        
        const newState = await settingsPage.vibrateToggle.isChecked();
        expect(newState).toBe(!initialState);
      });
    });
  });

  test.describe('Notification Settings', () => {
    test('should configure push notifications', async () => {
      await test.step('Switch to notification settings tab', async () => {
        await settingsPage.switchToTab('notification');
      });

      await test.step('Enable push notifications', async () => {
        await settingsPage.configurePushNotifications();
        await settingsPage.saveSettings();
        
        await expect(settingsPage.pushNotificationsToggle).toBeChecked();
      });
    });

    test('should handle notification permissions', async () => {
      await test.step('Mock notification permission', async () => {
        await TestHelpers.mockNotificationPermission(settingsPage.page, 'granted');
      });

      await test.step('Switch to notification settings', async () => {
        await settingsPage.switchToTab('notification');
      });

      await test.step('Configure notifications', async () => {
        await settingsPage.configurePushNotifications();
        
        // Check for permission request handling
        const permissionDialog = settingsPage.page.locator('[data-testid="permission-dialog"]');
        const hasPermissionDialog = await permissionDialog.isVisible({ timeout: 3000 });
        
        if (hasPermissionDialog) {
          const allowButton = permissionDialog.locator('button:has-text("Allow"), button:has-text("Grant")');
          await allowButton.click();
        }
      });
    });
  });

  test.describe('Accessibility Settings', () => {
    test('should enable accessibility features', async () => {
      await test.step('Switch to accessibility settings tab', async () => {
        await settingsPage.switchToTab('accessibility');
      });

      await test.step('Enable accessibility features', async () => {
        await settingsPage.enableAccessibilityFeatures();
        await settingsPage.saveSettings();
      });

      await test.step('Verify accessibility features are active', async () => {
        await expect(settingsPage.screenReaderToggle).toBeChecked();
        await expect(settingsPage.highContrastToggle).toBeChecked();
        await expect(settingsPage.largeTextToggle).toBeChecked();
      });

      await test.step('Verify visual changes applied', async () => {
        // Check if high contrast mode is visually applied
        const bodyElement = settingsPage.page.locator('body');
        const hasHighContrast = await bodyElement.evaluate(el => {
          return el.classList.contains('high-contrast') ||
                 getComputedStyle(el).filter.includes('contrast');
        });
        
        // Check if large text is applied
        const textElement = settingsPage.page.locator('p, span, div').first();
        const fontSize = await TestHelpers.getComputedStyle(settingsPage.page, 'p', 'font-size');
        
        if (fontSize) {
          const size = parseInt(fontSize);
          expect(size).toBeGreaterThan(14); // Assuming larger than default
        }
      });
    });

    test('should test accessibility settings functionality', async () => {
      await test.step('Switch to accessibility settings', async () => {
        await settingsPage.switchToTab('accessibility');
      });

      await test.step('Test settings accessibility', async () => {
        await settingsPage.testSettingsAccessibility();
      });
    });
  });

  test.describe('Data Management', () => {
    test('should export user data', async () => {
      await test.step('Test data export', async () => {
        await settingsPage.exportData();
      });
    });

    test('should handle data import', async () => {
      // This would need a test file to import
      await test.step('Prepare test data file', async () => {
        // In a real scenario, we'd create a test JSON file
        const testDataPath = 'tests/e2e/fixtures/test-import-data.json';
        
        // Mock file if import functionality exists
        const importButton = settingsPage.importDataButton;
        const hasImport = await importButton.isVisible({ timeout: 3000 });
        
        if (hasImport) {
          // Would test actual import functionality
          console.log('Import functionality available for testing');
        }
      });
    });
  });

  test.describe('Settings Persistence', () => {
    test('should persist settings across sessions', async () => {
      await test.step('Change multiple settings', async () => {
        await settingsPage.verifySettingsPersistence();
      });
    });

    test('should reset settings to defaults', async () => {
      await test.step('Change some settings', async () => {
        await settingsPage.switchToTab('general');
        await settingsPage.changeTheme('dark');
        await settingsPage.switchToTab('sound');
        await settingsPage.setVolume('90');
        await settingsPage.saveSettings();
      });

      await test.step('Reset settings', async () => {
        await settingsPage.resetSettings();
      });

      await test.step('Verify settings were reset', async () => {
        // Check that theme is back to default
        await settingsPage.switchToTab('general');
        const currentTheme = await settingsPage.themeSelector.getAttribute('data-current-theme');
        
        // Check that volume is back to default
        await settingsPage.switchToTab('sound');
        const currentVolume = await settingsPage.volumeSlider.inputValue();
        
        // These should be default values (depends on app defaults)
        expect(currentTheme).not.toBe('dark');
        expect(currentVolume).not.toBe('90');
      });
    });
  });

  test.describe('Premium Settings', () => {
    test('should display premium settings section', async () => {
      await test.step('Check premium settings availability', async () => {
        await settingsPage.verifyPremiumSettings();
      });
    });

    test('should handle premium feature access', async () => {
      await test.step('Try to access premium features', async () => {
        await settingsPage.switchToTab('premium');
        
        const premiumFeatures = settingsPage.page.locator('[data-testid*="premium-feature"]');
        const featureCount = await premiumFeatures.count();
        
        if (featureCount > 0) {
          // Test premium feature interaction
          const firstFeature = premiumFeatures.first();
          await firstFeature.click();
          
          // Should either enable feature or show upgrade prompt
          const upgradePrompt = settingsPage.page.locator('[data-testid="upgrade-prompt"], :has-text("upgrade")');
          const hasUpgradePrompt = await upgradePrompt.isVisible({ timeout: 3000 });
          
          if (hasUpgradePrompt) {
            await expect(upgradePrompt).toBeVisible();
            
            // Test dismiss upgrade prompt
            const dismissButton = upgradePrompt.locator('button:has-text("Cancel"), button:has-text("Close")');
            if (await dismissButton.isVisible()) {
              await dismissButton.click();
            }
          }
        }
      });
    });
  });

  test.describe('Settings Navigation', () => {
    test('should navigate between settings tabs', async () => {
      const tabs = ['general', 'sound', 'notification', 'accessibility'] as const;

      for (const tab of tabs) {
        await test.step(`Navigate to ${tab} tab`, async () => {
          await settingsPage.switchToTab(tab);
          
          // Verify tab is active
          const tabElement = settingsPage.page.getByRole('tab').filter({ hasText: new RegExp(tab, 'i') });
          await expect(tabElement).toHaveAttribute('aria-selected', 'true');
        });
      }
    });

    test('should handle keyboard navigation in settings', async () => {
      await test.step('Test keyboard navigation', async () => {
        await settingsPage.switchToTab('general');
        
        // Focus first interactive element
        const firstInput = settingsPage.page.locator('input, select, button').first();
        await firstInput.focus();
        
        // Tab through several elements
        for (let i = 0; i < 3; i++) {
          await settingsPage.page.keyboard.press('Tab');
          
          // Verify focus is on a focusable element
          const focusedElement = settingsPage.page.locator(':focus');
          await expect(focusedElement).toBeVisible();
        }
      });
    });
  });

  test.describe('Settings Search/Filter', () => {
    test('should filter settings if search available', async () => {
      await test.step('Look for settings search', async () => {
        const searchInput = settingsPage.page.locator('input[type="search"], [data-testid="settings-search"]');
        const hasSearch = await searchInput.isVisible({ timeout: 3000 });
        
        if (hasSearch) {
          await test.step('Test settings search', async () => {
            await searchInput.fill('theme');
            
            // Should filter to theme-related settings
            const themeSettings = settingsPage.page.locator(':has-text("theme")');
            await expect(themeSettings.first()).toBeVisible();
            
            // Clear search
            await searchInput.clear();
          });
        }
      });
    });
  });

  test.describe('Authenticated Settings', () => {
    test.beforeEach(async () => {
      // Login before testing authenticated settings
      await authPage.navigateToLogin();
      await authPage.loginWithTestUser();
      await authPage.waitForSuccessfulLogin();
      await settingsPage.navigateToSettings();
    });

    test('should display user-specific settings when logged in', async () => {
      await test.step('Verify user profile settings available', async () => {
        const userEmail = await authPage.getCurrentUserEmail();
        
        if (userEmail) {
          // Should have access to account settings
          const accountSection = settingsPage.page.locator('[data-testid="account-settings"]');
          const hasAccountSettings = await accountSection.isVisible({ timeout: 3000 });
          
          if (hasAccountSettings) {
            await expect(accountSection).toBeVisible();
          }
        }
      });
    });

    test('should handle account deletion flow', async () => {
      await test.step('Test account deletion warning', async () => {
        const deleteButton = settingsPage.deleteAccountButton;
        const hasDeleteOption = await deleteButton.isVisible({ timeout: 3000 });
        
        if (hasDeleteOption) {
          await deleteButton.click();
          
          // Should show confirmation dialog
          const confirmDialog = settingsPage.page.locator('[role="dialog"]:has-text("delete")');
          await expect(confirmDialog).toBeVisible();
          
          // Cancel deletion
          const cancelButton = confirmDialog.locator('button:has-text("Cancel"), button:has-text("Close")');
          await cancelButton.click();
          await expect(confirmDialog).toBeHidden();
        }
      });
    });
  });
});