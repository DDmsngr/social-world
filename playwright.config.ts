import { defineConfig, devices } from '@playwright/test'

const PORT = 4173

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000, // сценарии ходят в реальный бэкенд по сети
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: { baseURL: `http://127.0.0.1:${PORT}/social-world/`, trace: 'retain-on-failure' },
  // dist должен быть собран заранее: npm run test:e2e делает это сам
  webServer: {
    command: 'node e2e/pages-server.mjs',
    port: PORT,
    env: { PORT: String(PORT) },
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        // Голосовые/видео (Messages.tsx, recorder.tsx) просят getUserMedia —
        // без этих флагов Chromium либо просит настоящую камеру, либо просто
        // отказывает без диалога, которым в headless некому ответить.
        permissions: ['microphone', 'camera'],
        launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] },
      },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grepInvert: /@desktop-only/ },
  ],
})
