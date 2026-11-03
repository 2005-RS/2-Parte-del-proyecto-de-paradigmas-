import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: process.env.WEB_URL || 'http://localhost:8080',
    ...devices['Desktop Chrome'],
  },
});
