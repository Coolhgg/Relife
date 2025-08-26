// auto: restored by scout - verify import path
// Native Web API type - available globally
// auto: restored by scout - verify import path
// Native Web API type - available globally
// auto: restored by scout - verify import path
// Native Web API type - available globally
// auto: restored by scout - verify import path
// Native Web API type - available globally
// auto: restored by scout - verify import path
// Native Web API type - available globally
// auto: restored by scout - verify import path
// Native Web API type - available globally
// auto: restored by scout - verify import path
// Native Web API type - available globally
// auto: restored by scout - verify import path
// Native Web API type - available globally
// auto: restored by scout - verify import path
// Native Web API type - available globally
// auto: restored by scout - verify import path
// Native Web API type - available globally
// auto: restored by scout - verify import path
// Native Web API type - available globally
// auto: restored by scout - verify import path
// Native Web API type - available globally
// auto: restored by scout - verify import path
// Native Web API type - available globally
// auto: restored by scout - verify import path
// Native Web API type - available globally
// auto: restored by scout - verify import path
// Native Web API type - available globally
// auto: restored by scout - verify import path
// Native Web API type - available globally
// auto: restored by scout - verify import path
// Native Web API type - available globally
// auto: restored by scout - verify import path
// Native Web API type - available globally
// Browser API Type Definitions
// Comprehensive type definitions for Browser APIs used in the application

// Service Worker types
interface ServiceWorkerEventMap {
  message: MessageEvent;
  install: ExtendableEvent;
  activate: ExtendableEvent;
  fetch: FetchEvent;
  push: PushEvent;
  notificationclick: NotificationEvent;
  notificationclose: NotificationEvent;
  sync: SyncEvent;
}

// Enhanced Service Worker Registration
interface EnhancedServiceWorkerRegistration extends ServiceWorkerRegistration {
  sync?: SyncManager;
  periodicSync?: PeriodicSyncManager;
}

// Notification API extensions
interface NotificationOptions {
  dir?: 'auto' | 'ltr' | 'rtl';
  lang?: string;
  badge?: string;
  body?: string;
  tag?: string;
  icon?: string;
  image?: string;
  data?: any;
  vibrate?: number[];
  renotify?: boolean;
  silent?: boolean;
  sound?: string;
  noscreen?: boolean;
  sticky?: boolean;
  actions?: NotificationAction[];
  timestamp?: number;
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Storage API types
interface StorageEstimate {
  quota?: number;
  usage?: number;
  usageDetails?: {
    indexedDB?: number;
    caches?: number;
    serviceWorkerRegistrations?: number;
  };
}

interface StorageManager {
  estimate(): Promise<StorageEstimate>;
  persist(): Promise<boolean>;
  persisted(): Promise<boolean>;
}

// Background Sync API
interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface SyncEvent extends ExtendableEvent {
  tag: string;
  lastChance: boolean;
}

// Periodic Background Sync API
interface PeriodicSyncManager {
  register(tag: string, options?: PeriodicSyncOptions): Promise<void>;
  unregister(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface PeriodicSyncOptions {
  minInterval?: number;
}

// Push API types
interface PushSubscriptionOptions {
  userVisibleOnly?: boolean;
  applicationServerKey?: BufferSource | string | null;
}

interface PushSubscription {
  readonly endpoint: string;
  readonly expirationTime: number | null;
  readonly options: PushSubscriptionOptions;
  getKey(name: PushEncryptionKeyName): ArrayBuffer | null;
  toJSON(): PushSubscriptionJSON;
  unsubscribe(): Promise<boolean>;
}

interface PushSubscriptionJSON {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: Record<string, string>;
}

type PushEncryptionKeyName = 'p256dh' | 'auth';

// Web Share API
interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

interface Navigator {
  share?(data: ShareData): Promise<void>;
  canShare?(data: ShareData): boolean;
}

// Vibration API
interface Navigator {
  vibrate?(pattern: number | number[]): boolean;
}

// Wake Lock API
interface WakeLockSentinel {
  readonly type: 'screen';
  release(): Promise<void>;
  addEventListener(type: 'release', listener: () => void): void;
  removeEventListener(type: 'release', listener: () => void): void;
}

interface WakeLock {
  request(type: 'screen'): Promise<WakeLockSentinel>;
}

interface Navigator {
  wakeLock?: WakeLock;
}

// Permissions API
interface PermissionStatus extends EventTarget {
  readonly name: PermissionName;
  readonly state: 'granted' | 'denied' | 'prompt';
  onchange: ((this: PermissionStatus, ev: Event) => any) | null;
}

interface Permissions {
  query(permissionDescriptor: PermissionDescriptor): Promise<PermissionStatus>;
}

interface PermissionDescriptor {
  name: PermissionName;
}

type PermissionName =
  | 'camera'
  | 'microphone'
  | 'notifications'
  | 'push'
  | 'geolocation'
  | 'accelerometer'
  | 'ambient-light-sensor'
  | 'background-sync'
  | 'clipboard-read'
  | 'clipboard-write'
  | 'gyroscope'
  | 'magnetometer'
  | 'persistent-storage';

interface Navigator {
  permissions?: Permissions;
}

// Broadcast Channel API
declare class BroadcastChannel extends EventTarget {
  constructor(name: string);
  readonly name: string;
  onmessage: ((this: BroadcastChannel, ev: MessageEvent) => any) | null;
  onmessageerror: ((this: BroadcastChannel, ev: MessageEvent) => any) | null;
  close(): void;
  postMessage(message: any): void;
}

// IndexedDB enhanced types
interface IDBDatabase {
  createObjectStore(name: string, options?: IDBObjectStoreParameters): IDBObjectStore;
  deleteObjectStore(name: string): void;
  transaction(storeNames: string | string[], mode?: IDBTransactionMode): IDBTransaction;
  close(): void;
  addEventListener<K extends keyof IDBDatabaseEventMap>(
    type: K,
    listener: (this: IDBDatabase, ev: IDBDatabaseEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
}

// Device Memory API
interface Navigator {
  deviceMemory?: number;
}

// Network Information API
interface Connection {
  readonly effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  readonly type:
    | 'bluetooth'
    | 'cellular'
    | 'ethernet'
    | 'none'
    | 'wifi'
    | 'wimax'
    | 'other'
    | 'unknown';
  readonly downlink: number;
  readonly downlinkMax: number;
  readonly rtt: number;
  readonly saveData: boolean;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

interface Navigator {
  connection?: Connection;
}

// Screen Wake Lock API
interface ScreenWakeLock {
  request(): Promise<WakeLockSentinel>;
}

interface Navigator {
  wakeLock?: ScreenWakeLock;
}

// Declare global extensions
declare global {
  interface Window {
    BroadcastChannel: typeof BroadcastChannel;
  }

  interface Navigator {
    storage?: StorageManager;
    serviceWorker: ServiceWorkerContainer;
    share?: (data: ShareData) => Promise<void>;
    canShare?: (data: ShareData) => boolean;
    vibrate?: (pattern: number | number[]) => boolean;
    wakeLock?: WakeLock;
    permissions?: Permissions;
    connection?: Connection;
    deviceMemory?: number;
  }

  interface ServiceWorkerContainer {
    ready: Promise<ServiceWorkerRegistration>;
    controller: ServiceWorker | null;
    register(
      scriptURL: string,
      options?: RegistrationOptions
    ): Promise<ServiceWorkerRegistration>;
    getRegistration(scope?: string): Promise<ServiceWorkerRegistration | undefined>;
    getRegistrations(): Promise<ServiceWorkerRegistration[]>;
    addEventListener<K extends keyof ServiceWorkerContainerEventMap>(
      type: K,
      listener: (
        this: ServiceWorkerContainer,
        ev: ServiceWorkerContainerEventMap[K]
      ) => any,
      options?: boolean | AddEventListenerOptions
    ): void;
  }

  const BroadcastChannel: {
    prototype: BroadcastChannel;
    new (name: string): BroadcastChannel;
  };
}

export {};
