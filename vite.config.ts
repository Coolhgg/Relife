import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
// import { visualizer } from 'rollup-plugin-visualizer'
import type { PluginOption } from "vite";
// import { splitVendorChunkPlugin } from 'vite' // Not available in current Vite version

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Note: fastRefresh is enabled by default in newer versions
      // Enable JSX runtime optimizations
      jsxRuntime: "automatic",
    }),
    // Note: splitVendorChunkPlugin not available in current Vite version
    // Bundle analyzer (disabled temporarily due to compatibility issue)
    // ...(process.env.ANALYZE ? [visualizer({
    //   filename: 'dist/stats.html',
    //   open: true,
    //   gzipSize: true,
    //   brotliSize: true,
    // }) as PluginOption] : []),
  ],

  // Resolve configuration
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@components": resolve(__dirname, "./src/components"),
      "@utils": resolve(__dirname, "./src/utils"),
      "@services": resolve(__dirname, "./src/services"),
      "@hooks": resolve(__dirname, "./src/hooks"),
      "@types": resolve(__dirname, "./src/types"),
    },
  },

  // Development server optimization
  server: {
    port: 5173,
    host: true,
    // Pre-transform known dependencies
    preTransformRequests: true,
  },

  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
  },

  // Build optimization
  build: {
    // Target modern browsers for better optimization
    target: ["es2020", "chrome80", "firefox78", "safari13"],

    // Output directory
    outDir: "dist",

    // Generate sourcemaps for debugging
    sourcemap: process.env.NODE_ENV === "development",

    // Minification
    minify: "esbuild",

    // CSS code splitting
    cssCodeSplit: true,

    // Report compressed file sizes
    reportCompressedSize: true,

    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,

    // Rollup options for advanced optimization
    rollupOptions: {
      output: {
        // Manual chunk splitting for optimal loading
        manualChunks: {
          // Core React libraries
          "react-vendor": ["react", "react-dom"],

          // UI libraries
          "ui-vendor": ["@headlessui/react", "framer-motion"],

          // Utility libraries
          "utils-vendor": ["date-fns", "lodash-es", "uuid"],

          // Database and API
          "api-vendor": ["@supabase/supabase-js", "axios"],

          // PWA and service worker
          "pwa-vendor": ["workbox-window", "workbox-core"],
        },

        // File naming patterns
        chunkFileNames: "js/[name]-[hash].js",
        entryFileNames: "js/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split(".") || [];
          let extType = info[info.length - 1] || "";

          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = "img";
          } else if (/woff|woff2/i.test(extType)) {
            extType = "fonts";
          }

          return `${extType}/[name]-[hash][extname]`;
        },
      },

      // External dependencies (don't bundle)
      external: [],

      // Tree shaking configuration
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
      },
    },

    // Enable modern browser features
    modulePreload: {
      polyfill: true,
    },

    // CSS optimization
    cssTarget: ["chrome80", "firefox78", "safari13"],

    // Note: Using esbuild for minification, so no terser options needed
  },

  // Optimization settings
  optimizeDeps: {
    // Include dependencies that need pre-bundling
    include: [
      "react",
      "react-dom",
      "@headlessui/react",
      "framer-motion",
      "date-fns",
      "@supabase/supabase-js",
    ],

    // Exclude dependencies from pre-bundling
    exclude: [],

    // ESBuild options
    esbuildOptions: {
      target: "es2020",
      supported: {
        "dynamic-import": true,
        "import-meta": true,
      },
    },
  },

  // ESBuild configuration
  esbuild: {
    // Target for JavaScript transformation
    target: "es2020",

    // Drop console and debugger in production
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],

    // JSX configuration
    jsx: "automatic",

    // Enable tree shaking for better bundle size
    treeShaking: true,

    // Legal comments
    legalComments: "none",
  },

  // CSS configuration
  css: {
    // CSS modules
    modules: {
      generateScopedName: "[name]__[local]___[hash:base64:5]",
    },

    // PostCSS configuration
    postcss: {
      plugins: [
        // Add autoprefixer and other PostCSS plugins here if needed
      ],
    },

    // Dev sourcemaps
    devSourcemap: true,
  },

  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __PROD__: JSON.stringify(process.env.NODE_ENV === "production"),
  },

  // Environment variables
  envPrefix: ["VITE_", "REACT_APP_"],

  // JSON handling
  json: {
    namedExports: true,
    stringify: false,
  },

  // Worker configuration
  worker: {
    format: "es",
    plugins: () => [],
  },
});
