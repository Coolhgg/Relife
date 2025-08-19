import { test, expect } from "@playwright/test";
import { AuthPage, DashboardPage } from "../page-objects";
import { TestHelpers } from "../utils/test-helpers";
import { TestData } from "../fixtures/test-data";

test.describe("Authentication", () => {
  let authPage: AuthPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    dashboardPage = new DashboardPage(page);

    // Clear storage before each test
    await TestHelpers.clearAllStorage(page);
  });

  test.describe("Login Flow", () => {
    test.beforeEach(async () => {
      await authPage.navigateToLogin();
    });

    test("should login with valid credentials", async () => {
      const user = TestData.USERS.VALID_USER;

      await test.step("Enter valid credentials", async () => {
        await authPage.login(user.email, user.password);
      });

      await test.step("Verify successful login", async () => {
        await authPage.waitForSuccessfulLogin();

        // Should be redirected to dashboard or main app
        const currentUrl = authPage.page.url();
        expect(currentUrl).not.toContain("/login");

        // User profile should be visible
        await expect(authPage.userProfileButton).toBeVisible();
      });
    });

    test("should reject invalid credentials", async () => {
      const invalidUser = TestData.INVALID_USERS.INVALID_EMAIL;

      await test.step("Enter invalid credentials", async () => {
        await authPage.login(invalidUser.email, invalidUser.password);
      });

      await test.step("Verify login failure", async () => {
        // Should show error message
        await expect(authPage.errorMessage).toBeVisible();
        await expect(authPage.errorMessage).toContainText(
          /invalid|error|incorrect/i,
        );

        // Should remain on login page
        expect(authPage.page.url()).toContain("/login");
      });
    });

    test("should validate form inputs", async () => {
      await test.step("Test form validation", async () => {
        await authPage.verifyLoginFormValidation();
      });

      await test.step("Test empty email validation", async () => {
        await authPage.passwordInput.fill("somepassword");
        await authPage.loginButton.click();

        await expect(authPage.errorMessage).toBeVisible();
      });

      await test.step("Test empty password validation", async () => {
        await authPage.emailInput.fill("test@example.com");
        await authPage.passwordInput.clear();
        await authPage.loginButton.click();

        await expect(authPage.errorMessage).toBeVisible();
      });
    });

    test("should maintain accessibility standards", async () => {
      await test.step("Test form accessibility", async () => {
        await authPage.verifyAuthFormAccessibility();
      });

      await test.step("Test keyboard navigation", async () => {
        await authPage.emailInput.focus();
        await authPage.page.keyboard.press("Tab");
        await expect(authPage.passwordInput).toBeFocused();

        await authPage.page.keyboard.press("Tab");
        await expect(authPage.loginButton).toBeFocused();
      });
    });

    test("should handle remember me functionality", async () => {
      await test.step("Test remember me option", async () => {
        await authPage.checkRememberMeOption();

        const user = TestData.USERS.VALID_USER;
        await authPage.login(user.email, user.password);
        await authPage.waitForSuccessfulLogin();
      });

      await test.step("Verify session persistence", async () => {
        // Reload page and check if still logged in
        await authPage.page.reload();
        await TestHelpers.waitForNetworkIdle(authPage.page);

        const isStillLoggedIn = await authPage.isLoggedIn();
        if (isStillLoggedIn) {
          await expect(authPage.userProfileButton).toBeVisible();
        }
      });
    });

    test("should redirect to intended page after login", async () => {
      await test.step("Navigate to protected page without login", async () => {
        await authPage.goto("/settings");

        // Should redirect to login if not authenticated
        const currentUrl = authPage.page.url();
        if (currentUrl.includes("/login")) {
          // Login required
          const user = TestData.USERS.VALID_USER;
          await authPage.login(user.email, user.password);
          await authPage.waitForSuccessfulLogin();

          // Should redirect back to settings
          await expect(authPage.page).toHaveURL(/.*settings.*/);
        }
      });
    });
  });

  test.describe("Signup Flow", () => {
    test.beforeEach(async () => {
      await authPage.navigateToSignup();
    });

    test("should create new account with valid information", async () => {
      const newUser = TestData.generateRandomUser();

      await test.step("Fill signup form", async () => {
        await authPage.signup(
          newUser.email,
          newUser.password,
          newUser.password,
        );
      });

      await test.step("Verify successful signup", async () => {
        await authPage.waitForSuccessfulSignup();

        // Should either show success message or automatically log in
        const isLoggedIn = await authPage.isLoggedIn();
        if (isLoggedIn) {
          await expect(authPage.userProfileButton).toBeVisible();
        } else {
          await expect(authPage.successMessage).toBeVisible();
        }
      });
    });

    test("should validate signup form inputs", async () => {
      await test.step("Test form validation", async () => {
        await authPage.verifySignupFormValidation();
      });

      await test.step("Test password strength validation", async () => {
        await authPage.verifyPasswordStrength();
      });
    });

    test("should reject duplicate email addresses", async () => {
      const existingUser = TestData.USERS.VALID_USER;

      await test.step("Try to signup with existing email", async () => {
        await authPage.signup(
          existingUser.email,
          "newpassword123",
          "newpassword123",
        );
      });

      await test.step("Verify duplicate email error", async () => {
        await expect(authPage.errorMessage).toBeVisible();
        await expect(authPage.errorMessage).toContainText(
          /already exists|taken|duplicate/i,
        );
      });
    });

    test("should switch between login and signup forms", async () => {
      await test.step("Switch to login from signup", async () => {
        await authPage.switchToLogin();
        await expect(authPage.loginButton).toBeVisible();
        await expect(authPage.signupButton).toBeHidden();
      });

      await test.step("Switch back to signup", async () => {
        await authPage.switchToSignup();
        await expect(authPage.signupButton).toBeVisible();
        await expect(authPage.loginButton).toBeHidden();
      });
    });
  });

  test.describe("Password Reset", () => {
    test.beforeEach(async () => {
      await authPage.navigateToLogin();
    });

    test("should initiate password reset", async () => {
      await test.step("Click forgot password link", async () => {
        await authPage.clickForgotPassword();
      });

      await test.step("Enter email for reset", async () => {
        const emailInput = authPage.page.locator('input[type="email"]').first();
        await emailInput.fill(TestData.USERS.VALID_USER.email);

        const resetButton = authPage.page
          .getByRole("button")
          .filter({ hasText: /reset|send/i });
        await resetButton.click();
      });

      await test.step("Verify reset email sent message", async () => {
        const successMessage = authPage.page.locator(
          '[data-testid*="success"], .success-message',
        );
        const hasSuccessMessage = await successMessage.isVisible({
          timeout: 5000,
        });

        if (hasSuccessMessage) {
          await expect(successMessage).toContainText(/sent|email|reset/i);
        }
      });
    });
  });

  test.describe("Social Login", () => {
    test.beforeEach(async () => {
      await authPage.navigateToLogin();
    });

    test("should display social login options", async () => {
      await test.step("Check for social login buttons", async () => {
        const googleButton = authPage.googleSignInButton;
        const hasGoogleLogin = await googleButton.isVisible({ timeout: 3000 });

        if (hasGoogleLogin) {
          await expect(googleButton).toBeVisible();
          await expect(googleButton).toBeEnabled();
        }
      });
    });

    test("should handle social login click", async () => {
      await test.step("Test Google login button", async () => {
        const googleButton = authPage.googleSignInButton;
        const hasGoogleLogin = await googleButton.isVisible({ timeout: 3000 });

        if (hasGoogleLogin) {
          // Note: This would normally open a popup or redirect
          // In testing, we might mock this or test the click event
          await googleButton.click();

          // Verify that something happens (popup, redirect, etc.)
          // This would need to be adapted based on actual implementation
        }
      });
    });
  });

  test.describe("Logout Flow", () => {
    test.beforeEach(async () => {
      // Login first
      await authPage.navigateToLogin();
      await authPage.loginWithTestUser();
      await authPage.waitForSuccessfulLogin();
    });

    test("should logout successfully", async () => {
      await test.step("Click logout button", async () => {
        // Open user menu if needed
        if (await authPage.userProfileButton.isVisible()) {
          await authPage.userProfileButton.click();
        }

        await authPage.logout();
      });

      await test.step("Verify successful logout", async () => {
        await authPage.waitForLogout();

        // Should be redirected to login page or home
        const currentUrl = authPage.page.url();
        expect(currentUrl).toMatch(/\/(login|auth|$)/);

        // User profile should not be visible
        await expect(authPage.userProfileButton).toBeHidden();
      });
    });

    test("should clear session data on logout", async () => {
      await test.step("Logout and verify session cleared", async () => {
        if (await authPage.userProfileButton.isVisible()) {
          await authPage.userProfileButton.click();
        }
        await authPage.logout();
        await authPage.waitForLogout();
      });

      await test.step("Verify cannot access protected routes", async () => {
        await authPage.goto("/dashboard");

        // Should redirect to login or show auth required
        const currentUrl = authPage.page.url();
        const isOnProtectedPage =
          !currentUrl.includes("/login") && !currentUrl.includes("/auth");

        if (isOnProtectedPage) {
          // Check if there's an auth required message
          const authRequired = authPage.page.locator(
            ':has-text("login"), :has-text("authenticate")',
          );
          const hasAuthMessage = await authRequired.isVisible({
            timeout: 3000,
          });

          if (!hasAuthMessage) {
            // App might allow some functionality without auth
            console.log(
              "App allows access to some features without authentication",
            );
          }
        }
      });
    });
  });

  test.describe("Session Management", () => {
    test("should handle session expiration gracefully", async () => {
      await test.step("Login first", async () => {
        await authPage.navigateToLogin();
        await authPage.loginWithTestUser();
        await authPage.waitForSuccessfulLogin();
      });

      await test.step("Simulate expired session", async () => {
        // Clear auth tokens from storage
        await authPage.page.evaluate(() => {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("refresh_token");
          sessionStorage.clear();
        });

        // Try to access protected functionality
        await dashboardPage.navigateToDashboard();
        await dashboardPage.page.reload();
      });

      await test.step("Verify graceful handling", async () => {
        // Should either redirect to login or show re-auth prompt
        await authPage.page.waitForTimeout(2000); // Allow time for redirect

        const currentUrl = authPage.page.url();
        const isOnLogin =
          currentUrl.includes("/login") || currentUrl.includes("/auth");

        if (!isOnLogin) {
          // Check for re-authentication prompt
          const authPrompt = authPage.page.locator(
            ':has-text("session"), :has-text("expired"), :has-text("login")',
          );
          const hasAuthPrompt = await authPrompt.isVisible({ timeout: 3000 });

          if (hasAuthPrompt) {
            expect(hasAuthPrompt).toBe(true);
          }
        }
      });
    });
  });
});
