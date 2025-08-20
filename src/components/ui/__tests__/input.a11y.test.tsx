/**
 * Input Component - Accessibility Tests
 *
 * Tests WCAG 2.1 AA compliance for the Input component
 * including form labels, error states, and keyboard navigation.
 */

import React from "react";
import { vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import {
  axeRender,
  axeRulesets,
  accessibilityPatterns,
} from "../../../../tests/utils/a11y-testing-utils";
import { Input } from "../input";

describe("Input - Accessibility Tests", () => {
  describe("Basic Accessibility Compliance", () => {
    it("should have no axe violations with basic input", async () => {
      await axeRender(
        <div>
          <label htmlFor="test-input">Test Input</label>
          <Input id="test-input" />
        </div>,
        { axeOptions: axeRulesets.forms },
      );
    });

    it("should have no axe violations with different input types", async () => {
      const inputTypes = [
        "text",
        "email",
        "password",
        "number",
        "tel",
        "url",
        "search",
      ];

      for (const type of inputTypes) {
        await axeRender(
          <div>
            <label htmlFor={`${type}-input`}>{type} Input</label>
            <Input id={`${type}-input`} type={type as any} />
          </div>,
          { axeOptions: axeRulesets.forms },
        );
      }
    });

    it("should have no axe violations when disabled", async () => {
      await axeRender(
        <div>
          <label htmlFor="disabled-input">Disabled Input</label>
          <Input id="disabled-input" disabled />
        </div>,
        { axeOptions: axeRulesets.forms },
      );
    });

    it("should have no axe violations with readonly state", async () => {
      await axeRender(
        <div>
          <label htmlFor="readonly-input">Readonly Input</label>
          <Input id="readonly-input" readOnly defaultValue="Read only value" />
        </div>,
        { axeOptions: axeRulesets.forms },
      );
    });
  });

  describe("Form Labels and Associations", () => {
    it("should be properly associated with label via htmlFor", async () => {
      await axeRender(
        <div>
          <label htmlFor="labeled-input">Email Address</label>
          <Input id="labeled-input" type="email" />
        </div>,
      );

      const input = screen.getByLabelText("Email Address");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "email");
    });

    it("should support aria-label when no visible label", async () => {
      await axeRender(<Input aria-label="Search products" type="search" />, {
        axeOptions: axeRulesets.forms,
      });

      const input = screen.getByLabelText("Search products");
      expect(input).toBeInTheDocument();
    });

    it("should support aria-labelledby for complex labels", async () => {
      await axeRender(
        <div>
          <h3 id="password-heading">Create Password</h3>
          <p id="password-help">Must be at least 8 characters</p>
          <Input
            type="password"
            aria-labelledby="password-heading password-help"
          />
        </div>,
        { axeOptions: axeRulesets.forms },
      );

      // Password inputs don't expose textbox role for security, find by query selector
      const input = document.querySelector('input[type="password"]')!;
      expect(input).toHaveAttribute(
        "aria-labelledby",
        "password-heading password-help",
      );
    });

    it("should fail axe test without accessible name", async () => {
      await expect(async () => {
        await axeRender(<Input />, { axeOptions: axeRulesets.forms });
      }).rejects.toThrow();
    });
  });

  describe("Focus Management", () => {
    it("should be focusable by default", async () => {
      await axeRender(
        <div>
          <label htmlFor="focus-test">Focus Test</label>
          <Input id="focus-test" />
        </div>,
      );

      const input = screen.getByRole("textbox");
      await accessibilityPatterns.testFocusable(input);
    });

    it("should not be focusable when disabled", async () => {
      await axeRender(
        <div>
          <label htmlFor="disabled-focus">Disabled Focus</label>
          <Input id="disabled-focus" disabled />
        </div>,
      );

      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();

      input.focus();
      expect(document.activeElement).not.toBe(input);
    });

    it("should have proper focus indicators", async () => {
      await axeRender(
        <div>
          <label htmlFor="focus-indicator">Focus Indicator Test</label>
          <Input id="focus-indicator" />
        </div>,
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("focus-visible:ring-[3px]");
      expect(input).toHaveClass("focus-visible:ring-ring/50");
    });

    it("should maintain focus order in forms", async () => {
      const { container } = await axeRender(
        <form>
          <label htmlFor="first">First</label>
          <Input id="first" data-testid="first" />
          <label htmlFor="second">Second</label>
          <Input id="second" data-testid="second" />
          <label htmlFor="third">Third</label>
          <Input id="third" data-testid="third" />
        </form>,
      );

      await accessibilityPatterns.testKeyboardNavigation(container, [
        '[data-testid="first"]',
        '[data-testid="second"]',
        '[data-testid="third"]',
      ]);
    });
  });

  describe("Error States and Validation", () => {
    it("should handle aria-invalid state", async () => {
      await axeRender(
        <div>
          <label htmlFor="invalid-input">Required Field</label>
          <Input id="invalid-input" aria-invalid={true} />
        </div>,
        { axeOptions: axeRulesets.forms },
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveClass("aria-invalid:ring-destructive/20");
    });

    it("should associate with error messages via aria-describedby", async () => {
      await axeRender(
        <div>
          <label htmlFor="error-input">Email</label>
          <Input
            id="error-input"
            type="email"
            aria-invalid={true}
            aria-describedby="email-error"
          />
          <div id="email-error" role="alert">
            Please enter a valid email address
          </div>
        </div>,
        { axeOptions: axeRulesets.forms },
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-describedby", "email-error");

      const errorMessage = screen.getByRole("alert");
      expect(errorMessage).toHaveTextContent(
        "Please enter a valid email address",
      );
    });

    it("should support multiple describedby references", async () => {
      await axeRender(
        <div>
          <label htmlFor="help-input">Password</label>
          <Input
            id="help-input"
            type="password"
            aria-describedby="help-text error-text"
          />
          <div id="help-text">Must contain 8+ characters</div>
          <div id="error-text" role="alert">
            Password is required
          </div>
        </div>,
        { axeOptions: axeRulesets.forms },
      );

      const input = screen.getByLabelText("Password");
      expect(input).toHaveAttribute("aria-describedby", "help-text error-text");
    });
  });

  describe("Required Fields", () => {
    it("should handle required attribute", async () => {
      await axeRender(
        <div>
          <label htmlFor="required-input">
            Required Field <span aria-label="required">*</span>
          </label>
          <Input id="required-input" required />
        </div>,
        { axeOptions: axeRulesets.forms },
      );

      const input = screen.getByRole("textbox");
      expect(input).toBeRequired();
    });

    it("should use aria-required for custom validation", async () => {
      await axeRender(
        <div>
          <label htmlFor="aria-required-input">Custom Required Field</label>
          <Input id="aria-required-input" aria-required={true} />
        </div>,
        { axeOptions: axeRulesets.forms },
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-required", "true");
    });
  });

  describe("Placeholder and Help Text", () => {
    it("should have accessible placeholder text", async () => {
      await axeRender(
        <div>
          <label htmlFor="placeholder-input">Search</label>
          <Input id="placeholder-input" placeholder="Enter search terms..." />
        </div>,
      );

      const input = screen.getByPlaceholderText("Enter search terms...");
      expect(input).toBeInTheDocument();
    });

    it("should not rely only on placeholder for labeling", async () => {
      // This should pass because we have a proper label
      await axeRender(
        <div>
          <label htmlFor="good-placeholder">Email Address</label>
          <Input
            id="good-placeholder"
            type="email"
            placeholder="user@example.com"
          />
        </div>,
        { axeOptions: axeRulesets.forms },
      );
    });

    it("should support help text via aria-describedby", async () => {
      await axeRender(
        <div>
          <label htmlFor="help-input">Username</label>
          <Input id="help-input" aria-describedby="username-help" />
          <div id="username-help">Username must be 3-20 characters long</div>
        </div>,
        { axeOptions: axeRulesets.forms },
      );

      const input = screen.getByLabelText("Username");
      expect(input).toHaveAttribute("aria-describedby", "username-help");
    });
  });

  describe("Keyboard Navigation", () => {
    it("should accept text input via keyboard", async () => {
      await axeRender(
        <div>
          <label htmlFor="text-input">Text Input</label>
          <Input id="text-input" />
        </div>,
      );

      const input = screen.getByRole("textbox");
      const user = userEvent.setup();

      await user.type(input, "Hello world");
      expect(input).toHaveValue("Hello world");
    });

    it("should support keyboard navigation in number inputs", async () => {
      await axeRender(
        <div>
          <label htmlFor="number-input">Age</label>
          <Input id="number-input" type="number" min="0" max="120" />
        </div>,
      );

      const input = screen.getByRole("spinbutton");
      const user = userEvent.setup();

      await user.type(input, "25");
      expect(input).toHaveValue(25); // Number inputs return numeric values

      // Test arrow key navigation - clear and type new value
      await user.clear(input);
      await user.type(input, "26");
      expect(input).toHaveValue(26); // Number inputs return numeric values
    });

    it("should handle Enter key in forms", async () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());
      await axeRender(
        <form onSubmit={handleSubmit}>
          <label htmlFor="submit-input">Name</label>
          <Input id="submit-input" />
          <button type="submit">Submit</button>
        </form>,
      );

      const input = screen.getByRole("textbox");
      const user = userEvent.setup();

      await user.type(input, "John Doe");
      await user.keyboard("{Enter}");

      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe("RTL (Right-to-Left) Support", () => {
    it("should render correctly in RTL context", async () => {
      // Use axeRender with RTL options to avoid router conflicts
      await axeRender(
        <div>
          <label htmlFor="rtl-input">RTL Input</label>
          <Input id="rtl-input" dir="rtl" />
        </div>,
        { testProviderOptions: { language: { dir: "rtl" } } },
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("dir", "rtl");
    });

    it("should handle explicit dir prop", async () => {
      await axeRender(
        <div>
          <label htmlFor="explicit-rtl">RTL Text</label>
          <Input id="explicit-rtl" dir="rtl" />
        </div>,
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("dir", "rtl");
    });

    it('should handle mixed content with dir="auto"', async () => {
      await axeRender(
        <div>
          <label htmlFor="auto-dir">Auto Direction</label>
          <Input id="auto-dir" dir="auto" />
        </div>,
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("dir");
    });
  });

  describe("Input Types Accessibility", () => {
    it("should handle password input accessibility", async () => {
      await axeRender(
        <div>
          <label htmlFor="password">Password</label>
          <Input id="password" type="password" />
        </div>,
        { axeOptions: axeRulesets.forms },
      );

      // Password inputs don't expose their role as textbox for security
      const input = screen.getByLabelText("Password");
      expect(input).toHaveAttribute("type", "password");
    });

    it("should handle email input with proper semantics", async () => {
      await axeRender(
        <div>
          <label htmlFor="email">Email</label>
          <Input id="email" type="email" />
        </div>,
        { axeOptions: axeRulesets.forms },
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "email");
    });

    it("should handle tel input accessibility", async () => {
      await axeRender(
        <div>
          <label htmlFor="phone">Phone Number</label>
          <Input id="phone" type="tel" />
        </div>,
        { axeOptions: axeRulesets.forms },
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "tel");
    });

    it("should handle search input with proper role", async () => {
      await axeRender(
        <div>
          <label htmlFor="search">Search</label>
          <Input id="search" type="search" />
        </div>,
        { axeOptions: axeRulesets.forms },
      );

      const input = screen.getByRole("searchbox");
      expect(input).toHaveAttribute("type", "search");
    });
  });

  describe("File Input Accessibility", () => {
    it("should handle file input accessibility", async () => {
      await axeRender(
        <div>
          <label htmlFor="file-input">Upload File</label>
          <Input id="file-input" type="file" accept=".jpg,.png" />
        </div>,
        { axeOptions: axeRulesets.forms },
      );

      const input = screen.getByLabelText("Upload File");
      expect(input).toHaveAttribute("type", "file");
      expect(input).toHaveAttribute("accept", ".jpg,.png");
    });

    it("should handle multiple file selection", async () => {
      await axeRender(
        <div>
          <label htmlFor="multi-file">Select Multiple Files</label>
          <Input id="multi-file" type="file" multiple />
        </div>,
        { axeOptions: axeRulesets.forms },
      );

      const input = screen.getByLabelText("Select Multiple Files");
      expect(input).toHaveAttribute("multiple");
    });
  });

  describe("Color Contrast", () => {
    it("should maintain sufficient contrast for text", async () => {
      await axeRender(
        <div>
          <label htmlFor="contrast-test">Contrast Test</label>
          <Input id="contrast-test" defaultValue="Test content" />
        </div>,
        { axeOptions: { rules: { "color-contrast": { enabled: true } } } },
      );

      // Axe will automatically check color contrast
      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
    });

    it("should maintain contrast for placeholder text", async () => {
      await axeRender(
        <div>
          <label htmlFor="placeholder-contrast">Placeholder Test</label>
          <Input
            id="placeholder-contrast"
            placeholder="Placeholder text should have sufficient contrast"
          />
        </div>,
        { axeOptions: { rules: { "color-contrast": { enabled: true } } } },
      );

      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
    });
  });
});
