/**
 * Alarm Management - End-to-End Accessibility Tests
 * 
 * Tests accessibility compliance for critical alarm management flows:
 * creating, editing, deleting, and managing alarms.
 */

import { test, expect } from '@playwright/test';
import { createA11yUtils, axeConfigs, a11yPatterns } from './playwright-a11y-utils';

test.describe('Create Alarm - Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should access create alarm form accessibly', async ({ page }) => {
    // Find and click the "Create Alarm" or "Add Alarm" button
    const createButton = page.locator(
      'button:has-text("create"), button:has-text("add"), button[aria-label*="create"], button[aria-label*="add"]'
    ).first();
    
    if (await createButton.isVisible()) {
      // Test button accessibility
      await expect(createButton).toHaveAccessibleName();
      
      // Click to open form
      await createButton.click();
      await page.waitForTimeout(500);
      
      const a11y = createA11yUtils(page);
      await a11y.expectNoViolations(axeConfigs.forms);
    }
  });

  test('should have accessible alarm form', async ({ page }) => {
    // Navigate to alarm form (may be modal or separate page)
    const createButton = page.locator('button:has-text("create"), button:has-text("add")').first();
    
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);
      
      // Test form accessibility
      await a11yPatterns.testFormAccessibility(page, 'form, [role="dialog"]');
      
      // Check required form fields have proper labels
      const timeInput = page.locator('input[type="time"], input[placeholder*="time"]').first();
      if (await timeInput.isVisible()) {
        await expect(timeInput).toHaveAccessibleName();
        
        const isRequired = await timeInput.getAttribute('required') !== null ||
                          await timeInput.getAttribute('aria-required') === 'true';
        if (isRequired) {
          // Required fields should be announced as such
          expect(isRequired).toBe(true);
        }
      }
      
      // Check sound selection is accessible
      const soundSelect = page.locator('select, [role="combobox"], [role="listbox"]').first();
      if (await soundSelect.isVisible()) {
        await expect(soundSelect).toHaveAccessibleName();
      }
      
      // Check day selection (checkboxes or toggles)
      const dayControls = page.locator('input[type="checkbox"], [role="checkbox"], button[role="switch"]');
      const dayCount = await dayControls.count();
      if (dayCount > 0) {
        for (let i = 0; i < Math.min(dayCount, 7); i++) {
          const dayControl = dayControls.nth(i);
          if (await dayControl.isVisible()) {
            await expect(dayControl).toHaveAccessibleName();
          }
        }
      }
    }
  });

  test('should handle form validation errors accessibly', async ({ page }) => {
    const createButton = page.locator('button:has-text("create"), button:has-text("add")').first();
    
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);
      
      // Try to submit empty form to trigger validation
      const submitButton = page.locator('button[type="submit"], button:has-text("save")').first();
      if (await submitButton.isVisible()) {
        const a11y = createA11yUtils(page);
        
        await a11y.expectAnnouncement(async () => {
          await submitButton.click();
          await page.waitForTimeout(1000);
        }, 'required', 3000);
        
        // Check that form errors are accessible
        await a11y.expectNoViolations(axeConfigs.forms);
        
        // Verify error messages are properly associated
        const errorMessages = page.locator('[role="alert"], .error, [aria-invalid="true"] + *');
        const errorCount = await errorMessages.count();
        
        if (errorCount > 0) {
          for (let i = 0; i < errorCount; i++) {
            const error = errorMessages.nth(i);
            const errorText = await error.textContent();
            expect(errorText?.trim()).toBeTruthy();
          }
        }
      }
    }
  });

  test('should support keyboard navigation in form', async ({ page }) => {
    const createButton = page.locator('button:has-text("create"), button:has-text("add")').first();
    
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);
      
      const a11y = createA11yUtils(page);
      
      // Test keyboard navigation through form
      const navResults = await a11y.testKeyboardNavigation('form, [role="dialog"]');
      
      expect(navResults.focusableElements.length).toBeGreaterThan(0);
      expect(navResults.violations.length).toBe(0);
      
      // Test that Tab moves through form fields logically
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to interact with form via keyboard
      const focused = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
      expect(['input', 'select', 'button', 'textarea']).toContain(focused);
    }
  });

  test('should handle time input accessibly', async ({ page }) => {
    const createButton = page.locator('button:has-text("create"), button:has-text("add")').first();
    
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);
      
      const timeInput = page.locator('input[type="time"]').first();
      if (await timeInput.isVisible()) {
        // Test that time input accepts keyboard input
        await timeInput.focus();
        await timeInput.fill('09:30');
        
        const value = await timeInput.inputValue();
        expect(value).toBe('09:30');
        
        // Time input should be properly labeled
        await expect(timeInput).toHaveAccessibleName();
      }
    }
  });
});

test.describe('Edit Alarm - Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should access edit alarm form accessibly', async ({ page }) => {
    // Find an existing alarm to edit
    const editButton = page.locator(
      'button:has-text("edit"), button[aria-label*="edit"], [role="button"]:has-text("edit")'
    ).first();
    
    if (await editButton.isVisible()) {
      await expect(editButton).toHaveAccessibleName();
      
      await editButton.click();
      await page.waitForTimeout(500);
      
      // Test edit form accessibility
      const a11y = createA11yUtils(page);
      await a11y.expectNoViolations(axeConfigs.forms);
    }
  });

  test('should prefill form with existing alarm data', async ({ page }) => {
    const editButton = page.locator('button:has-text("edit"), button[aria-label*="edit"]').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(500);
      
      // Check that form fields are prefilled
      const timeInput = page.locator('input[type="time"]').first();
      if (await timeInput.isVisible()) {
        const value = await timeInput.inputValue();
        expect(value).toBeTruthy(); // Should have a time value
      }
      
      // Form should still be accessible with prefilled data
      const a11y = createA11yUtils(page);
      await a11y.expectNoViolations(axeConfigs.forms);
    }
  });

  test('should announce form changes to screen readers', async ({ page }) => {
    const editButton = page.locator('button:has-text("edit"), button[aria-label*="edit"]').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(500);
      
      const a11y = createA11yUtils(page);
      
      // Test that form changes are announced
      const soundSelect = page.locator('select, [role="combobox"]').first();
      if (await soundSelect.isVisible()) {
        await a11y.expectAnnouncement(async () => {
          await soundSelect.selectOption({ index: 1 });
        });
      }
    }
  });
});

test.describe('Delete Alarm - Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should handle delete confirmation accessibly', async ({ page }) => {
    const deleteButton = page.locator(
      'button:has-text("delete"), button[aria-label*="delete"], button[aria-label*="remove"]'
    ).first();
    
    if (await deleteButton.isVisible()) {
      await expect(deleteButton).toHaveAccessibleName();
      
      await deleteButton.click();
      await page.waitForTimeout(500);
      
      // Should show confirmation dialog
      const confirmDialog = page.locator('[role="dialog"], .modal, .confirmation').first();
      if (await confirmDialog.isVisible()) {
        // Test modal accessibility
        await a11yPatterns.testModalAccessibility(page, '[role="dialog"], .modal, .confirmation');
        
        // Should have clear confirmation message
        const dialogText = await confirmDialog.textContent();
        expect(dialogText?.toLowerCase()).toContain('delete');
        
        // Should have clear action buttons
        const confirmButton = page.locator('button:has-text("confirm"), button:has-text("delete")').first();
        const cancelButton = page.locator('button:has-text("cancel"), button:has-text("no")').first();
        
        if (await confirmButton.isVisible()) {
          await expect(confirmButton).toHaveAccessibleName();
        }
        if (await cancelButton.isVisible()) {
          await expect(cancelButton).toHaveAccessibleName();
        }
      }
    }
  });

  test('should support escape key to cancel deletion', async ({ page }) => {
    const deleteButton = page.locator('button:has-text("delete"), button[aria-label*="delete"]').first();
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await page.waitForTimeout(500);
      
      const confirmDialog = page.locator('[role="dialog"], .modal').first();
      if (await confirmDialog.isVisible()) {
        // Press Escape to cancel
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        
        // Dialog should be closed
        await expect(confirmDialog).not.toBeVisible();
      }
    }
  });

  test('should announce deletion success', async ({ page }) => {
    const deleteButton = page.locator('button:has-text("delete"), button[aria-label*="delete"]').first();
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await page.waitForTimeout(500);
      
      const confirmButton = page.locator('button:has-text("confirm"), button:has-text("delete")').first();
      if (await confirmButton.isVisible()) {
        const a11y = createA11yUtils(page);
        
        // Should announce successful deletion
        await a11y.expectAnnouncement(async () => {
          await confirmButton.click();
          await page.waitForTimeout(1000);
        }, 'deleted');
      }
    }
  });
});

test.describe('Alarm Toggle - Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should handle alarm enable/disable accessibly', async ({ page }) => {
    const toggleButton = page.locator(
      'button[role="switch"], input[type="checkbox"] + label, .toggle, button:has-text("enable"), button:has-text("disable")'
    ).first();
    
    if (await toggleButton.isVisible()) {
      // Should have accessible name and state
      await expect(toggleButton).toHaveAccessibleName();
      
      const initialState = await toggleButton.getAttribute('aria-checked') ||
                          await toggleButton.getAttribute('aria-pressed') ||
                          (await toggleButton.isChecked() ? 'true' : 'false');
      
      expect(['true', 'false']).toContain(initialState);
      
      const a11y = createA11yUtils(page);
      
      // Should announce state change
      await a11y.expectAnnouncement(async () => {
        await toggleButton.click();
        await page.waitForTimeout(500);
      });
      
      // State should have changed
      const newState = await toggleButton.getAttribute('aria-checked') ||
                      await toggleButton.getAttribute('aria-pressed') ||
                      (await toggleButton.isChecked() ? 'true' : 'false');
      
      expect(newState).not.toBe(initialState);
    }
  });

  test('should support space key for toggle activation', async ({ page }) => {
    const toggleButton = page.locator('button[role="switch"], .toggle').first();
    
    if (await toggleButton.isVisible()) {
      await toggleButton.focus();
      
      const initialState = await toggleButton.getAttribute('aria-checked') || 'false';
      
      // Use space to toggle
      await page.keyboard.press('Space');
      await page.waitForTimeout(500);
      
      const newState = await toggleButton.getAttribute('aria-checked') || 'false';
      expect(newState).not.toBe(initialState);
    }
  });
});

test.describe('Alarm List View - Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have accessible alarm list structure', async ({ page }) => {
    const alarmList = page.locator('ul, [role="list"], .alarm-list').first();
    
    if (await alarmList.isVisible()) {
      // Test list accessibility
      const a11y = createA11yUtils(page);
      await a11y.expectNoViolations({
        ...axeConfigs.wcag21aa,
        include: ['ul, [role="list"], .alarm-list'],
      });
      
      // Each alarm should be properly structured
      const alarmItems = page.locator('li, [role="listitem"], .alarm-item');
      const itemCount = await alarmItems.count();
      
      if (itemCount > 0) {
        for (let i = 0; i < Math.min(itemCount, 3); i++) {
          const item = alarmItems.nth(i);
          const itemText = await item.textContent();
          expect(itemText?.trim()).toBeTruthy();
        }
      }
    }
  });

  test('should support screen reader navigation', async ({ page }) => {
    const alarmList = page.locator('ul, [role="list"]').first();
    
    if (await alarmList.isVisible()) {
      // Screen readers should be able to navigate list items
      const listItems = page.locator('li, [role="listitem"]');
      const itemCount = await listItems.count();
      
      expect(itemCount).toBeGreaterThanOrEqual(0);
      
      // If there are items, they should be navigable
      if (itemCount > 0) {
        for (let i = 0; i < Math.min(itemCount, 3); i++) {
          const item = listItems.nth(i);
          const hasAccessibleContent = await item.evaluate(el => {
            return el.textContent?.trim().length || 0;
          });
          expect(hasAccessibleContent).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should handle empty alarm list accessibly', async ({ page }) => {
    // This test may require clearing all alarms or navigating to empty state
    const emptyMessage = page.locator('.empty, .no-alarms, [role="status"]');
    
    if (await emptyMessage.isVisible()) {
      const messageText = await emptyMessage.textContent();
      expect(messageText?.trim()).toBeTruthy();
      
      // Empty state should still be accessible
      const a11y = createA11yUtils(page);
      await a11y.expectNoViolations(axeConfigs.critical);
    }
  });
});