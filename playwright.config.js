import { defineConfig } from '@playwright/test';
import fs from 'node:fs';

const chromeBeta = '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta';
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: process.env.AFTERGLOW_BASE_URL || 'http://127.0.0.1:8000',
    viewport: { width: 1440, height: 900 },
    launchOptions: { executablePath: process.env.CHROME_PATH || (fs.existsSync(chromeBeta) ? chromeBeta : undefined) },
    screenshot: 'only-on-failure'
  },
  webServer: process.env.AFTERGLOW_BASE_URL ? undefined : {
    command: 'python3 -m http.server 8000 --bind 127.0.0.1',
    url: 'http://127.0.0.1:8000',
    reuseExistingServer: !process.env.CI
  }
});
