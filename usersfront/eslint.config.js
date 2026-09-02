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
    files: [
      'src/pages/ExtinguishersPage.jsx',
      'src/pages/ExtinguisherTypesPage.jsx',
      'src/pages/ExtinguisherInspectionsPage.jsx',
      'src/pages/ExtinguisherInspectionItemsPage.jsx',
      'src/pages/PermisosPage.jsx',
      'src/pages/RolesPage.jsx',
      'src/pages/TenantAdminPage.jsx',
      'src/pages/TenantConfigPage.jsx',
      'src/components/UserRolesModal.jsx',
      'src/contexts/AuthContext.jsx',
      'src/contexts/TenantConfigContext.jsx',
      'src/layouts/MainLayoutFixed.jsx',
    ],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['src/contexts/AuthContext.jsx', 'src/contexts/TenantConfigContext.jsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['src/contexts/AuthContext.jsx'],
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^obtenerSesionesTenants$' }],
    },
  },
  {
    files: ['src/pages/TenantConfigPage.jsx'],
    rules: {
      'no-useless-catch': 'off',
    },
  },
  {
    files: ['src/pages/ExtinguisherInspectionsPage.jsx'],
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^navigate$' }],
    },
  },
])
