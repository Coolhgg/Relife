/**
 * PaymentFlow Component Tests
 *
 * Tests the payment processing flow including form validation, payment method selection,
 * subscription creation, and error handling.
 */

import React from "react";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../__tests__/utils/render-helpers";
import {
  createTestSubscriptionPlan,
  createTestPaymentMethod,
} from "../../../__tests__/factories/premium-factories";
import { PaymentFlow } from "../PaymentFlow";
import type {
  PaymentMethod,
  CreateSubscriptionRequest,
} from "../../../types/premium";

// Mock Stripe
const mockStripe = {
  createToken: jest.fn(),
  createPaymentMethod: jest.fn(),
  confirmCardSetup: jest.fn(),
  confirmCardPayment: jest.fn(),
};

jest.mock("../../../lib/stripe", () => ({
  getStripe: () => Promise.resolve(mockStripe),
}));

describe("PaymentFlow", () => {
  const mockOnPaymentSuccess = jest.fn();
  const mockOnPaymentError = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnCreateSubscription = jest.fn();

  const testPlan = createTestSubscriptionPlan({
    tier: "premium",
    displayName: "Premium Plan",
    pricing: {
      monthly: { amount: 999, currency: "usd" },
      yearly: { amount: 9999, currency: "usd" },
    },
  });

  const testPaymentMethods: PaymentMethod[] = [
    createTestPaymentMethod({
      id: "pm_test_123",
      card: {
        brand: "visa",
        last4: "4242",
        expMonth: 12,
        expYear: 2025,
      },
    }),
    createTestPaymentMethod({
      id: "pm_test_456",
      card: {
        brand: "mastercard",
        last4: "5555",
        expMonth: 6,
        expYear: 2026,
      },
    }),
  ];

  const defaultProps = {
    selectedPlan: testPlan,
    billingInterval: "month" as const,
    onPaymentSuccess: mockOnPaymentSuccess,
    onPaymentError: mockOnPaymentError,
    onCancel: mockOnCancel,
    onCreateSubscription: mockOnCreateSubscription,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnCreateSubscription.mockResolvedValue({
      clientSecret: "pi_test_secret",
      subscriptionId: "sub_test_123",
    });
    mockStripe.createPaymentMethod.mockResolvedValue({
      paymentMethod: { id: "pm_new_123" },
    });
    mockStripe.confirmCardPayment.mockResolvedValue({
      paymentIntent: { status: "succeeded" },
    });
  });

  describe("Initial Rendering", () => {
    it("renders payment flow header and plan summary", () => {
      renderWithProviders(<PaymentFlow {...defaultProps} />);

      expect(
        screen.getByText("Complete Your Subscription"),
      ).toBeInTheDocument();
      expect(screen.getByText("Premium Plan")).toBeInTheDocument();
      expect(screen.getByText("$9.99/month")).toBeInTheDocument();
    });

    it("shows trial information when available", () => {
      renderWithProviders(<PaymentFlow {...defaultProps} trialDays={14} />);

      expect(screen.getByText("14-day free trial")).toBeInTheDocument();
      expect(
        screen.getByText("You won't be charged until"),
      ).toBeInTheDocument();
    });

    it("displays discount when discount code is applied", () => {
      renderWithProviders(
        <PaymentFlow {...defaultProps} discountCode="SAVE20" />,
      );

      expect(screen.getByText("Discount (SAVE20)")).toBeInTheDocument();
    });

    it("shows security badges", () => {
      renderWithProviders(<PaymentFlow {...defaultProps} />);

      expect(screen.getByTestId("security-badges")).toBeInTheDocument();
      expect(screen.getByText(/256-bit SSL encryption/i)).toBeInTheDocument();
    });
  });

  describe("Payment Method Selection", () => {
    it("shows existing payment methods when available", () => {
      renderWithProviders(
        <PaymentFlow
          {...defaultProps}
          existingPaymentMethods={testPaymentMethods}
        />,
      );

      expect(screen.getByText("Select Payment Method")).toBeInTheDocument();
      expect(screen.getByText("•••• 4242")).toBeInTheDocument();
      expect(screen.getByText("•••• 5555")).toBeInTheDocument();
    });

    it("allows selection of existing payment method", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <PaymentFlow
          {...defaultProps}
          existingPaymentMethods={testPaymentMethods}
        />,
      );

      const visaCard = screen.getByText("•••• 4242").closest("button");
      await user.click(visaCard!);

      expect(visaCard).toHaveClass("ring-2", "ring-purple-500");
    });

    it("shows new payment method form by default when no existing methods", () => {
      renderWithProviders(<PaymentFlow {...defaultProps} />);

      expect(screen.getByLabelText(/card number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/expiry date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cvc/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cardholder name/i)).toBeInTheDocument();
    });

    it("allows switching between existing and new payment methods", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <PaymentFlow
          {...defaultProps}
          existingPaymentMethods={testPaymentMethods}
        />,
      );

      // Initially should show existing methods
      expect(screen.getByText("•••• 4242")).toBeInTheDocument();

      // Click "Add new payment method"
      await user.click(screen.getByText(/add new payment method/i));

      // Should now show new card form
      expect(screen.getByLabelText(/card number/i)).toBeInTheDocument();
    });
  });

  describe("Payment Form Validation", () => {
    beforeEach(() => {
      renderWithProviders(<PaymentFlow {...defaultProps} />);
    });

    it("validates required fields", async () => {
      const user = userEvent.setup();

      const submitButton = screen.getByRole("button", {
        name: /complete subscription/i,
      });
      await user.click(submitButton);

      expect(screen.getByText("Card number is required")).toBeInTheDocument();
      expect(
        screen.getByText("Cardholder name is required"),
      ).toBeInTheDocument();
    });

    it("validates card number format", async () => {
      const user = userEvent.setup();

      const cardInput = screen.getByLabelText(/card number/i);
      await user.type(cardInput, "1234");

      const submitButton = screen.getByRole("button", {
        name: /complete subscription/i,
      });
      await user.click(submitButton);

      expect(screen.getByText("Invalid card number")).toBeInTheDocument();
    });

    it("validates expiry date format", async () => {
      const user = userEvent.setup();

      const expiryInput = screen.getByLabelText(/expiry date/i);
      await user.type(expiryInput, "13/25"); // Invalid month

      const submitButton = screen.getByRole("button", {
        name: /complete subscription/i,
      });
      await user.click(submitButton);

      expect(screen.getByText("Invalid expiry date")).toBeInTheDocument();
    });

    it("validates CVC format", async () => {
      const user = userEvent.setup();

      const cvcInput = screen.getByLabelText(/cvc/i);
      await user.type(cvcInput, "12"); // Too short

      const submitButton = screen.getByRole("button", {
        name: /complete subscription/i,
      });
      await user.click(submitButton);

      expect(screen.getByText("Invalid CVC")).toBeInTheDocument();
    });

    it("validates email format", async () => {
      const user = userEvent.setup();

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "invalid-email");

      const submitButton = screen.getByRole("button", {
        name: /complete subscription/i,
      });
      await user.click(submitButton);

      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
    });
  });

  describe("Billing Address", () => {
    it("shows billing address form", () => {
      renderWithProviders(<PaymentFlow {...defaultProps} />);

      expect(screen.getByLabelText(/address line 1/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/postal code/i)).toBeInTheDocument();
    });

    it("validates required billing fields", async () => {
      const user = userEvent.setup();

      renderWithProviders(<PaymentFlow {...defaultProps} />);

      const submitButton = screen.getByRole("button", {
        name: /complete subscription/i,
      });
      await user.click(submitButton);

      expect(screen.getByText("Address is required")).toBeInTheDocument();
      expect(screen.getByText("City is required")).toBeInTheDocument();
    });

    it("auto-fills country based on locale", () => {
      renderWithProviders(<PaymentFlow {...defaultProps} />);

      const countrySelect = screen.getByLabelText(/country/i);
      expect(countrySelect).toHaveValue("US");
    });
  });

  describe("Payment Processing", () => {
    const fillValidForm = async (user: any) => {
      await user.type(
        screen.getByLabelText(/card number/i),
        "4242424242424242",
      );
      await user.type(screen.getByLabelText(/expiry date/i), "12/25");
      await user.type(screen.getByLabelText(/cvc/i), "123");
      await user.type(screen.getByLabelText(/cardholder name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/address line 1/i), "123 Main St");
      await user.type(screen.getByLabelText(/city/i), "New York");
      await user.type(screen.getByLabelText(/postal code/i), "10001");
    };

    it("processes successful payment", async () => {
      const user = userEvent.setup();

      renderWithProviders(<PaymentFlow {...defaultProps} />);

      await fillValidForm(user);

      const submitButton = screen.getByRole("button", {
        name: /complete subscription/i,
      });
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(mockOnPaymentSuccess).toHaveBeenCalledWith("sub_test_123");
      });
    });

    it("handles payment failure", async () => {
      const user = userEvent.setup();

      mockStripe.confirmCardPayment.mockResolvedValue({
        error: { message: "Your card was declined." },
      });

      renderWithProviders(<PaymentFlow {...defaultProps} />);

      await fillValidForm(user);

      const submitButton = screen.getByRole("button", {
        name: /complete subscription/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnPaymentError).toHaveBeenCalledWith(
          "Your card was declined.",
        );
      });
    });

    it("handles subscription creation failure", async () => {
      const user = userEvent.setup();

      mockOnCreateSubscription.mockRejectedValue(
        new Error("Subscription creation failed"),
      );

      renderWithProviders(<PaymentFlow {...defaultProps} />);

      await fillValidForm(user);

      const submitButton = screen.getByRole("button", {
        name: /complete subscription/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnPaymentError).toHaveBeenCalledWith(
          "Subscription creation failed",
        );
      });
    });

    it("sends correct subscription request", async () => {
      const user = userEvent.setup();

      renderWithProviders(<PaymentFlow {...defaultProps} />);

      await fillValidForm(user);

      const submitButton = screen.getByRole("button", {
        name: /complete subscription/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnCreateSubscription).toHaveBeenCalledWith(
          expect.objectContaining({
            planId: testPlan.id,
            billingInterval: "month",
            paymentMethodId: "pm_new_123",
          }),
        );
      });
    });
  });

  describe("Save Payment Method Option", () => {
    it("shows save payment method checkbox", () => {
      renderWithProviders(<PaymentFlow {...defaultProps} />);

      expect(screen.getByLabelText(/save payment method/i)).toBeInTheDocument();
    });

    it("includes save option in subscription request when checked", async () => {
      const user = userEvent.setup();

      renderWithProviders(<PaymentFlow {...defaultProps} />);

      await fillValidForm(user);

      const saveCheckbox = screen.getByLabelText(/save payment method/i);
      await user.click(saveCheckbox);

      const submitButton = screen.getByRole("button", {
        name: /complete subscription/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnCreateSubscription).toHaveBeenCalledWith(
          expect.objectContaining({
            savePaymentMethod: true,
          }),
        );
      });
    });
  });

  describe("Cancel Flow", () => {
    it("calls onCancel when cancel button is clicked", async () => {
      const user = userEvent.setup();

      renderWithProviders(<PaymentFlow {...defaultProps} />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it("shows confirmation modal for cancel during processing", async () => {
      const user = userEvent.setup();

      renderWithProviders(<PaymentFlow {...defaultProps} />);

      await fillValidForm(user);

      const submitButton = screen.getByRole("button", {
        name: /complete subscription/i,
      });
      await user.click(submitButton);

      // Try to cancel while processing
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("provides proper form labels and descriptions", () => {
      renderWithProviders(<PaymentFlow {...defaultProps} />);

      const cardNumberInput = screen.getByLabelText(/card number/i);
      expect(cardNumberInput).toHaveAccessibleDescription();
    });

    it("announces form validation errors to screen readers", async () => {
      const user = userEvent.setup();

      renderWithProviders(<PaymentFlow {...defaultProps} />);

      const submitButton = screen.getByRole("button", {
        name: /complete subscription/i,
      });
      await user.click(submitButton);

      const errorSummary = screen.getByRole("alert");
      expect(errorSummary).toBeInTheDocument();
    });

    it("supports keyboard navigation", async () => {
      const user = userEvent.setup();

      renderWithProviders(<PaymentFlow {...defaultProps} />);

      const cardNumberInput = screen.getByLabelText(/card number/i);
      cardNumberInput.focus();

      await user.tab();
      expect(screen.getByLabelText(/expiry date/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/cvc/i)).toHaveFocus();
    });
  });

  describe("Mobile Responsiveness", () => {
    it("renders mobile-friendly layout", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 400,
      });

      renderWithProviders(<PaymentFlow {...defaultProps} />);

      const container = screen.getByTestId("payment-flow-container");
      expect(container).toHaveClass("p-4"); // Mobile padding
    });

    it("shows mobile-optimized keyboard for number inputs", () => {
      renderWithProviders(<PaymentFlow {...defaultProps} />);

      const cardNumberInput = screen.getByLabelText(/card number/i);
      expect(cardNumberInput).toHaveAttribute("inputMode", "numeric");
    });
  });

  describe("Loading and Error States", () => {
    it("shows loading spinner during payment processing", async () => {
      const user = userEvent.setup();

      renderWithProviders(<PaymentFlow {...defaultProps} />);

      await fillValidForm(user);

      const submitButton = screen.getByRole("button", {
        name: /complete subscription/i,
      });
      await user.click(submitButton);

      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });

    it("displays error messages clearly", async () => {
      const user = userEvent.setup();

      renderWithProviders(<PaymentFlow {...defaultProps} />);

      const submitButton = screen.getByRole("button", {
        name: /complete subscription/i,
      });
      await user.click(submitButton);

      const errorAlert = screen.getByRole("alert");
      expect(errorAlert).toHaveClass("bg-red-50");
    });
  });
});
