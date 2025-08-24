import React from 'react'; // auto: added missing React import
/**
 * RTL tests for Card components
 */

import { screen } from '@testing-library/react';
import { describe, it, expect, test } from 'vitest';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from '../../components/ui/card';
import {
  renderWithRTL,
  rtlTestHelpers,
  rtlTestScenarios,
  rtlA11yHelpers,
} from '../../utils/rtl-testing';

describe('Card RTL Support', (
) => {
  const createCard = (
) => (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
        <CardAction>
          <button>Action</button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p>Card content goes here</p>
      </CardContent>
      <CardFooter>
        <button>Cancel</button>
        <button>Save</button>
      </CardFooter>
    </Card>
  );

  rtlTestScenarios.testBothDirections(createCard, (element, isRTL, language
) => {
    // Check main card direction
    rtlTestHelpers.expectCorrectDirection(element, isRTL ? 'rtl' : 'ltr');
    rtlTestHelpers.expectRTLDataAttribute(element, isRTL);
  });

  test('CardAction positioning in RTL', (
) => {
    const { container } = renderWithRTL(createCard(), { language: 'ar' });
    const cardAction = container.querySelector(
      '[data-slot="card-action"]'
    ) as HTMLElement;

    expect(cardAction).toHaveClass('justify-self-start');
    expect(cardAction).toHaveAttribute('data-rtl', 'true');
  });

  test('CardAction positioning in LTR', (
) => {
    const { container } = renderWithRTL(createCard(), { language: 'en' });
    const cardAction = container.querySelector(
      '[data-slot="card-action"]'
    ) as HTMLElement;

    expect(cardAction).toHaveClass('justify-self-end');
    expect(cardAction).toHaveAttribute('data-rtl', 'false');
  });

  test('CardFooter flex direction in RTL', (
) => {
    const { container } = renderWithRTL(createCard(), { language: 'ar' });
    const cardFooter = container.querySelector(
      '[data-slot="card-footer"]'
    ) as HTMLElement;

    expect(cardFooter).toHaveClass('flex-row-reverse');
    expect(cardFooter).toHaveAttribute('data-rtl', 'true');
  });

  test('CardFooter flex direction in LTR', (
) => {
    const { container } = renderWithRTL(createCard(), { language: 'en' });
    const cardFooter = container.querySelector(
      '[data-slot="card-footer"]'
    ) as HTMLElement;

    expect(cardFooter).toHaveClass('flex-row');
    expect(cardFooter).toHaveAttribute('data-rtl', 'false');
  });

  test('custom direction override', (
) => {
    const { container } = renderWithRTL(
      <Card dir="ltr">
        <CardContent>Forced LTR content</CardContent>
      </Card>,
      { language: 'ar' }
    );
    const card = container.firstChild as HTMLElement;

    expect(card).toHaveAttribute('dir', 'ltr');
  });

  rtlTestScenarios.testAllRTLLanguages(createCard, (element, language
) => {
    rtlTestHelpers.expectCorrectDirection(element, 'rtl');
    rtlTestHelpers.expectRTLDataAttribute(element, true);

    // Check that action is positioned on the left in RTL
    const cardAction = element.querySelector(
      '[data-slot="card-action"]'
    ) as HTMLElement;
    if (cardAction) {
      expect(cardAction).toHaveClass('justify-self-start');
    }
  });
});
