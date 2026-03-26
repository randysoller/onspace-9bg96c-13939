import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Bundle analyzer can be added with: npm install -D rollup-plugin-visualizer
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // CRITICAL FIX: Force single React instance across all dependencies
    // This prevents the "dispatcher is null" error caused by multiple React versions
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  optimizeDeps: {
    // CRITICAL: Pre-bundle and dedupe React during dev
    // This ensures consistent React instance between dev and build
    include: ['react', 'react-dom', 'react-router-dom'],
    force: true, // Force re-optimization to clear any cached duplicates
  },
  build: {
    // Optimize bundle size
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Group node_modules by type
          if (id.includes('node_modules')) {
            // React core - MUST be in one chunk to prevent duplication
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // UI libraries
            if (id.includes('lucide-react') || id.includes('sonner') || id.includes('framer-motion')) {
              return 'ui-vendor';
            }
            // Charts
            if (id.includes('recharts')) {
              return 'charts-vendor';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
          }
        },
      },
    },
    // Enable minification with esbuild (default, faster than terser)
    minify: 'esbuild',
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Source maps for production debugging (optional)
    sourcemap: false,
    // Clear output directory before build
    emptyOutDir: true,
  },
});
