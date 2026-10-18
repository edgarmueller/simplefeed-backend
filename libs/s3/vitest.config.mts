import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/libs/s3',
  resolve: { tsconfigPaths: true },
  test: {
    name: 's3',
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    passWithNoTests: true,
    coverage: {
      reportsDirectory: '../../coverage/libs/s3',
    },
  },
})
