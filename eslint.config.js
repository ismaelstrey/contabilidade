import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  // Configuração base do JavaScript
  js.configs.recommended,
  
  // Configuração para arquivos TypeScript
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json'
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        crypto: 'readonly',
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        atob: 'readonly',
        btoa: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      // Regras básicas do JavaScript desabilitadas para TypeScript
      'no-unused-vars': 'off',
      'no-undef': 'off',
      
      // Regras de tipagem rigorosa do TypeScript
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { 
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_'
      }],
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-var-requires': 'error',
      
      // Regras de qualidade de código
      'no-console': 'warn',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': 'error',
      'curly': 'error',
      
      // Regras específicas para evitar erros comuns
      'no-duplicate-imports': 'error',
      'no-unreachable': 'error',
      'no-constant-condition': 'error'
    }
  },
  
  // Ignorar arquivos específicos
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.wrangler/**',
      '*.js',
      '*.d.ts',
      'worker-configuration.d.ts',
      'migrations/**',
      'tests/**',
      'openapi-schema.json',
      'openapi-updated.json',
      '*.config.js',
      '*.config.mjs',
      'wrangler.toml',
      'wrangler.jsonc'
    ]
  }
];