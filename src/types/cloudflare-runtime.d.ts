/**
 * Minimal Cloudflare Runtime Type Stubs
 *
 * This file provides minimal ambient declarations to avoid compile errors
 * when @cloudflare/workers-types isn't present in the runtime environment.
 * These are non-runtime stubs for TypeScript compilation only.
 */

// Minimal CF runtime stubs (non-runtime)
declare global {
  interface D1Database {
    prepare(query: string): {
      bind(...args: any[]): any;
      first<T = any>(): Promise<T | null>;
      all<T = any>(): Promise<{ results: T[] }>;
    };
  }

  interface KVNamespace {
    get(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<any>;
    put(
      key: string,
      value: string | ArrayBuffer | ReadableStream,
      options?: any
    ): Promise<void>;
    delete(key: string): Promise<void>;
  }

  interface DurableObjectNamespace {
    idFromName(name: string): any;
    get(id: any): any;
  }
}

export {};
