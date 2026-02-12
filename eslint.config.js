// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import oxlint from 'eslint-plugin-oxlint';

export default createConfigForNuxt({
  features: {
    stylistic: false,
    tooling: true,
    typescript: true,
  },
})
  .override('nuxt/vue/rules', {
    rules: {
      'vue/html-self-closing': [
        'error',
        {
          html: { normal: 'never', void: 'always', component: 'always' },
          svg: 'always',
          math: 'always',
        },
      ],
    },
  })
  .override('nuxt/vue/rules', {
    files: ['app/pages/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  })
  .override('nuxt/vue/rules', {
    files: ['app/components/ui/**/*.vue'],
    rules: {
      'vue/require-default-prop': 'off',
      'vue/one-component-per-file': 'off',
    },
  })
  .append({
    plugins: {
      'better-tailwindcss': betterTailwindcss,
    },
    rules: {
      'better-tailwindcss/no-conflicting-classes': [
        'error',
        { entryPoint: 'app/assets/css/main.css' },
      ],
      'better-tailwindcss/no-duplicate-classes': [
        'warn',
        { entryPoint: 'app/assets/css/main.css' },
      ],
      'better-tailwindcss/no-unnecessary-whitespace': [
        'warn',
        { entryPoint: 'app/assets/css/main.css' },
      ],
    },
    settings: {
      'better-tailwindcss': {
        entryPoint: 'app/assets/css/main.css',
      },
    },
  })
  .append(...oxlint.configs['flat/recommended'])
  .append({
    rules: {
      'unicorn/number-literal-case': 'off',
    },
  });
