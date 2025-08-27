import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class SettingsPage extends BasePage {
  readonly page: Page;
  readonly settingsContainer: Locator;
  readonly generalSettingsTab: Locator;
  readonly soundSettingsTab: Locator;
  readonly notificationSettingsTab: Locator;
  readonly accessibilitySettingsTab: Locator;
  readonly premiumSettingsTab: Locator;

  // General Settings
  readonly languageSelector: Locator;
  readonly themeSelector: Locator;
  readonly timeFormatToggle: Locator;
  readonly smartWakeupToggle: Locator;
  readonly weatherIntegrationToggle: Locator;

  // Sound Settings
  readonly defaultSoundSelector: Locator;
  readonly volumeSlider: Locator;
  readonly vibrateToggle: Locator;
  readonly gradualVolumeToggle: Locator;
  readonly voiceMoodSelector: Locator;

  // Notification Settings
  readonly pushNotificationsToggle: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly reminderSettingsToggle: Locator;
  readonly motivationalMessagesToggle: Locator;

  // Accessibility Settings
  readonly screenReaderToggle: Locator;
  readonly highContrastToggle: Locator;
  readonly largeTextToggle: Locator;
  readonly reducedMotionToggle: Locator;
  readonly voiceGuidanceToggle: Locator;

  // Buttons
  readonly saveButton: Locator;
  readonly resetButton: Locator;
  readonly exportDataButton: Locator;
  readonly importDataButton: Locator;
  readonly deleteAccountButton: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.settingsContainer = page.locator('[data-testid="settings-container"]');

    // Tabs
    this.generalSettingsTab = page.getByRole('tab').filter({ hasText: /general/i });
    this.soundSettingsTab = page.getByRole('tab').filter({ hasText: /sound/i });
    this.notificationSettingsTab = page
      .getByRole('tab')
      .filter({ hasText: /notification/i });
    this.accessibilitySettingsTab = page
      .getByRole('tab')
      .filter({ hasText: /accessibility/i });
    this.premiumSettingsTab = page.getByRole('tab').filter({ hasText: /premium/i });

    // General Settings
    this.languageSelector = page.locator('[data-testid="language-selector"]');
    this.themeSelector = page.locator('[data-testid="theme-selector"]');
    this.timeFormatToggle = page.locator('[data-testid="time-format-toggle"]');
    this.smartWakeupToggle = page.locator('[data-testid="smart-wakeup-toggle"]');
    this.weatherIntegrationToggle = page.locator(
      '[data-testid="weather-integration-toggle"]'
    );

    // Sound Settings
    this.defaultSoundSelector = page.locator('[data-testid="default-sound-selector"]');
    this.volumeSlider = page.locator('[data-testid="volume-slider"]');
    this.vibrateToggle = page.locator('[data-testid="vibrate-toggle"]');
    this.gradualVolumeToggle = page.locator('[data-testid="gradual-volume-toggle"]');
    this.voiceMoodSelector = page.locator('[data-testid="voice-mood-selector"]');

    // Notification Settings
    this.pushNotificationsToggle = page.locator(
      '[data-testid="push-notifications-toggle"]'
    );
    this.emailNotificationsToggle = page.locator(
      '[data-testid="email-notifications-toggle"]'
    );
    this.reminderSettingsToggle = page.locator(
      '[data-testid="reminder-settings-toggle"]'
    );
    this.motivationalMessagesToggle = page.locator(
      '[data-testid="motivational-messages-toggle"]'
    );

    // Accessibility Settings
    this.screenReaderToggle = page.locator('[data-testid="screen-reader-toggle"]');
    this.highContrastToggle = page.locator('[data-testid="high-contrast-toggle"]');
    this.largeTextToggle = page.locator('[data-testid="large-text-toggle"]');
    this.reducedMotionToggle = page.locator('[data-testid="reduced-motion-toggle"]');
    this.voiceGuidanceToggle = page.locator('[data-testid="voice-guidance-toggle"]');

    // Buttons
    this.saveButton = page.getByRole('button').filter({ hasText: /save/i });
    this.resetButton = page.getByRole('button').filter({ hasText: /reset/i });
    this.exportDataButton = page.getByRole('button').filter({ hasText: /export/i });
    this.importDataButton = page.getByRole('button').filter({ hasText: /import/i });
    this.deleteAccountButton = page
      .getByRole('button')
      .filter({ hasText: /delete account/i });
  }

  async navigateToSettings() {
    await this.goto('/settings');
    await this.waitForElement(this.settingsContainer);
  }

  async openSettingsFromDashboard() {
    const settingsButton = this.page
      .getByRole('button')
      .filter({ hasText: /settings/i });
    await settingsButton.click();
    await this.waitForElement(this.settingsContainer);
  }

  async switchToTab(
    tabName: 'general' | 'sound' | 'notification' | 'accessibility' | 'premium'
  ) {
    const tabs = {
      general: this.generalSettingsTab,
      sound: this.soundSettingsTab,
      notification: this.notificationSettingsTab,
      accessibility: this.accessibilitySettingsTab,
      premium: this.premiumSettingsTab,
    };

    await tabs[tabName].click();
  }

  async changeLanguage(language: string) {
    await this.switchToTab('general');
    await this.languageSelector.click();
    const languageOption = this.page.locator(
      `[data-testid="language-option-${language}"]`
    );
    await languageOption.click();
  }

  async changeTheme(theme: string) {
    await this.switchToTab('general');
    await this.themeSelector.click();
    const themeOption = this.page.locator(`[data-testid="theme-option-${theme}"]`);
    await themeOption.click();
  }

  async toggleTimeFormat() {
    await this.switchToTab('general');
    await this.timeFormatToggle.click();
  }

  async enableSmartWakeup() {
    await this.switchToTab('general');
    if (!(await this.smartWakeupToggle.isChecked())) {
      await this.smartWakeupToggle.click();
    }
  }

  async changeDefaultSound(sound: string) {
    await this.switchToTab('sound');
    await this.defaultSoundSelector.click();
    const soundOption = this.page.locator(`[data-testid="sound-option-${sound}"]`);
    await soundOption.click();
  }

  async setVolume(volume: string) {
    await this.switchToTab('sound');
    await this.volumeSlider.fill(volume);
  }

  async testSoundPreview() {
    await this.switchToTab('sound');
    const previewButton = this.page.locator('[data-testid="sound-preview-button"]');
    if (await previewButton.isVisible()) {
      await previewButton.click();
      // Wait for sound to play (visual indicator or button state change)
      await this.page.waitForTimeout(2000);
    }
  }

  async configurePushNotifications() {
    await this.switchToTab('notification');
    if (!(await this.pushNotificationsToggle.isChecked())) {
      await this.pushNotificationsToggle.click();
    }
  }

  async enableAccessibilityFeatures() {
    await this.switchToTab('accessibility');

    // Enable various accessibility features
    if (!(await this.screenReaderToggle.isChecked())) {
      await this.screenReaderToggle.click();
    }

    if (!(await this.highContrastToggle.isChecked())) {
      await this.highContrastToggle.click();
    }

    if (!(await this.largeTextToggle.isChecked())) {
      await this.largeTextToggle.click();
    }
  }

  async saveSettings() {
    await this.saveButton.click();
    await this.waitForToast('Settings saved');
  }

  async resetSettings() {
    await this.resetButton.click();
    await this.acceptDialog();
    await this.waitForToast('Settings reset');
  }

  async exportData() {
    await this.exportDataButton.click();

    // Handle file download
    const downloadPromise = this.page.waitForEvent('download');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('relife-data');
  }

  async importData(filePath: string) {
    await this.importDataButton.click();

    // Handle file upload
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);

    await this.waitForToast('Data imported successfully');
  }

  async verifySettingsPersistence() {
    // Change some settings
    await this.changeTheme('dark');
    await this.setVolume('80');
    await this.saveSettings();

    // Reload page
    await this.page.reload();
    await this.waitForPageLoad();

    // Verify settings were saved
    await this.switchToTab('general');
    const currentTheme = await this.themeSelector.getAttribute('data-current-theme');
    expect(currentTheme).toBe('dark');

    await this.switchToTab('sound');
    const currentVolume = await this.volumeSlider.inputValue();
    expect(currentVolume).toBe('80');
  }

  async testSettingsAccessibility() {
    await this.switchToTab('accessibility');

    // Verify all accessibility controls are properly labeled
    await expect(this.screenReaderToggle).toHaveAttribute('aria-label');
    await expect(this.highContrastToggle).toHaveAttribute('aria-label');

    // Test keyboard navigation between settings
    await this.screenReaderToggle.focus();
    await this.page.keyboard.press('Tab');
    await expect(this.highContrastToggle).toBeFocused();
  }

  async verifyPremiumSettings() {
    await this.switchToTab('premium');

    const premiumContainer = this.page.locator(
      '[data-testid="premium-settings-container"]'
    );
    await expect(premiumContainer).toBeVisible();

    // Check for premium feature toggles or upgrade prompts
    const premiumFeatures = this.page.locator('[data-testid*="premium-feature"]');
    expect(await premiumFeatures.count()).toBeGreaterThan(0);
  }

  async deleteAccount() {
    await this.switchToTab('general');
    await this.deleteAccountButton.click();

    // Handle confirmation dialog
    const confirmationInput = this.page.locator(
      'input[placeholder*="DELETE"], input[placeholder*="delete"]'
    );
    if (await confirmationInput.isVisible()) {
      await confirmationInput.fill('DELETE');
    }

    const confirmButton = this.page
      .getByRole('button')
      .filter({ hasText: /confirm|delete/i });
    await confirmButton.click();
  }
}
