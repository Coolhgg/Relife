/// <reference types="node" />
// Form-specific screen reader announcement hook
import { useCallback, useEffect, useRef } from "react";
import { useScreenReaderAnnouncements } from "./useScreenReaderAnnouncements";
import type { VoiceMood } from "../types";
import { getVoiceMoodConfig, formatTime } from "../utils";

export interface FormFieldChange {
  fieldName: string;
  oldValue?: any;
  newValue: any;
  fieldType?: "text" | "time" | "select" | "toggle" | "multiselect";
}

export function useFormAnnouncements() {
  const { announce, announceFormValidation } = useScreenReaderAnnouncements();
  const fieldValues = useRef<Record<string, any>>({});
  const announcementTimer = useRef<NodeJS.Timeout | null>(null);

  // Announce form field changes with debouncing
  const announceFieldChange = useCallback(
    (change: FormFieldChange, debounceMs: number = 300) => {
      const { fieldName, newValue, fieldType = "text" } = change;

      // Clear existing timer
      if (announcementTimer.current) {
        clearTimeout(announcementTimer.current);
      }

      // Store the new value
      const oldValue = fieldValues.current[fieldName];
      fieldValues.current[fieldName] = newValue;

      // Skip announcement if value hasn't actually changed
      if (oldValue === newValue) return;

      // Debounce announcements for text inputs
      if (fieldType === "text" && debounceMs > 0) {
        announcementTimer.current = setTimeout(() => {
          announceFieldValue(fieldName, newValue, fieldType);
        }, debounceMs);
      } else {
        // Announce immediately for non-text fields
        announceFieldValue(fieldName, newValue, fieldType);
      }
    },
    [announce],
  );

  const announceFieldValue = useCallback(
    (fieldName: string, value: any, fieldType: string) => {
      let message = "";

      switch (fieldType) {
        case "time":
          const timeString = formatTime(value);
          message = `${fieldName} set to ${timeString}`;
          break;
        case "toggle":
          message = `${fieldName} ${value ? "selected" : "deselected"}`;
          break;
        case "multiselect":
          if (Array.isArray(value)) {
            const count = value.length;
            message =
              count === 0
                ? `No ${fieldName} selected`
                : count === 1
                  ? `1 ${fieldName} selected`
                  : `${count} ${fieldName} selected`;
          }
          break;
        case "select":
          message = `${fieldName} changed to ${value}`;
          break;
        default:
          if (typeof value === "string") {
            if (value.length === 0) {
              message = `${fieldName} cleared`;
            } else if (value.length <= 50) {
              message = `${fieldName}: ${value}`;
            } else {
              message = `${fieldName} updated, ${value.length} characters`;
            }
          } else {
            message = `${fieldName} changed to ${value}`;
          }
      }

      announce({
        type: "custom",
        message,
        priority: "polite",
      });
    },
    [announce],
  );

  // Announce day selection changes
  const announceDayToggle = useCallback(
    (dayName: string, isSelected: boolean, totalSelected: number) => {
      const selectionStatus = isSelected ? "selected" : "deselected";
      const totalMessage =
        totalSelected === 0
          ? "No days selected"
          : totalSelected === 1
            ? "1 day selected"
            : `${totalSelected} days selected`;

      announce({
        type: "custom",
        message: `${dayName} ${selectionStatus}. ${totalMessage}.`,
        priority: "polite",
      });
    },
    [announce],
  );

  // Announce voice mood selection
  const announceVoiceMoodSelection = useCallback(
    (mood: VoiceMood) => {
      const moodConfig = getVoiceMoodConfig(mood);

      announce({
        type: "custom",
        message: `Voice mood selected: ${moodConfig.name}. ${moodConfig.description}`,
        priority: "polite",
      });
    },
    [announce],
  );

  // Announce form validation errors with context
  const announceValidationErrors = useCallback(
    (errors: Record<string, string>) => {
      const errorKeys = Object.keys(errors);
      const errorCount = errorKeys.length;

      if (errorCount === 0) return;

      let errorMessage = `Form has ${errorCount} error${errorCount > 1 ? "s" : ""}: `;
      const errorDescriptions: string[] = [];

      errorKeys.forEach((field) => {
        errorDescriptions.push(`${field} - ${errors[field]}`);
      });

      errorMessage += errorDescriptions.join(", ");

      announce({
        type: "error",
        message: errorMessage,
        priority: "assertive",
      });
    },
    [announce],
  );

  // Announce successful form submission
  const announceFormSuccess = useCallback(
    (action: "create" | "update", itemType: string = "item") => {
      const actionText = action === "create" ? "created" : "updated";
      announce({
        type: "success",
        message: `${itemType} ${actionText} successfully.`,
        priority: "polite",
      });
    },
    [announce],
  );

  // Announce form cancellation
  const announceFormCancel = useCallback(
    (itemType: string = "form") => {
      announce({
        type: "custom",
        message: `${itemType} cancelled. No changes were saved.`,
        priority: "polite",
      });
    },
    [announce],
  );

  // Announce focus management
  const announceFocusMove = useCallback(
    (fromField: string, toField: string, reason?: string) => {
      const reasonText = reason ? ` ${reason}` : "";
      announce({
        type: "custom",
        message: `Focus moved from ${fromField} to ${toField}${reasonText}`,
        priority: "polite",
      });
    },
    [announce],
  );

  // Announce when form is ready for input
  const announceFormReady = useCallback(
    (formTitle: string, isEditing: boolean = false) => {
      const action = isEditing ? "editing" : "creating";
      announce({
        type: "custom",
        message: `${formTitle} form ready for ${action}. Use tab to navigate between fields.`,
        priority: "polite",
      });
    },
    [announce],
  );

  // Real-time field validation announcements
  const announceFieldValidation = useCallback(
    (fieldName: string, isValid: boolean, errorMessage?: string) => {
      if (!isValid && errorMessage) {
        announceFormValidation(fieldName, isValid, errorMessage);
      } else if (isValid) {
        // Only announce success for fields that were previously invalid
        const wasInvalid = fieldValues.current[`${fieldName}_invalid`];
        if (wasInvalid) {
          announce({
            type: "custom",
            message: `${fieldName} is now valid`,
            priority: "polite",
          });
          fieldValues.current[`${fieldName}_invalid`] = false;
        }
      } else {
        // Mark field as invalid for future success announcements
        fieldValues.current[`${fieldName}_invalid`] = true;
      }
    },
    [announceFormValidation, announce],
  );

  // Click-to-hear functionality for form fields
  const announceFieldDescription = useCallback(
    (fieldName: string, value: any, description: string, options?: string) => {
      const currentValueText = value
        ? ` Current value: ${value}.`
        : " No value set.";
      const optionsText = options ? ` Available options: ${options}` : "";

      announce({
        type: "custom",
        message: `${fieldName}.${currentValueText} ${description}${optionsText}`,
        priority: "polite",
      });
    },
    [announce],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (announcementTimer.current) {
        clearTimeout(announcementTimer.current);
      }
    };
  }, []);

  return {
    announceFieldChange,
    announceDayToggle,
    announceVoiceMoodSelection,
    announceValidationErrors,
    announceFormSuccess,
    announceFormCancel,
    announceFocusMove,
    announceFormReady,
    announceFieldValidation,
    announceFieldDescription,
  };
}

export default useFormAnnouncements;
