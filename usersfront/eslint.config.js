import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ['src/pages/ExtinguisherInspectionsPage.jsx'],
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^navigate$' }],
    },
  },
  {
    files: [
      'src/layouts/MainLayoutFixed.jsx',
      'src/pages/GlobalSuperAdminPage.jsx',
      'src/pages/InventoryMovementsPage.jsx',
      'src/pages/PortfolioPaymentsPage.jsx',
    ],
    rules: {
      // These effects synchronize UI/data with route/auth changes and async API results.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['src/pages/InventoryShared.jsx'],
    rules: {
      // Shared UI modules intentionally export multiple reusable components.
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['src/pages/ClientsPage.jsx'],
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^PAGE_SIZES$' }],
    },
  },
  {
    files: ['src/pages/InventoryMovementsPage.jsx'],
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^pageSize$' }],
    },
  },
  {
    files: ['src/pages/SalesPOSPage.jsx'],
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^(remaining|draft)$' }],
      // The credit lookup intentionally keys off participant ids to avoid re-fetching
      // when only the participant allocation percentage changes.
      'react-hooks/exhaustive-deps': 'off',
    },
  },
])
