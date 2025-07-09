#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copied: ${srcPath} → ${destPath}`);
    }
  }
}

// Copy templates to dist directory for production
const srcDir = path.join(process.cwd(), 'server/templates');
const destDir = path.join(process.cwd(), 'dist/templates');

try {
  if (fs.existsSync(srcDir)) {
    copyDir(srcDir, destDir);
    console.log('📁 Templates copied successfully to dist/templates/');
  } else {
    console.log('⚠️  Source templates directory not found:', srcDir);
  }
} catch (error) {
  console.error('❌ Error copying templates:', error);
  process.exit(1);
}