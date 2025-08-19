import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base-page";

export class AuthPage extends BasePage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly loginButton: Locator;
  readonly signupButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly googleSignInButton: Locator;
  readonly switchToSignupLink: Locator;
  readonly switchToLoginLink: Locator;
  readonly logoutButton: Locator;
  readonly userProfileButton: Locator;
  readonly authContainer: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.page = page;
    this.emailInput = page.locator('input[type="email"], input[name="email"]');
    this.passwordInput = page.locator(
      'input[type="password"], input[name="password"]',
    );
    this.confirmPasswordInput = page.locator(
      'input[name="confirmPassword"], input[name="confirm-password"]',
    );
    this.loginButton = page
      .getByRole("button")
      .filter({ hasText: /log in|sign in/i });
    this.signupButton = page
      .getByRole("button")
      .filter({ hasText: /sign up|register|create account/i });
    this.forgotPasswordLink = page.getByText(/forgot password|reset password/i);
    this.googleSignInButton = page
      .getByRole("button")
      .filter({ hasText: /google/i });
    this.switchToSignupLink = page.getByText(/sign up|create account/i);
    this.switchToLoginLink = page.getByText(/log in|sign in/i);
    this.logoutButton = page
      .getByRole("button")
      .filter({ hasText: /logout|sign out/i });
    this.userProfileButton = page.locator(
      '[data-testid="user-profile-button"]',
    );
    this.authContainer = page.locator('[data-testid="auth-container"]');
    this.errorMessage = page.locator(
      '[role="alert"], .error-message, [data-testid*="error"]',
    );
    this.successMessage = page.locator(
      '.success-message, [data-testid*="success"]',
    );
  }

  async navigateToLogin() {
    await this.goto("/login");
    await this.waitForElement(this.authContainer);
  }

  async navigateToSignup() {
    await this.goto("/signup");
    await this.waitForElement(this.authContainer);
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async signup(email: string, password: string, confirmPassword?: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);

    if (this.confirmPasswordInput && confirmPassword) {
      await this.confirmPasswordInput.fill(confirmPassword);
    }

    await this.signupButton.click();
  }

  async loginWithTestUser() {
    await this.login("test@example.com", "testpassword123");
    await this.waitForSuccessfulLogin();
  }

  async signupWithNewUser(
    email: string = "newuser@example.com",
    password: string = "newpassword123",
  ) {
    await this.signup(email, password, password);
    await this.waitForSuccessfulSignup();
  }

  async switchToSignup() {
    await this.switchToSignupLink.click();
    await this.waitForElement(this.signupButton);
  }

  async switchToLogin() {
    await this.switchToLoginLink.click();
    await this.waitForElement(this.loginButton);
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async loginWithGoogle() {
    // Handle Google OAuth flow (for testing, might need special setup)
    await this.googleSignInButton.click();
  }

  async logout() {
    await this.logoutButton.click();
    await this.waitForLogout();
  }

  async waitForSuccessfulLogin() {
    // Wait for redirect to dashboard or success indicator
    await this.page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 10000,
    });

    // Or check for user profile button indicating successful login
    await this.waitForElement(this.userProfileButton, 10000);
  }

  async waitForSuccessfulSignup() {
    // Check for success message or redirect
    const hasSuccessMessage = await this.successMessage.isVisible({
      timeout: 5000,
    });
    if (!hasSuccessMessage) {
      await this.waitForSuccessfulLogin();
    }
  }

  async waitForLogout() {
    // Wait for redirect to login page or auth container to appear
    await this.page.waitForURL(
      (url) => url.pathname.includes("/login") || url.pathname === "/",
      { timeout: 10000 },
    );
  }

  async verifyLoginFormValidation() {
    // Try to login with empty fields
    await this.loginButton.click();
    await expect(this.errorMessage).toBeVisible();

    // Try with invalid email
    await this.emailInput.fill("invalid-email");
    await this.passwordInput.fill("password");
    await this.loginButton.click();
    await expect(this.errorMessage).toBeVisible();

    // Clear fields
    await this.emailInput.clear();
    await this.passwordInput.clear();
  }

  async verifySignupFormValidation() {
    // Try to signup with empty fields
    await this.signupButton.click();
    await expect(this.errorMessage).toBeVisible();

    // Try with mismatched passwords
    if (this.confirmPasswordInput) {
      await this.emailInput.fill("test@example.com");
      await this.passwordInput.fill("password123");
      await this.confirmPasswordInput.fill("password456");
      await this.signupButton.click();
      await expect(this.errorMessage).toBeVisible();
    }

    // Clear fields
    await this.emailInput.clear();
    await this.passwordInput.clear();
    if (this.confirmPasswordInput) {
      await this.confirmPasswordInput.clear();
    }
  }

  async verifyPasswordStrength() {
    if (this.confirmPasswordInput) {
      // Test weak password
      await this.passwordInput.fill("123");

      const strengthIndicator = this.page.locator(
        '[data-testid="password-strength"]',
      );
      if (await strengthIndicator.isVisible()) {
        await expect(strengthIndicator).toContainText(/weak/i);
      }

      // Test strong password
      await this.passwordInput.fill("StrongPassword123!");
      if (await strengthIndicator.isVisible()) {
        await expect(strengthIndicator).toContainText(/strong/i);
      }
    }
  }

  async verifyAuthFormAccessibility() {
    // Check form labels and ARIA attributes
    await expect(this.emailInput).toHaveAttribute("aria-label");
    await expect(this.passwordInput).toHaveAttribute("aria-label");

    // Test keyboard navigation
    await this.emailInput.focus();
    await this.page.keyboard.press("Tab");
    await expect(this.passwordInput).toBeFocused();
  }

  async checkRememberMeOption() {
    const rememberMeCheckbox = this.page
      .locator('input[type="checkbox"]')
      .filter({ hasText: /remember me/i });
    if (await rememberMeCheckbox.isVisible()) {
      await rememberMeCheckbox.check();
      expect(await rememberMeCheckbox.isChecked()).toBe(true);
    }
  }

  async isLoggedIn(): Promise<boolean> {
    return await this.userProfileButton.isVisible({ timeout: 3000 });
  }

  async getCurrentUserEmail(): Promise<string | null> {
    if (await this.isLoggedIn()) {
      await this.userProfileButton.click();
      const emailElement = this.page.locator('[data-testid="user-email"]');
      return await emailElement.textContent();
    }
    return null;
  }
}
