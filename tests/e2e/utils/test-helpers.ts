import { Page, expect } from "@playwright/test";

export class TestHelpers {
  static async waitForNetworkIdle(page: Page, timeout: number = 5000) {
    await page.waitForLoadState("networkidle", { timeout });
  }

  static async clearLocalStorage(page: Page) {
    await page.evaluate(() => localStorage.clear());
  }

  static async clearSessionStorage(page: Page) {
    await page.evaluate(() => sessionStorage.clear());
  }

  static async clearAllStorage(page: Page) {
    await this.clearLocalStorage(page);
    await this.clearSessionStorage(page);
    await page.evaluate(() => {
      // Clear IndexedDB if available
      if ("indexedDB" in window) {
        indexedDB.databases?.().then((databases) => {
          databases.forEach((db) => {
            if (db.name) indexedDB.deleteDatabase(db.name);
          });
        });
      }
    });
  }

  static async setMockTime(page: Page, time: string) {
    const mockTime = new Date(`2024-01-01T${time}:00.000Z`).getTime();
    await page.addInitScript(`{
      Date.now = () => ${mockTime};
      Date.prototype.getTime = () => ${mockTime};
    }`);
  }

  static async mockNotificationPermission(
    page: Page,
    permission: "granted" | "denied" | "default",
  ) {
    await page.context().grantPermissions(["notifications"]);
    await page.addInitScript(`{
      Object.defineProperty(Notification, 'permission', { 
        get: () => '${permission}' 
      });
    }`);
  }

  static async mockGeolocation(
    page: Page,
    latitude: number = 40.7128,
    longitude: number = -74.006,
  ) {
    await page.context().setGeolocation({ latitude, longitude });
  }

  static async simulateNetworkFailure(page: Page) {
    await page.route("**/*", (route) => route.abort());
  }

  static async simulateSlowNetwork(page: Page, delay: number = 2000) {
    await page.route("**/*", (route) => {
      setTimeout(() => route.continue(), delay);
    });
  }

  static async takeFullPageScreenshot(page: Page, name: string) {
    await page.screenshot({
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }

  static async checkConsoleErrors(page: Page) {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Return a function to check errors later
    return () => {
      if (errors.length > 0) {
        console.warn("Console errors found:", errors);
      }
      return errors;
    };
  }

  static async interceptApiCalls(
    page: Page,
    apiEndpoint: string,
    mockResponse: any,
  ) {
    await page.route(`**/*${apiEndpoint}*`, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockResponse),
      });
    });
  }

  static generateTestData() {
    return {
      email: `test-${Date.now()}@example.com`,
      password: "TestPassword123!",
      alarmLabel: `Test Alarm ${Date.now()}`,
      futureTime: this.getFutureTime(),
    };
  }

  static getFutureTime(minutesFromNow: number = 5): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutesFromNow);
    return now.toTimeString().slice(0, 5); // Returns HH:MM format
  }

  static async waitForAnimationEnd(page: Page, selector: string) {
    await page.waitForFunction((sel) => {
      const element = document.querySelector(sel);
      if (!element) return true;
      const computedStyle = getComputedStyle(element);
      return (
        computedStyle.animationPlayState === "paused" ||
        computedStyle.animationPlayState === "finished" ||
        computedStyle.animationName === "none"
      );
    }, selector);
  }

  static async pressKeyMultipleTimes(page: Page, key: string, times: number) {
    for (let i = 0; i < times; i++) {
      await page.keyboard.press(key);
    }
  }

  static async scrollToBottom(page: Page) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  static async scrollToTop(page: Page) {
    await page.evaluate(() => window.scrollTo(0, 0));
  }

  static async waitForElement(
    page: Page,
    selector: string,
    timeout: number = 10000,
  ) {
    await page.waitForSelector(selector, { timeout, state: "visible" });
  }

  static async getElementBoundingBox(page: Page, selector: string) {
    return await page.locator(selector).boundingBox();
  }

  static async hoverAndClick(page: Page, selector: string) {
    const element = page.locator(selector);
    await element.hover();
    await element.click();
  }

  static async doubleClick(page: Page, selector: string) {
    await page.locator(selector).dblclick();
  }

  static async rightClick(page: Page, selector: string) {
    await page.locator(selector).click({ button: "right" });
  }

  static async selectText(page: Page, selector: string) {
    await page.locator(selector).selectText();
  }

  static async getComputedStyle(
    page: Page,
    selector: string,
    property: string,
  ) {
    return await page.evaluate(
      ({ selector, property }) => {
        const element = document.querySelector(selector);
        return element
          ? getComputedStyle(element).getPropertyValue(property)
          : null;
      },
      { selector, property },
    );
  }

  static async simulateTyping(
    page: Page,
    selector: string,
    text: string,
    delay: number = 100,
  ) {
    const element = page.locator(selector);
    await element.focus();
    await element.fill(""); // Clear existing text

    for (const char of text) {
      await page.keyboard.type(char, { delay });
    }
  }

  static async verifyElementVisibility(page: Page, selectors: string[]) {
    for (const selector of selectors) {
      await expect(page.locator(selector)).toBeVisible();
    }
  }

  static async verifyElementsNotVisible(page: Page, selectors: string[]) {
    for (const selector of selectors) {
      await expect(page.locator(selector)).toBeHidden();
    }
  }

  static async checkAccessibility(page: Page, selector?: string) {
    const elementToCheck = selector ? page.locator(selector) : page;

    // Check for alt text on images
    const images = page.locator("img");
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute("alt");
      const ariaLabel = await img.getAttribute("aria-label");
      expect(alt || ariaLabel).toBeTruthy();
    }

    // Check for form labels
    const inputs = page.locator("input, select, textarea");
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute("id");
      const ariaLabel = await input.getAttribute("aria-label");
      const ariaLabelledBy = await input.getAttribute("aria-labelledby");

      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = (await label.count()) > 0;
        expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  }
}
