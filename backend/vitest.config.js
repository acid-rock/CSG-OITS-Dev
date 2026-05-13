import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.js'],
      exclude: ['src/server.js'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
      },
    },
    testTimeout: 10000,
  },
});
