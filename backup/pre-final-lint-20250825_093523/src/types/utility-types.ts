// auto: restored by scout - verify import path
import React from 'react';
// auto: restored by scout - verify import path
import React from 'react';
/**
 * Utility Types for TypeScript Coverage Enhancement
 *
 * These utility types help reduce 'any' usage across the codebase
 * by providing common type patterns and safer alternatives.
 */

// Basic utility types
export type Nullable<T> = T | null; // type-safe replacement for any | null
export type Optional<T> = T | undefined; // type-safe replacement for any | undefined
export type Maybe<T> = T | null | undefined; // type-safe replacement for any | null | undefined

// Record and map types
export type RecordMap<K extends string | number | symbol, V> = Record<K, V>; // type-safe replacement for Record<string, any>
export type StringMap<V> = Record<string, V>; // type-safe replacement for Record<string, any>
export type NumberMap<V> = Record<number, V>; // type-safe replacement for Record<number, any>

// Common object patterns
export type UnknownObject = Record<string, unknown>; // type-safe replacement for Record<string, any>
export type AnyObject = Record<string, any>; // TODO: type definition needed - temporary bridge type

// Event handler types
export type ChangeEventHandler<T = HTMLInputElement> = React.ChangeEventHandler<T>; // type-safe replacement for onChange: any
export type MouseEventHandler<T = HTMLElement> = React.MouseEventHandler<T>; // type-safe replacement for onClick: any
export type KeyboardEventHandler<T = HTMLElement> = React.KeyboardEventHandler<T>; // type-safe replacement for onKeyDown: any
export type FormEventHandler<T = HTMLFormElement> = React.FormEventHandler<T>; // type-safe replacement for onSubmit: any

// State setter types
export type StateUpdater<T> = React.Dispatch<React.SetStateAction<T>>; // type-safe replacement for setState: any
export type StateUpdaterFunction<T> = (prev: T) => T; // type-safe replacement for (prev: any) => any

// API response types
export interface BaseResponse {
  success: boolean;
  message?: string;
  timestamp?: string;
}

export interface ErrorResponse extends BaseResponse {
  success: false;
  _error: string;
  code?: string | number;
}

export interface SuccessResponse<T = unknown> extends BaseResponse {
  success: true;
  data: T;
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse; // type-safe replacement for Promise<any>

// Component prop types
export interface BaseProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
  'data-testid'?: string;
}

// Function types
export type VoidFunction = () => void; // type-safe replacement for Function | any
export type AsyncVoidFunction = () => Promise<void>; // type-safe replacement for async () => any
export type CallbackFunction<T = unknown> = (arg: T) => void; // type-safe replacement for callback: any
export type AsyncCallbackFunction<T = unknown> = (arg: T) => Promise<void>; // type-safe replacement for async callback: any

// Metadata and configuration types
export interface Metadata extends Record<string, unknown> {} // type-safe replacement for metadata: any
export interface Config extends Record<string, unknown> {} // type-safe replacement for config: any
export interface Settings extends Record<string, unknown> {} // type-safe replacement for settings: any

// Temporal types for migration
export type TODO_TypeDefinitionNeeded = any; // TODO: type definition needed - mark for future typing
export type Legacy_Any = any; // TODO: type definition needed - legacy any usage that needs proper typing

// API specific response types
export interface RetentionOffer {
  discountPercentage: number;
  durationMonths: number;
  message?: string;
}

export interface AlarmHistoryData {
  alarms: any[];
  totalCount: number;
  patterns?: any;
}

export interface SleepPatternData {
  averageSleepTime: string;
  averageWakeTime: string;
  efficiency: number;
  trends?: any;
}

export interface VoiceSettings {
  voiceId: string;
  speed: number;
  pitch: number;
  volume: number;
}

export interface EscalationStrategy {
  steps: any[];
  maxAttempts: number;
  intervals: number[];
}

export interface MotivationalContent {
  message: string;
  type: string;
  priority: number;
}

// Type guards
export const isNotNull = <T>(value: T | null): value is T => value !== null;
export const isNotUndefined = <T>(value: T | undefined): value is T =>
  value !== undefined;
export const isDefined = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;
