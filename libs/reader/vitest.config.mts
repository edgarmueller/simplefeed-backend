import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/libs/reader',
  resolve: { tsconfigPaths: true },
  test: {
    name: 'reader',
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    passWithNoTests: true,
    coverage: {
      reportsDirectory: '../../coverage/libs/reader',
    },
  },
})
