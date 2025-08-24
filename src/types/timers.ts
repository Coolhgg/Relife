/**
 * Timer Types Utility
 *
 * This file provides cross-platform timer types that work consistently
 * across Node.js and browser environments.
 */

// Normalize timeout handle type across environments
export type TimeoutHandle = ReturnType<typeof setTimeout>;

// Helper type for optional timeout handles
export type MaybeTimeoutHandle = TimeoutHandle | undefined;

/**
 * Clear a timeout safely, handling undefined values
 * @param handle TimeoutHandle or undefined
 */
export function safeClearTimeout(handle: MaybeTimeoutHandle): void {
  if (handle !== undefined) {
    clearTimeout(handle);
  }
}

/**
 * Set a timeout with proper typing
 * @param callback Function to execute
 * @param delay Delay in milliseconds
 * @returns TimeoutHandle
 */
export function safeSetTimeout(callback: (
) => void, delay: number): TimeoutHandle {
  return setTimeout(callback, delay);
}
