#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the file to check from command line args
const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node scripts/check-file.js <path-to-file>');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

// Create a temporary tsconfig that only includes the target file
const tempConfigPath = path.join(__dirname, '../temp-tsconfig.json');

const tempConfig = {
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": false
  },
  "include": [
    filePath,
    // Include essential type definitions
    "vitest.d.ts",
    "next-env.d.ts"
  ]
};

try {
  // Write temporary config
  fs.writeFileSync(tempConfigPath, JSON.stringify(tempConfig, null, 2));
  
  // Run TypeScript check
  console.log(`🔍 Checking TypeScript errors in: ${filePath}`);
  execSync(`npx tsc --noEmit --project ${tempConfigPath}`, { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log(`✅ No TypeScript errors found in: ${filePath}`);
  
} catch (error) {
  console.log(`❌ TypeScript errors found in: ${filePath}`);
  process.exit(1);
} finally {
  // Clean up temporary config
  if (fs.existsSync(tempConfigPath)) {
    fs.unlinkSync(tempConfigPath);
  }
}