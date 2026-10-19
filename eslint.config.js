import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-typescript'
import eslintConfigPrettier from '@vue/eslint-config-prettier'

/**
 * De qué otros dominios puede importar cada dominio de `src/` (ADR 0000).
 * Los imports entre dominios van siempre por `@/<dominio>/...`.
 */
const DOMAIN_DEPENDENCIES = {
  core: [],
  map: ['core', 'forms'],
  charts: ['core'],
  table: ['core'],
  forms: ['core'],
  detail: ['core', 'forms', 'charts'],
  layout: ['core', 'forms'],
}

const domainBoundaries = Object.entries(DOMAIN_DEPENDENCIES).map(([domain, allowed]) => {
  const forbidden = [
    ...Object.keys(DOMAIN_DEPENDENCIES).filter((d) => d !== domain && !allowed.includes(d)),
    'playground',
  ]
  return {
    files: [`src/${domain}/**/*.{ts,vue}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: forbidden.flatMap((d) => [`@/${d}`, `@/${d}/**`]),
              message: `El dominio "${domain}" solo puede importar de: ${allowed.join(', ') || 'ningún otro dominio'} (ver docs/adr/0000-estructura-paquete.md).`,
            },
          ],
        },
      ],
    },
  }
})

export default [
  {
    ignores: ['dist/**', 'dist-playground/**', 'coverage/**', 'node_modules/**', '*.d.ts'],
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  ...vueTsEslintConfig(),
  eslintConfigPrettier,
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Los tests montan componentes auxiliares junto al que prueban.
    files: ['**/*.spec.ts'],
    rules: { 'vue/one-component-per-file': 'off' },
  },
  {
    // Scripts de Node (p. ej. scripts/check-entries.mjs).
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: { console: 'readonly', process: 'readonly' } },
  },
  ...domainBoundaries,
]
