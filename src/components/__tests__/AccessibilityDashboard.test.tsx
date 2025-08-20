import { expect, test, jest } from "@jest/globals";
/**
 * AccessibilityDashboard Component Tests
 *
 * Tests comprehensive accessibility settings interface including visual settings,
 * navigation preferences, audio controls, and screen reader functionality.
 */

import React from "react";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../__tests__/utils/render-helpers";
import AccessibilityDashboard from "../AccessibilityDashboard";

// Mock hooks
const mockAccessibilityPreferences = {
  preferences: {
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReaderEnabled: false,
    keyboardNavigationOnly: false,
    focusIndicatorEnhanced: false,
    colorBlindFriendly: false,
    fontSize: 16,
    voiceAnnouncementsEnabled: false,
    hapticFeedback: false,
    touchTargetSize: "normal",
  },
  updatePreferences: jest.fn(),
  resetToDefaults: jest.fn(),
  testColorContrast: jest.fn(),
};

jest.mock("../hooks/useAccessibilityPreferences", () => ({
  useAccessibilityPreferences: () => mockAccessibilityPreferences,
}));

const mockDynamicFocus = {
  announce: jest.fn(),
  announceSuccess: jest.fn(),
  announceError: jest.fn(),
};

jest.mock("../hooks/useDynamicFocus", () => ({
  useDynamicFocus: () => mockDynamicFocus,
}));

describe("AccessibilityDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders accessibility dashboard with main sections", () => {
      renderWithProviders(<AccessibilityDashboard />);

      expect(screen.getByText("Visual & Display")).toBeInTheDocument();
      expect(screen.getByText("Navigation & Focus")).toBeInTheDocument();
      expect(screen.getByText("Audio & Speech")).toBeInTheDocument();
      expect(screen.getByText("Touch & Interaction")).toBeInTheDocument();
      expect(screen.getByText("Screen Reader Testing")).toBeInTheDocument();
      expect(screen.getByText("Advanced Features")).toBeInTheDocument();
    });

    it("defaults to visual section", () => {
      renderWithProviders(<AccessibilityDashboard />);

      const visualTab = screen.getByRole("tab", { name: /visual & display/i });
      expect(visualTab).toHaveAttribute("aria-selected", "true");

      expect(screen.getByText("Visual & Display Settings")).toBeInTheDocument();
    });

    it("renders embedded mode correctly", () => {
      renderWithProviders(<AccessibilityDashboard embedded={true} />);

      // Should not show close button in embedded mode
      expect(
        screen.queryByRole("button", { name: /close/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Section Navigation", () => {
    it("switches between sections correctly", async () => {
      const user = userEvent.setup();

      renderWithProviders(<AccessibilityDashboard />);

      const audioTab = screen.getByRole("tab", { name: /audio & speech/i });
      await user.click(audioTab);

      expect(audioTab).toHaveAttribute("aria-selected", "true");
      expect(screen.getByText("Audio & Speech Settings")).toBeInTheDocument();

      expect(mockDynamicFocus.announce).toHaveBeenCalledWith(
        "Switched to Audio & Speech settings",
      );
    });

    it("supports keyboard navigation between sections", async () => {
      const user = userEvent.setup();

      renderWithProviders(<AccessibilityDashboard />);

      const visualTab = screen.getByRole("tab", { name: /visual & display/i });
      visualTab.focus();

      await user.keyboard("{ArrowRight}");

      const navigationTab = screen.getByRole("tab", {
        name: /navigation & focus/i,
      });
      expect(navigationTab).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(navigationTab).toHaveAttribute("aria-selected", "true");
    });

    it("manages focus correctly when switching sections", async () => {
      const user = userEvent.setup();

      renderWithProviders(<AccessibilityDashboard />);

      const touchTab = screen.getByRole("tab", {
        name: /touch & interaction/i,
      });
      await user.click(touchTab);

      // Focus should be managed programmatically
      await waitFor(() => {
        const sectionContent = screen.getByRole("tabpanel");
        expect(sectionContent).toHaveAttribute("tabindex", "-1");
      });
    });
  });

  describe("Visual & Display Settings", () => {
    beforeEach(() => {
      renderWithProviders(<AccessibilityDashboard />);
    });

    it("toggles high contrast mode", async () => {
      const user = userEvent.setup();

      const highContrastToggle = screen.getByLabelText(/high contrast/i);
      await user.click(highContrastToggle);

      expect(
        mockAccessibilityPreferences.updatePreferences,
      ).toHaveBeenCalledWith({
        highContrast: true,
      });

      expect(mockDynamicFocus.announce).toHaveBeenCalledWith(
        "High contrast mode enabled",
      );
    });

    it("adjusts font size with slider", async () => {
      const user = userEvent.setup();

      const fontSizeSlider = screen.getByLabelText(/font size/i);
      fireEvent.change(fontSizeSlider, { target: { value: "20" } });

      expect(
        mockAccessibilityPreferences.updatePreferences,
      ).toHaveBeenCalledWith({
        fontSize: 20,
      });
    });

    it("toggles large text mode", async () => {
      const user = userEvent.setup();

      const largeTextToggle = screen.getByLabelText(/large text/i);
      await user.click(largeTextToggle);

      expect(
        mockAccessibilityPreferences.updatePreferences,
      ).toHaveBeenCalledWith({
        largeText: true,
      });
    });

    it("enables color blind friendly mode", async () => {
      const user = userEvent.setup();

      const colorBlindToggle = screen.getByLabelText(/color blind friendly/i);
      await user.click(colorBlindToggle);

      expect(
        mockAccessibilityPreferences.updatePreferences,
      ).toHaveBeenCalledWith({
        colorBlindFriendly: true,
      });
    });
  });

  describe("Navigation & Focus Settings", () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderWithProviders(<AccessibilityDashboard />);

      const navTab = screen.getByRole("tab", { name: /navigation & focus/i });
      await user.click(navTab);
    });

    it("enables keyboard-only navigation", async () => {
      const user = userEvent.setup();

      const keyboardNavToggle = screen.getByLabelText(
        /keyboard navigation only/i,
      );
      await user.click(keyboardNavToggle);

      expect(
        mockAccessibilityPreferences.updatePreferences,
      ).toHaveBeenCalledWith({
        keyboardNavigationOnly: true,
      });
    });

    it("enhances focus indicators", async () => {
      const user = userEvent.setup();

      const focusIndicatorToggle = screen.getByLabelText(
        /enhanced focus indicators/i,
      );
      await user.click(focusIndicatorToggle);

      expect(
        mockAccessibilityPreferences.updatePreferences,
      ).toHaveBeenCalledWith({
        focusIndicatorEnhanced: true,
      });
    });

    it("enables reduced motion", async () => {
      const user = userEvent.setup();

      const reducedMotionToggle = screen.getByLabelText(/reduced motion/i);
      await user.click(reducedMotionToggle);

      expect(
        mockAccessibilityPreferences.updatePreferences,
      ).toHaveBeenCalledWith({
        reducedMotion: true,
      });
    });
  });

  describe("Audio & Speech Settings", () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderWithProviders(<AccessibilityDashboard />);

      const audioTab = screen.getByRole("tab", { name: /audio & speech/i });
      await user.click(audioTab);
    });

    it("enables screen reader support", async () => {
      const user = userEvent.setup();

      const screenReaderToggle = screen.getByLabelText(
        /screen reader enabled/i,
      );
      await user.click(screenReaderToggle);

      expect(
        mockAccessibilityPreferences.updatePreferences,
      ).toHaveBeenCalledWith({
        screenReaderEnabled: true,
      });
    });

    it("toggles voice announcements", async () => {
      const user = userEvent.setup();

      const voiceToggle = screen.getByLabelText(/voice announcements/i);
      await user.click(voiceToggle);

      expect(
        mockAccessibilityPreferences.updatePreferences,
      ).toHaveBeenCalledWith({
        voiceAnnouncementsEnabled: true,
      });
    });
  });

  describe("Touch & Interaction Settings", () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderWithProviders(<AccessibilityDashboard />);

      const touchTab = screen.getByRole("tab", {
        name: /touch & interaction/i,
      });
      await user.click(touchTab);
    });

    it("adjusts touch target size", async () => {
      const user = userEvent.setup();

      const touchSizeSelect = screen.getByLabelText(/touch target size/i);
      await user.selectOptions(touchSizeSelect, "large");

      expect(
        mockAccessibilityPreferences.updatePreferences,
      ).toHaveBeenCalledWith({
        touchTargetSize: "large",
      });
    });

    it("enables haptic feedback", async () => {
      const user = userEvent.setup();

      const hapticToggle = screen.getByLabelText(/haptic feedback/i);
      await user.click(hapticToggle);

      expect(
        mockAccessibilityPreferences.updatePreferences,
      ).toHaveBeenCalledWith({
        hapticFeedback: true,
      });
    });
  });

  describe("Reset Functionality", () => {
    it("resets all preferences to defaults", async () => {
      const user = userEvent.setup();

      renderWithProviders(<AccessibilityDashboard />);

      const resetButton = screen.getByRole("button", {
        name: /reset to defaults/i,
      });
      await user.click(resetButton);

      expect(mockAccessibilityPreferences.resetToDefaults).toHaveBeenCalled();
      expect(mockDynamicFocus.announceSuccess).toHaveBeenCalledWith(
        "Accessibility preferences reset to defaults",
      );
    });

    it("shows confirmation dialog before reset", async () => {
      const user = userEvent.setup();

      renderWithProviders(<AccessibilityDashboard />);

      const resetButton = screen.getByRole("button", {
        name: /reset to defaults/i,
      });
      await user.click(resetButton);

      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();

      const confirmButton = screen.getByRole("button", {
        name: /confirm reset/i,
      });
      await user.click(confirmButton);

      expect(mockAccessibilityPreferences.resetToDefaults).toHaveBeenCalled();
    });
  });

  describe("Screen Reader Testing", () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderWithProviders(<AccessibilityDashboard />);

      const testingTab = screen.getByRole("tab", {
        name: /screen reader testing/i,
      });
      await user.click(testingTab);
    });

    it("renders screen reader test interface", () => {
      expect(screen.getByText("Screen Reader Testing")).toBeInTheDocument();
      expect(screen.getByText(/test how content sounds/i)).toBeInTheDocument();
    });

    it("provides sample content for testing", () => {
      const testButton = screen.getByRole("button", {
        name: /test sample content/i,
      });
      expect(testButton).toBeInTheDocument();
    });
  });

  describe("Accessibility Features", () => {
    it("provides proper ARIA labels and roles", () => {
      renderWithProviders(<AccessibilityDashboard />);

      const tabList = screen.getByRole("tablist");
      expect(tabList).toBeInTheDocument();

      const tabs = screen.getAllByRole("tab");
      tabs.forEach((tab) => {
        expect(tab).toHaveAccessibleName();
        expect(tab).toHaveAttribute("aria-controls");
      });

      const tabPanel = screen.getByRole("tabpanel");
      expect(tabPanel).toHaveAttribute("aria-labelledby");
    });

    it("manages focus appropriately", () => {
      renderWithProviders(<AccessibilityDashboard />);

      const tabPanel = screen.getByRole("tabpanel");
      expect(tabPanel).toHaveAttribute("tabindex", "-1");
    });

    it("provides live region for announcements", () => {
      renderWithProviders(<AccessibilityDashboard />);

      const liveRegion = screen.getByRole("status");
      expect(liveRegion).toHaveAttribute("aria-live", "polite");
    });

    it("includes skip links for keyboard navigation", () => {
      renderWithProviders(<AccessibilityDashboard />);

      const skipLink = screen.getByRole("link", {
        name: /skip to main content/i,
      });
      expect(skipLink).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("handles preference update failures gracefully", async () => {
      const user = userEvent.setup();

      mockAccessibilityPreferences.updatePreferences.mockRejectedValue(
        new Error("Update failed"),
      );

      renderWithProviders(<AccessibilityDashboard />);

      const highContrastToggle = screen.getByLabelText(/high contrast/i);
      await user.click(highContrastToggle);

      await waitFor(() => {
        expect(mockDynamicFocus.announceError).toHaveBeenCalledWith(
          expect.stringContaining("failed"),
        );
      });
    });

    it("handles missing preferences gracefully", () => {
      mockAccessibilityPreferences.preferences = null as any;

      renderWithProviders(<AccessibilityDashboard />);

      // Should still render without crashing
      expect(screen.getByText("Visual & Display")).toBeInTheDocument();
    });
  });

  describe("Mobile Responsiveness", () => {
    beforeEach(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });
    });

    it("adapts layout for mobile screens", () => {
      renderWithProviders(<AccessibilityDashboard />);

      const dashboard = screen.getByRole("main");
      expect(dashboard).toHaveClass("px-4"); // Mobile padding
    });

    it("stacks sections vertically on mobile", () => {
      renderWithProviders(<AccessibilityDashboard />);

      const tabList = screen.getByRole("tablist");
      expect(tabList).toHaveClass("flex-col");
    });
  });

  describe("Dark Mode Support", () => {
    it("applies dark mode classes correctly", () => {
      renderWithProviders(<AccessibilityDashboard />, { theme: "dark" });

      const headings = screen.getAllByRole("heading");
      headings.forEach((heading) => {
        expect(heading).toHaveClass("dark:text-white");
      });
    });
  });

  describe("Close Functionality", () => {
    it("calls onClose when close button is clicked", async () => {
      const mockOnClose = jest.fn();
      const user = userEvent.setup();

      renderWithProviders(<AccessibilityDashboard onClose={mockOnClose} />);

      const closeButton = screen.getByRole("button", { name: /close/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("supports escape key to close", async () => {
      const mockOnClose = jest.fn();
      const user = userEvent.setup();

      renderWithProviders(<AccessibilityDashboard onClose={mockOnClose} />);

      await user.keyboard("{Escape}");

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
