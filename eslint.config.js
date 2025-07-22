import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['packages/**/node_modules/', 'packages/**/*.d.ts'],
  },
  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommended, prettier],
  }
);
