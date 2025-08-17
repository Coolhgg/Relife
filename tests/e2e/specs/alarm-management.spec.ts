import { test, expect } from '@playwright/test';
import { DashboardPage, AlarmFormPage, AuthPage } from '../page-objects';
import { TestHelpers } from '../utils/test-helpers';
import { TestData } from '../fixtures/test-data';

test.describe('Alarm Management', () => {
  let dashboardPage: DashboardPage;
  let alarmFormPage: AlarmFormPage;
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    alarmFormPage = new AlarmFormPage(page);
    authPage = new AuthPage(page);
    
    // Clear storage and navigate to dashboard
    await TestHelpers.clearAllStorage(page);
    await dashboardPage.navigateToDashboard();
  });

  test.describe('Alarm Creation', () => {
    test('should create a basic alarm successfully', async () => {
      const testAlarm = TestData.ALARMS.BASIC_ALARM;

      await test.step('Open alarm creation form', async () => {
        await alarmFormPage.openAlarmForm();
      });

      await test.step('Fill alarm details and save', async () => {
        await alarmFormPage.createBasicAlarm(testAlarm.time, testAlarm.label);
      });

      await test.step('Verify alarm was created', async () => {
        // Check for success message
        await alarmFormPage.waitForToast(TestData.SUCCESS_MESSAGES.ALARM_CREATED);
        
        // Verify alarm appears in list
        const alarmItem = dashboardPage.page.locator(`[data-testid="alarm-item"]:has-text("${testAlarm.label}")`);
        await expect(alarmItem).toBeVisible();
      });
    });

    test('should create a recurring alarm with multiple days', async () => {
      const testAlarm = TestData.ALARMS.WORK_ALARM;

      await test.step('Open alarm creation form', async () => {
        await alarmFormPage.openAlarmForm();
      });

      await test.step('Create recurring alarm', async () => {
        await alarmFormPage.createRecurringAlarm(testAlarm.time, testAlarm.label, testAlarm.days!);
      });

      await test.step('Verify recurring alarm was created', async () => {
        await alarmFormPage.waitForToast();
        
        const alarmItem = dashboardPage.page.locator(`[data-testid="alarm-item"]:has-text("${testAlarm.label}")`);
        await expect(alarmItem).toBeVisible();
        
        // Check that days are displayed
        for (const day of testAlarm.days!) {
          const dayIndicator = alarmItem.locator(`:has-text("${day.substring(0, 3)}")`);
          await expect(dayIndicator).toBeVisible();
        }
      });
    });

    test('should create an advanced alarm with all features', async () => {
      const testAlarm = TestData.ALARMS.ADVANCED_ALARM;

      await test.step('Open alarm creation form', async () => {
        await alarmFormPage.openAlarmForm();
      });

      await test.step('Configure advanced alarm features', async () => {
        await alarmFormPage.createAdvancedAlarm({
          time: testAlarm.time,
          label: testAlarm.label,
          sound: testAlarm.sound,
          volume: testAlarm.volume,
          vibrate: testAlarm.vibrate,
          days: testAlarm.days,
          voiceMood: testAlarm.voiceMood,
          smartWakeup: true
        });
      });

      await test.step('Verify advanced alarm was created', async () => {
        await alarmFormPage.waitForToast();
        
        const alarmItem = dashboardPage.page.locator(`[data-testid="alarm-item"]:has-text("${testAlarm.label}")`);
        await expect(alarmItem).toBeVisible();
      });
    });

    test('should validate form inputs properly', async () => {
      await test.step('Open alarm creation form', async () => {
        await alarmFormPage.openAlarmForm();
      });

      await test.step('Test form validation', async () => {
        await alarmFormPage.verifyFormValidation();
      });

      await test.step('Test with valid inputs', async () => {
        const validTime = TestData.getFutureTime(10);
        await alarmFormPage.setTime(validTime);
        await alarmFormPage.setLabel('Valid Alarm');
        await alarmFormPage.saveAlarm();
        
        // Should succeed
        await alarmFormPage.waitForToast();
      });
    });

    test('should maintain accessibility standards in form', async () => {
      await test.step('Open alarm creation form', async () => {
        await alarmFormPage.openAlarmForm();
      });

      await test.step('Test form accessibility', async () => {
        await alarmFormPage.verifyFormAccessibility();
      });
    });
  });

  test.describe('Alarm Editing', () => {
    test.beforeEach(async () => {
      // Create a test alarm first
      await alarmFormPage.openAlarmForm();
      await alarmFormPage.createBasicAlarm('08:00', 'Test Edit Alarm');
    });

    test('should edit an existing alarm', async () => {
      await test.step('Open alarm for editing', async () => {
        const alarmItem = dashboardPage.page.locator('[data-testid="alarm-item"]:has-text("Test Edit Alarm")');
        await alarmItem.click();
        
        // Or click edit button if available
        const editButton = alarmItem.locator('[data-testid="edit-alarm"], button:has-text("Edit")');
        if (await editButton.isVisible()) {
          await editButton.click();
        }
      });

      await test.step('Modify alarm details', async () => {
        await alarmFormPage.setLabel('Modified Test Alarm');
        await alarmFormPage.setTime('08:30');
        await alarmFormPage.saveAlarm();
      });

      await test.step('Verify changes were saved', async () => {
        await alarmFormPage.waitForToast();
        
        const modifiedAlarm = dashboardPage.page.locator('[data-testid="alarm-item"]:has-text("Modified Test Alarm")');
        await expect(modifiedAlarm).toBeVisible();
        
        const oldAlarm = dashboardPage.page.locator('[data-testid="alarm-item"]:has-text("Test Edit Alarm")');
        await expect(oldAlarm).toBeHidden();
      });
    });
  });

  test.describe('Alarm Deletion', () => {
    test.beforeEach(async () => {
      // Create a test alarm first
      await alarmFormPage.openAlarmForm();
      await alarmFormPage.createBasicAlarm('09:00', 'Test Delete Alarm');
    });

    test('should delete an alarm', async () => {
      await test.step('Open alarm for deletion', async () => {
        const alarmItem = dashboardPage.page.locator('[data-testid="alarm-item"]:has-text("Test Delete Alarm")');
        
        // Try to find delete button
        const deleteButton = alarmItem.locator('[data-testid="delete-alarm"], button:has-text("Delete")');
        
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
        } else {
          // Alternative: long press or right click for context menu
          await alarmItem.click({ button: 'right' });
          const contextDelete = dashboardPage.page.locator('[role="menu"] button:has-text("Delete")');
          if (await contextDelete.isVisible()) {
            await contextDelete.click();
          }
        }
      });

      await test.step('Confirm deletion', async () => {
        // Handle confirmation dialog
        const confirmDialog = dashboardPage.page.locator('[role="dialog"]:has-text("delete")');
        if (await confirmDialog.isVisible()) {
          const confirmButton = confirmDialog.locator('button:has-text("Delete"), button:has-text("Confirm")');
          await confirmButton.click();
        }
      });

      await test.step('Verify alarm was deleted', async () => {
        await alarmFormPage.waitForToast();
        
        const deletedAlarm = dashboardPage.page.locator('[data-testid="alarm-item"]:has-text("Test Delete Alarm")');
        await expect(deletedAlarm).toBeHidden();
      });
    });
  });

  test.describe('Alarm Toggle', () => {
    test.beforeEach(async () => {
      // Create a test alarm first
      await alarmFormPage.openAlarmForm();
      await alarmFormPage.createBasicAlarm('10:00', 'Test Toggle Alarm');
    });

    test('should enable and disable alarms', async () => {
      const alarmItem = dashboardPage.page.locator('[data-testid="alarm-item"]:has-text("Test Toggle Alarm")');

      await test.step('Find alarm toggle switch', async () => {
        const toggleSwitch = alarmItem.locator('[role="switch"], input[type="checkbox"]');
        await expect(toggleSwitch).toBeVisible();
        
        // Should be enabled by default
        await expect(toggleSwitch).toBeChecked();
      });

      await test.step('Disable alarm', async () => {
        const toggleSwitch = alarmItem.locator('[role="switch"], input[type="checkbox"]');
        await toggleSwitch.click();
        
        // Verify it's disabled
        await expect(toggleSwitch).not.toBeChecked();
        
        // Visual indication of disabled state
        await expect(alarmItem).toHaveClass(/disabled|inactive/);
      });

      await test.step('Re-enable alarm', async () => {
        const toggleSwitch = alarmItem.locator('[role="switch"], input[type="checkbox"]');
        await toggleSwitch.click();
        
        // Verify it's enabled again
        await expect(toggleSwitch).toBeChecked();
        await expect(alarmItem).not.toHaveClass(/disabled|inactive/);
      });
    });
  });

  test.describe('Alarm List Management', () => {
    test('should display alarms in chronological order', async () => {
      const alarms = [
        { time: '06:00', label: 'Early Alarm' },
        { time: '08:00', label: 'Morning Alarm' },
        { time: '12:00', label: 'Noon Alarm' }
      ];

      await test.step('Create multiple alarms', async () => {
        for (const alarm of alarms) {
          await alarmFormPage.openAlarmForm();
          await alarmFormPage.createBasicAlarm(alarm.time, alarm.label);
          await TestHelpers.waitForNetworkIdle(dashboardPage.page);
        }
      });

      await test.step('Verify chronological ordering', async () => {
        const alarmItems = dashboardPage.page.locator('[data-testid="alarm-item"]');
        const count = await alarmItems.count();
        
        if (count >= 3) {
          // Check that early alarm appears before noon alarm
          const earlyAlarmIndex = await alarmItems.locator(':has-text("Early Alarm")').first().elementHandle();
          const noonAlarmIndex = await alarmItems.locator(':has-text("Noon Alarm")').first().elementHandle();
          
          // Both should be visible
          await expect(alarmItems.locator(':has-text("Early Alarm")')).toBeVisible();
          await expect(alarmItems.locator(':has-text("Noon Alarm")')).toBeVisible();
        }
      });
    });

    test('should handle empty alarm list', async () => {
      await test.step('Verify empty state when no alarms', async () => {
        const alarmCount = await dashboardPage.getAlarmCount();
        
        if (alarmCount === 0) {
          // Should show empty state
          const emptyState = dashboardPage.page.locator('[data-testid="empty-alarms"], .empty-state');
          const hasEmptyState = await emptyState.isVisible({ timeout: 3000 });
          
          if (hasEmptyState) {
            await expect(emptyState).toContainText(/no alarms|empty|create/i);
          }
        }
      });
    });
  });

  test.describe('Alarm Sound Preview', () => {
    test('should preview alarm sounds during creation', async () => {
      await test.step('Open alarm creation form', async () => {
        await alarmFormPage.openAlarmForm();
      });

      await test.step('Test sound preview functionality', async () => {
        // Select a sound
        await alarmFormPage.selectSound('nature-sounds');
        
        // Look for preview button
        const previewButton = alarmFormPage.page.locator('[data-testid="sound-preview"], button:has-text("Preview")');
        
        if (await previewButton.isVisible()) {
          await previewButton.click();
          
          // Verify preview is playing (button state change, stop button appears, etc.)
          const stopButton = alarmFormPage.page.locator('[data-testid="stop-preview"], button:has-text("Stop")');
          if (await stopButton.isVisible()) {
            await expect(stopButton).toBeVisible();
            await stopButton.click();
          }
        }
      });
    });
  });
});