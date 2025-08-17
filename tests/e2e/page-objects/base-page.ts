import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string = '') {
    await this.page.goto(path);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }

  async waitForElement(locator: Locator, timeout: number = 5000) {
    await locator.waitFor({ timeout });
  }

  async clickElement(locator: Locator) {
    await locator.click();
  }

  async fillInput(locator: Locator, value: string) {
    await locator.fill(value);
  }

  async getElementText(locator: Locator): Promise<string> {
    return await locator.textContent() || '';
  }

  async isElementVisible(locator: Locator): Promise<boolean> {
    return await locator.isVisible();
  }

  async waitForToast(message?: string) {
    const toast = this.page.locator('[data-sonner-toast]');
    await toast.waitFor();
    if (message) {
      await expect(toast).toContainText(message);
    }
  }

  async acceptDialog() {
    this.page.on('dialog', async dialog => {
      await dialog.accept();
    });
  }

  async dismissDialog() {
    this.page.on('dialog', async dialog => {
      await dialog.dismiss();
    });
  }

  async scrollToElement(locator: Locator) {
    await locator.scrollIntoViewIfNeeded();
  }

  async checkAccessibility() {
    // Basic accessibility checks
    const title = await this.page.title();
    expect(title).toBeTruthy();
    
    // Check for basic landmark elements
    const main = this.page.locator('main, [role="main"]');
    await expect(main).toBeVisible();
  }
}