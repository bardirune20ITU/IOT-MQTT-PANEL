import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
    'process.env': {}
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          chart: ["chart.js", "react-chartjs-2"],
          motion: ["framer-motion"],
          mqtt: ["mqtt"]
        }
      }
    }
  }
});
