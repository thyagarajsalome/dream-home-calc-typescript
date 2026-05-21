// scripts/cleanup-html.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const pathsToDelete = [
  'index.html',
  '404.html',
  'plans',
  'directory',
  'signin',
  'signup',
  'upgrade',
  'register-pro',
  'privacy',
  'terms',
  'contact',
  'disclaimer',
  'dashboard',
  'cost'
];

pathsToDelete.forEach(p => {
  const fullPath = path.join(projectRoot, p);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`Cleaned up folder: ${p}`);
    } else {
      fs.unlinkSync(fullPath);
      console.log(`Cleaned up file: ${p}`);
    }
  }
});

console.log("HTML Cleanup post-build script finished successfully!");
