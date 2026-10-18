import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/libs/search',
  resolve: { tsconfigPaths: true },
  test: {
    name: 'search',
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    passWithNoTests: true,
    coverage: {
      reportsDirectory: '../../coverage/libs/search',
    },
  },
})
