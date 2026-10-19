import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/simplefeed',
  resolve: { tsconfigPaths: true },
  test: {
    name: 'simplefeed',
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    passWithNoTests: true,
    // the API suites share one database
    fileParallelism: false,
    testTimeout: 15000,
    coverage: {
      reportsDirectory: '../../coverage/apps/simplefeed',
    },
  },
})
