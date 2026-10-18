import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/libs/post',
  resolve: { tsconfigPaths: true },
  test: {
    name: 'post',
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    passWithNoTests: true,
    coverage: {
      reportsDirectory: '../../coverage/libs/post',
    },
  },
})
