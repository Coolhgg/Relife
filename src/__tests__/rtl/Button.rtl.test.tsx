/**
 * RTL tests for Button component
 */

import React from 'react';
import { screen } from '@testing-library/react';
import { Button } from '../../components/ui/button';
import {
  renderWithRTL,
  rtlTestHelpers,
  rtlTestScenarios,
  rtlA11yHelpers
} from '../../utils/rtl-testing';

describe('Button RTL Support', () => {
  const createButton = (props = {}) => (
    <Button {...props}>
      <span>Icon</span>
      Test Button
    </Button>
  );

  rtlTestScenarios.testBothDirections(
    createButton,
    (element, isRTL, language) => {
      // Check direction attribute
      rtlTestHelpers.expectCorrectDirection(element, isRTL ? 'rtl' : 'ltr');

      // Check RTL data attribute
      rtlTestHelpers.expectRTLDataAttribute(element, isRTL);

      // Check flex direction for icon positioning
      rtlTestHelpers.expectRTLFlexDirection(element, isRTL);

      // Check accessibility
      rtlA11yHelpers.expectScreenReaderDirection(element, isRTL);
    }
  );

  test('icon positioning in RTL', () => {
    const { container } = renderWithRTL(createButton(), { language: 'ar' });
    const button = container.firstChild as HTMLElement;

    // Button should have flex-row-reverse in RTL to position icon on the right
    expect(button).toHaveClass('flex-row-reverse');
  });

  test('icon positioning in LTR', () => {
    const { container } = renderWithRTL(createButton(), { language: 'en' });
    const button = container.firstChild as HTMLElement;

    // Button should have flex-row in LTR to position icon on the left
    expect(button).toHaveClass('flex-row');
  });

  test('custom direction override', () => {
    const { container } = renderWithRTL(
      <Button dir="ltr">Force LTR</Button>,
      { language: 'ar' }
    );
    const button = container.firstChild as HTMLElement;

    // Should respect custom direction even in RTL language
    expect(button).toHaveAttribute('dir', 'ltr');
  });

  rtlTestScenarios.testAllRTLLanguages(
    createButton,
    (element, language) => {
      rtlTestHelpers.expectCorrectDirection(element, 'rtl');
      rtlTestHelpers.expectRTLDataAttribute(element, true);
    }
  );
});