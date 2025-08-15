/// <reference types="vite/client" />
/// <reference types="@testing-library/jest-dom" />

// Cloudflare Workers Global Types
declare global {
  type D1Database = import('./types/index').D1Database;
  type KVNamespace = import('./types/index').KVNamespace;
  type R2Bucket = import('./types/index').R2Bucket;
}
