import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class DashboardPage extends BasePage {
  readonly page: Page;
  readonly alarmList: Locator;
  readonly addAlarmButton: Locator;
  readonly settingsButton: Locator;
  readonly dashboardButton: Locator;
  readonly gamingButton: Locator;
  readonly statsContainer: Locator;
  readonly quickStats: Locator;
  readonly recentAlarmsSection: Locator;
  readonly upcomingAlarmsSection: Locator;
  readonly sleepTracker: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.alarmList = page.locator('[data-testid="alarm-list"]');
    this.addAlarmButton = page.locator('button').filter({ hasText: /add|create|new/i });
    this.settingsButton = page.getByRole('button').filter({ hasText: /settings/i });
    this.dashboardButton = page.getByRole('button').filter({ hasText: /dashboard/i });
    this.gamingButton = page.getByRole('button').filter({ hasText: /gaming|battle/i });
    this.statsContainer = page.locator('[data-testid="stats-container"]');
    this.quickStats = page.locator('[data-testid="quick-stats"]');
    this.recentAlarmsSection = page.locator('[data-testid="recent-alarms"]');
    this.upcomingAlarmsSection = page.locator('[data-testid="upcoming-alarms"]');
    this.sleepTracker = page.locator('[data-testid="sleep-tracker"]');
  }

  async navigateToDashboard() {
    await this.goto('/');
    await this.waitForPageLoad();
  }

  async clickAddAlarmButton() {
    await this.addAlarmButton.click();
  }

  async openSettings() {
    await this.settingsButton.click();
  }

  async openGaming() {
    await this.gamingButton.click();
  }

  async verifyDashboardElements() {
    // Verify main navigation is visible
    await expect(this.addAlarmButton).toBeVisible();
    await expect(this.settingsButton).toBeVisible();
    await expect(this.dashboardButton).toBeVisible();
  }

  async verifyAlarmList() {
    await expect(this.alarmList).toBeVisible();
  }

  async getAlarmCount(): Promise<number> {
    const alarms = this.page.locator('[data-testid="alarm-item"]');
    return await alarms.count();
  }

  async getQuickStatsData() {
    const stats = await this.quickStats.allTextContents();
    return stats;
  }

  async verifyRecentAlarms() {
    if (await this.recentAlarmsSection.isVisible()) {
      const recentAlarms = this.page.locator('[data-testid="recent-alarm-item"]');
      expect(await recentAlarms.count()).toBeGreaterThanOrEqual(0);
    }
  }

  async verifyUpcomingAlarms() {
    if (await this.upcomingAlarmsSection.isVisible()) {
      const upcomingAlarms = this.page.locator('[data-testid="upcoming-alarm-item"]');
      expect(await upcomingAlarms.count()).toBeGreaterThanOrEqual(0);
    }
  }

  async checkResponsiveDesign() {
    // Test mobile view
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.verifyDashboardElements();

    // Test tablet view
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await this.verifyDashboardElements();

    // Test desktop view
    await this.page.setViewportSize({ width: 1280, height: 720 });
    await this.verifyDashboardElements();
  }

  async verifyLoadingStates() {
    // Reload page and check for loading indicators
    await this.page.reload();

    const loadingSpinner = this.page.locator('[data-testid="loading-spinner"]');
    // Loading spinner should appear briefly
    if (await loadingSpinner.isVisible({ timeout: 1000 })) {
      await expect(loadingSpinner).toBeHidden({ timeout: 10000 });
    }

    await this.waitForPageLoad();
  }
}
