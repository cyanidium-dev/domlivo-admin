import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    include: ['scripts/parser/__tests__/**/*.test.ts'],
    environment: 'node',
  },
})
