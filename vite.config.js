import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to recursively find all HTML files
function getHtmlEntries(dir, baseDir = dir) {
  let entries = {};
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'dist' || file === '.git' || file === '.astro' || file === '.firebase') {
      continue;
    }
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      Object.assign(entries, getHtmlEntries(fullPath, baseDir));
    } else if (file.endsWith('.html')) {
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      const name = relativePath.slice(0, -5); // remove '.html'
      entries[name] = fullPath;
    }
  }
  return entries;
}

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: getHtmlEntries(__dirname)
    }
  },
  server: {
    port: 3000,
    strictPort: true
  }
});
