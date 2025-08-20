/**
 * Mock Service Worker (MSW) setup for testing
 * Configures API mocking for comprehensive hook testing
 */

import { beforeAll, afterEach, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { handlers } from "./msw-handlers";

// Setup MSW server
export const server = setupServer(...handlers);

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: "warn", // Warn about unhandled requests instead of erroring
  });
});

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => {
  server.resetHandlers();
});

// Clean up after the tests are finished
afterAll(() => {
  server.close();
});

// Helper functions for tests
export const mockApiError = (
  endpoint: string,
  status: number = 500,
  message: string = "Server Error",
) => {
  server.use(
    http.all(endpoint, () => {
      return HttpResponse.json({ error: message }, { status });
    }),
  );
};

export const mockApiDelay = (endpoint: string, delay: number = 1000) => {
  server.use(
    http.all(endpoint, async () => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return HttpResponse.json({ success: true });
    }),
  );
};

export const mockApiSuccess = (endpoint: string, data: any) => {
  server.use(
    http.all(endpoint, () => {
      return HttpResponse.json(data);
    }),
  );
};

// Export server for use in specific tests
export { server as mswServer };
