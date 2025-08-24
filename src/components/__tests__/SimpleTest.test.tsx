import { expect, test, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple test component to verify Jest setup works
const SimpleComponent = ({ message = 'Hello Testing!' }: { message?: string }
) => (
  <div data-testid="simple-component">
    <h1>{message}</h1>
    <p>Jest and React Testing Library are working!</p>
  </div>
);

describe('Simple Test Suite', (
) => {
  test('renders hello message', (
) => {
    render(<SimpleComponent />);

    // Test that the component renders
    expect(screen.getByTestId('simple-component')).toBeDefined();
    expect(screen.getByText('Hello Testing!')).toBeDefined();
    expect(
      screen.getByText('Jest and React Testing Library are working!')
    ).toBeDefined();
  });

  test('renders custom message', (
) => {
    const customMessage = 'Testing infrastructure is ready!';
    render(<SimpleComponent message={customMessage} />);

    expect(screen.getByText(customMessage)).toBeDefined();
  });

  test('has proper accessibility structure', (
) => {
    render(<SimpleComponent />);

    // Test heading structure
    expect(screen.getByRole('heading', { level: 1 })).toBeDefined();

    // Test that component has testid for reliable selection
    expect(screen.getByTestId('simple-component')).toBeDefined();
  });
});
