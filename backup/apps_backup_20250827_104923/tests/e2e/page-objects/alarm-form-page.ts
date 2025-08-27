import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class AlarmFormPage extends BasePage {
  readonly page: Page;
  readonly timeInput: Locator;
  readonly labelInput: Locator;
  readonly soundSelector: Locator;
  readonly volumeSlider: Locator;
  readonly vibrateToggle: Locator;
  readonly repeatToggle: Locator;
  readonly repeatDaysContainer: Locator;
  readonly snoozeSettings: Locator;
  readonly voiceMoodSelector: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly deleteButton: Locator;
  readonly advancedOptionsToggle: Locator;
  readonly smartWakeupToggle: Locator;
  readonly weatherIntegrationToggle: Locator;

  // Day selection checkboxes
  readonly mondayCheckbox: Locator;
  readonly tuesdayCheckbox: Locator;
  readonly wednesdayCheckbox: Locator;
  readonly thursdayCheckbox: Locator;
  readonly fridayCheckbox: Locator;
  readonly saturdayCheckbox: Locator;
  readonly sundayCheckbox: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.timeInput = page.locator('input[type="time"]');
    this.labelInput = page.locator('input[placeholder*="label"], input[name*="label"]');
    this.soundSelector = page.locator('[data-testid="sound-selector"]');
    this.volumeSlider = page.locator('input[type="range"], [role="slider"]');
    this.vibrateToggle = page.locator('[data-testid="vibrate-toggle"]');
    this.repeatToggle = page.locator('[data-testid="repeat-toggle"]');
    this.repeatDaysContainer = page.locator('[data-testid="repeat-days"]');
    this.snoozeSettings = page.locator('[data-testid="snooze-settings"]');
    this.voiceMoodSelector = page.locator('[data-testid="voice-mood-selector"]');
    this.saveButton = page.getByRole('button').filter({ hasText: /save|create/i });
    this.cancelButton = page.getByRole('button').filter({ hasText: /cancel|close/i });
    this.deleteButton = page.getByRole('button').filter({ hasText: /delete|remove/i });
    this.advancedOptionsToggle = page.locator(
      '[data-testid="advanced-options-toggle"]'
    );
    this.smartWakeupToggle = page.locator('[data-testid="smart-wakeup-toggle"]');
    this.weatherIntegrationToggle = page.locator(
      '[data-testid="weather-integration-toggle"]'
    );

    // Day checkboxes
    this.mondayCheckbox = page.locator('[data-testid="day-monday"]');
    this.tuesdayCheckbox = page.locator('[data-testid="day-tuesday"]');
    this.wednesdayCheckbox = page.locator('[data-testid="day-wednesday"]');
    this.thursdayCheckbox = page.locator('[data-testid="day-thursday"]');
    this.fridayCheckbox = page.locator('[data-testid="day-friday"]');
    this.saturdayCheckbox = page.locator('[data-testid="day-saturday"]');
    this.sundayCheckbox = page.locator('[data-testid="day-sunday"]');
  }

  async openAlarmForm() {
    const addButton = this.page
      .getByRole('button')
      .filter({ hasText: /add|create|new/i })
      .first();
    await addButton.click();
    await this.waitForElement(this.timeInput);
  }

  async setTime(time: string) {
    await this.timeInput.fill(time);
  }

  async setLabel(label: string) {
    await this.labelInput.fill(label);
  }

  async selectSound(soundName: string) {
    await this.soundSelector.click();
    const soundOption = this.page.locator(`[data-testid="sound-option-${soundName}"]`);
    await soundOption.click();
  }

  async setVolume(volume: string) {
    await this.volumeSlider.fill(volume);
  }

  async toggleVibrate() {
    await this.vibrateToggle.click();
  }

  async enableRepeat() {
    if (!(await this.repeatToggle.isChecked())) {
      await this.repeatToggle.click();
    }
  }

  async selectDays(days: string[]) {
    await this.enableRepeat();

    for (const day of days) {
      const dayCheckbox = this.page.locator(`[data-testid="day-${day.toLowerCase()}"]`);
      if (!(await dayCheckbox.isChecked())) {
        await dayCheckbox.click();
      }
    }
  }

  async selectVoiceMood(mood: string) {
    await this.voiceMoodSelector.click();
    const moodOption = this.page.locator(`[data-testid="voice-mood-${mood}"]`);
    await moodOption.click();
  }

  async openAdvancedOptions() {
    if (await this.advancedOptionsToggle.isVisible()) {
      await this.advancedOptionsToggle.click();
    }
  }

  async enableSmartWakeup() {
    await this.openAdvancedOptions();
    if (!(await this.smartWakeupToggle.isChecked())) {
      await this.smartWakeupToggle.click();
    }
  }

  async saveAlarm() {
    await this.saveButton.click();
    await this.waitForToast();
  }

  async cancelAlarm() {
    await this.cancelButton.click();
  }

  async deleteAlarm() {
    await this.deleteButton.click();
    // Handle confirmation dialog
    await this.acceptDialog();
    await this.waitForToast();
  }

  async createBasicAlarm(time: string, label: string) {
    await this.setTime(time);
    await this.setLabel(label);
    await this.saveAlarm();
  }

  async createRecurringAlarm(time: string, label: string, days: string[]) {
    await this.setTime(time);
    await this.setLabel(label);
    await this.selectDays(days);
    await this.saveAlarm();
  }

  async createAdvancedAlarm(options: {
    time: string;
    label: string;
    sound?: string;
    volume?: string;
    vibrate?: boolean;
    days?: string[];
    voiceMood?: string;
    smartWakeup?: boolean;
  }) {
    await this.setTime(options.time);
    await this.setLabel(options.label);

    if (options.sound) {
      await this.selectSound(options.sound);
    }

    if (options.volume) {
      await this.setVolume(options.volume);
    }

    if (options.vibrate) {
      await this.toggleVibrate();
    }

    if (options.days && options.days.length > 0) {
      await this.selectDays(options.days);
    }

    if (options.voiceMood) {
      await this.selectVoiceMood(options.voiceMood);
    }

    if (options.smartWakeup) {
      await this.enableSmartWakeup();
    }

    await this.saveAlarm();
  }

  async verifyFormValidation() {
    // Try to save without required fields
    await this.saveButton.click();

    // Check for validation messages
    const validationMessages = this.page.locator(
      '[role="alert"], .error-message, [data-testid*="error"]'
    );
    const count = await validationMessages.count();
    expect(count).toBeGreaterThan(0);
  }

  async verifyFormAccessibility() {
    // Check form labels
    await expect(this.timeInput).toHaveAttribute('aria-label');
    await expect(this.labelInput).toHaveAttribute('aria-label');

    // Check form can be navigated with keyboard
    await this.timeInput.focus();
    await this.page.keyboard.press('Tab');
    await expect(this.labelInput).toBeFocused();
  }
}
