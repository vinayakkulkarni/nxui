// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import oxlint from 'eslint-plugin-oxlint';

export default createConfigForNuxt({
  features: { stylistic: false, tooling: true, typescript: true },
})
  .override('nuxt/vue/rules', {
    files: ['app/pages/**/*.vue', 'app/layouts/**/*.vue', 'registry/**/*.vue'],
    rules: { 'vue/multi-word-component-names': 'off' },
  })
  .append({
    files: ['app/**/*.vue', 'registry/**/*.vue'],
    plugins: { 'better-tailwindcss': betterTailwindcss },
    rules: {
      'better-tailwindcss/enforce-canonical-classes': 'error',
      'better-tailwindcss/no-conflicting-classes': 'error',
      'better-tailwindcss/no-duplicate-classes': 'error',
      'better-tailwindcss/no-unnecessary-whitespace': 'error',
    },
    settings: {
      'better-tailwindcss': {
        entryPoint: 'app/assets/css/main.css',
        rootFontSize: 16,
      },
    },
  })
  .append(...oxlint.configs['flat/recommended'])
  .append({
    files: ['**/*.ts', '**/*.mts', '**/*.tsx', '**/*.vue'],
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
    },
  })
  .append({
    files: ['**/*.vue'],
    rules: {
      // oxfmt owns self-closing; keeping this on starts a formatter-vs-linter war.
      'vue/html-self-closing': 'off',
      // Vue dual-script SFCs (module `<script>` + `<script setup>`) legitimately
      // declare module-scope consts that defineProps defaults reference. The
      // import/first autofixer reorders those consts below the setup imports,
      // which breaks `defineProps()` hoisting and corrupts the component.
      'import/first': 'off',
      // Faithful WebGL ports carry upstream hex literals (0xffffff). oxfmt owns
      // number formatting, so this rule only starts a formatter-vs-linter war.
      'unicorn/number-literal-case': 'off',
    },
  });
