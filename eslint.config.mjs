import studio from '@sanity/eslint-config-studio'
import globals from 'globals'

export default [
  ...studio,
  {
    // Node one-off scripts (.mjs/.cjs): the studio config only knows browser globals.
    files: ['scripts/**/*.mjs', 'scripts/**/*.cjs'],
    languageOptions: {globals: {...globals.node}},
  },
  {
    // Seed scripts pair a type with a same-named constructor (`type Li` + `function Li`),
    // which is TypeScript declaration merging, not a redeclaration.
    files: ['scripts/**/*.ts'],
    rules: {'typescript/no-redeclare': 'off'},
  },
]
