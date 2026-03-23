import { defineConfig } from "eslint/config";
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactPlugin from 'eslint-plugin-react';
import babelParser from "@babel/eslint-parser";
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';

export default defineConfig([
  {
    ignores: [      
      '**/node_modules',
      '**/build',
      '**/dist/**/*.js',
      '**/coverage/**/*.js',
      '**/public',
      '*.min.js',
      '*.config.js',
      '.vscode',
      '.DS_Store',
      '*.test.js',
      "**/*.config.js",
      ".scannerwork/**"
    ],
    files: ["**/*.js"],
    plugins: {
      'react-hooks': reactHooksPlugin,
      'react': reactPlugin,
      'jsx-a11y': jsxA11yPlugin,
      'import': importPlugin
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        node: {
          moduleDirectory: [
            'node_modules',
            'src'
          ],
          extensions: ['.js', '.jsx'],
        },
      },
    },
    rules: {
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/prop-types': 'off',

      //Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      'import/order': [
        'warn',
        {
          groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']],
        },
      ],

      /**Variables*/
      "semi": "error",
      "no-unused-vars": "error",

      // /** Style */
      indent: [2, 2, {               // http://eslint.org/docs/rules/indent
        SwitchCase: 1
      }],
      'brace-style': [2, '1tbs', {     // http://eslint.org/docs/rules/brace-style
        allowSingleLine: true
      }],
      quotes: [2, 'single',          // http://eslint.org/docs/rules/quotes
        'avoid-escape'
      ],
      camelcase: [2, {               // http://eslint.org/docs/rules/camelcase
        properties: 'never'
      }],
      'comma-spacing': [2, {           // http://eslint.org/docs/rules/comma-spacing
        before: false,
        after: true
      }],
      'max-len': [2, { code: 120 }],
      'import/no-unresolved': 2,
      'import/named': 2,
      'import/default': 2,
      'import/no-duplicates': 2,
    },    
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
      },
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          babelrc: false,
          configFile: './babel.jest.config.json',
        },
        ecmaFeatures: {
          arrowFunctions: true,
          blockBindings: true,
          classes: true,
          defaultParams: true,
          destructuring: true,
          forOf: true,
          generators: false,
          modules: true,
          objectLiteralComputedProperties: true,
          objectLiteralDuplicateProperties: false,
          objectLiteralShorthandMethods: true,
          objectLiteralShorthandProperties: true,
          spread: true,
          superInFunctions: true,
          templateStrings: true,
          jsx: true
        }
      }
    }
  },
  // Specific rules for test files
  {    
    files: ["**/*.test.js"],
    rules: {
      "max-len": "off",
      "import/named": "off"
    },
    },
]);
