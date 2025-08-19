import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./src/test-setup.ts"],
    include: [
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    exclude: [
      "node_modules",
      "dist",
      "build",
      "android",
      "ios",
      ".next",
      "coverage",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov", "html", "json"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx,js,jsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/index.tsx",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/**/__tests__/**",
        "src/**/__mocks__/**",
        "src/**/*.test.{ts,tsx,js,jsx}",
        "src/**/*.spec.{ts,tsx,js,jsx}",
        "src/test-setup.ts",
        "src/**/*.stories.{ts,tsx,js,jsx}",
        "src/**/index.{ts,tsx,js,jsx}",
        "src/config/**",
        "src/types/**",
      ],
      thresholds: {
        global: {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    // ESM support is built-in with Vitest
    server: {
      deps: {
        // Mock modules that need special handling
        inline: [
          "@testing-library/jest-dom",
          "posthog-js",
          "@sentry/react",
          "@supabase/supabase-js",
          "@stripe/stripe-js",
          "@capacitor/core",
          "@capacitor/device",
          "@capacitor/haptics",
          "@capacitor/local-notifications",
          "@capacitor/preferences",
          "@capacitor/push-notifications",
          "lucide-react",
          "date-fns",
          "recharts",
          "react-day-picker",
          "framer-motion",
          "embla-carousel-react",
          "vaul",
          "sonner",
          "cmdk",
          "next-themes",
          "class-variance-authority",
          "tailwind-merge",
          "i18next",
          "react-i18next",
        ],
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@components": resolve(__dirname, "./src/components"),
      "@services": resolve(__dirname, "./src/services"),
      "@utils": resolve(__dirname, "./src/utils"),
      "@types": resolve(__dirname, "./src/types"),
      "@hooks": resolve(__dirname, "./src/hooks"),
      "@contexts": resolve(__dirname, "./src/contexts"),
      "@config": resolve(__dirname, "./src/config"),
      "@assets": resolve(__dirname, "./src/assets"),
      "@data": resolve(__dirname, "./src/data"),
      "@lib": resolve(__dirname, "./src/lib"),
      "@backend": resolve(__dirname, "./src/backend"),
    },
  },
});
