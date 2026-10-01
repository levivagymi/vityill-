import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    environment: 'node',
    // Explicit, so stray git worktrees under .worktrees/ and .claude/ are
    // never collected as a second copy of the suite.
    include: ['lib/**/*.test.ts'],
  },
})
