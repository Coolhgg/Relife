/**
 * RTL tests for Dialog components
 */

import React from 'react';
import { screen } from '@testing-library/react';
import { vi, describe, it, expect, test } from 'vitest';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  renderWithRTL,
  rtlTestHelpers,
  rtlTestScenarios,
  rtlA11yHelpers
} from '../../utils/rtl-testing';

// Mock DialogPrimitive to avoid portal issues in tests
vi.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, open = true }: any) => open ? <div data-testid="dialog-root">{children}</div> : null,
  Portal: ({ children }: any) => <div data-testid="dialog-portal">{children}</div>,
  Overlay: ({ children, className }: any) => <div data-testid="dialog-overlay" className={className}>{children}</div>,
  Content: ({ children, className, ...props }: any) => (
    <div data-testid="dialog-content" className={className} {...props}>
      {children}
    </div>
  ),
  Title: ({ children, className }: any) => <h2 className={className}>{children}</h2>,
  Description: ({ children, className }: any) => <p className={className}>{children}</p>,
  Close: ({ children, className }: any) => <button className={className}>{children}</button>,
  Trigger: ({ children }: any) => <div>{children}</div>,
}));

describe('Dialog RTL Support', () => {
  const createDialog = () => (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Dialog description text</DialogDescription>
        </DialogHeader>
        <div>Dialog content</div>
        <DialogFooter>
          <button>Cancel</button>
          <button>Confirm</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  rtlTestScenarios.testBothDirections(
    createDialog,
    (element, isRTL, language) => {
      const dialogContent = element.querySelector('[data-testid="dialog-content"]') as HTMLElement;

      // Check direction attribute
      rtlTestHelpers.expectCorrectDirection(dialogContent, isRTL ? 'rtl' : 'ltr');
      rtlTestHelpers.expectRTLDataAttribute(dialogContent, isRTL);
    }
  );

  test('close button positioning in RTL', () => {
    const { container } = renderWithRTL(createDialog(), { language: 'ar' });
    const closeButton = container.querySelector('button') as HTMLElement; // The close button

    // Close button should be positioned on the left in RTL
    expect(closeButton).toHaveClass('left-4');
    expect(closeButton).not.toHaveClass('right-4');
  });

  test('close button positioning in LTR', () => {
    const { container } = renderWithRTL(createDialog(), { language: 'en' });
    const closeButton = container.querySelector('button') as HTMLElement; // The close button

    // Close button should be positioned on the right in LTR
    expect(closeButton).toHaveClass('right-4');
    expect(closeButton).not.toHaveClass('left-4');
  });

  test('DialogHeader text alignment in RTL', () => {
    const { container } = renderWithRTL(createDialog(), { language: 'ar' });
    const dialogHeader = container.querySelector('[data-slot="dialog-header"]') as HTMLElement;

    expect(dialogHeader).toHaveClass('sm:text-right');
    expect(dialogHeader).toHaveAttribute('data-rtl', 'true');
  });

  test('DialogHeader text alignment in LTR', () => {
    const { container } = renderWithRTL(createDialog(), { language: 'en' });
    const dialogHeader = container.querySelector('[data-slot="dialog-header"]') as HTMLElement;

    expect(dialogHeader).toHaveClass('sm:text-left');
    expect(dialogHeader).toHaveAttribute('data-rtl', 'false');
  });

  test('DialogFooter button order in RTL', () => {
    const { container } = renderWithRTL(createDialog(), { language: 'ar' });
    const dialogFooter = container.querySelector('[data-slot="dialog-footer"]') as HTMLElement;

    expect(dialogFooter).toHaveClass('sm:justify-start');
    expect(dialogFooter).toHaveClass('sm:flex-row-reverse');
    expect(dialogFooter).toHaveAttribute('data-rtl', 'true');
  });

  test('DialogFooter button order in LTR', () => {
    const { container } = renderWithRTL(createDialog(), { language: 'en' });
    const dialogFooter = container.querySelector('[data-slot="dialog-footer"]') as HTMLElement;

    expect(dialogFooter).toHaveClass('sm:justify-end');
    expect(dialogFooter).not.toHaveClass('sm:flex-row-reverse');
    expect(dialogFooter).toHaveAttribute('data-rtl', 'false');
  });

  test('custom direction override', () => {
    const { container } = renderWithRTL(
      <Dialog>
        <DialogContent dir="ltr">
          <div>Forced LTR content</div>
        </DialogContent>
      </Dialog>,
      { language: 'ar' }
    );

    const dialogContent = container.querySelector('[data-testid="dialog-content"]') as HTMLElement;
    expect(dialogContent).toHaveAttribute('dir', 'ltr');
  });

  rtlTestScenarios.testAllRTLLanguages(
    createDialog,
    (element, language) => {
      const dialogContent = element.querySelector('[data-testid="dialog-content"]') as HTMLElement;
      rtlTestHelpers.expectCorrectDirection(dialogContent, 'rtl');
      rtlTestHelpers.expectRTLDataAttribute(dialogContent, true);

      // Check close button is on the left
      const closeButton = element.querySelector('button') as HTMLElement;
      if (closeButton) {
        expect(closeButton).toHaveClass('left-4');
      }
    }
  );
});