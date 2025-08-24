/**
 * Utility types for Phase 2B TypeScript implicit any parameter fixes
 * These types provide safe fallbacks for common patterns where exact types are unknown
 */

export type AnyFn = (...args: any[]) => any; // auto

export type Maybe<T> = T | undefined | null;

export type EventHandler<T = any> = (e: T) => void; // auto

export type CallbackFunction<T = any> = (value: T) => void; // auto

export type AsyncCallback<T = any> = (value: T) => Promise<void>; // auto

export type ErrorCallback = (error: Error | any) => void; // auto

export type GenericObject = Record<string, any>; // auto

export type SafeAny = any; // auto - temporary fallback for complex inference
