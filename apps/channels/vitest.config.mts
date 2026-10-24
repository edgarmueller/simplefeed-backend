import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/channels',
  resolve: { tsconfigPaths: true },
  test: {
    name: 'channels',
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    passWithNoTests: true,
    coverage: {
      reportsDirectory: '../../coverage/apps/channels',
    },
  },
})
