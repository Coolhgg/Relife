// Isolated test for SoundThemeDemo component
// This tests if the corruption fix worked for the primary component

import React from "react";
import { render, screen } from "@testing-library/react";
import { SoundThemeDemo } from "./src/components/SoundThemeDemo";

describe("SoundThemeDemo - Isolated Test", () => {
  test("renders without crashing after corruption fix", () => {
    expect(() => {
      render(<SoundThemeDemo />);
    }).not.toThrow();
  });

  test("displays core themes section", () => {
    render(<SoundThemeDemo />);
    expect(screen.getByText("Core Themes")).toBeInTheDocument();
  });
});
