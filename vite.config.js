/**
 * Vite configuration for Kana Pop!
 */

export default {
  // Base public path when served in production
  base: '/kana-pop/',
  
  // Build output configuration
  build: {
    // Output directory (relative to project root)
    outDir: 'dist',
    
    // Empty the outDir on build
    emptyOutDir: true,
    
    // Generate sourcemaps for debugging
    sourcemap: true,
    
    // Avoid excessive chunking for small project
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  
  // Development server options
  server: {
    // Automatically open browser on server start
    open: true,
    
    // Allow access from other devices on local network
    host: true
  },
  
  // Plugin options
  plugins: []
}
