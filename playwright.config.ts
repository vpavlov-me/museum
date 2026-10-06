import { defineConfig, devices } from '@playwright/test'

/*
 * End-to-end tests against the profile build: a production build that keeps the debug
 * bridge (window.__museum), so tests can walk, look and step frames. Chromium renders
 * WebGL in software (SwiftShader), which is slow: the suite steps frames by hand rather
 * than waiting for real time, and the guided tour runs with reduced motion (cuts).
 *
 *   npm run build:profile && npm test     locally
 *   npm run test:ci                       builds, serves and tests
 */

const PORT = 4175

export default defineConfig({
  testDir: 'e2e',
  timeout: 6 * 60_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    launchOptions: {
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
      // A local Chromium can stand in for Playwright's own download (e.g. a sandbox without it).
      executablePath: process.env.MUSEUM_CHROMIUM || undefined,
    },
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 760 } }, testIgnore: /guided/ },
    { name: 'phone', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium', deviceScaleFactor: 1 }, testMatch: /guided/ },
  ],
  webServer: {
    command: `npx vite preview --outDir dist-profile --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
