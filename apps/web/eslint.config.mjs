import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
  {
    rules: {
      // Supabase nested relation responses are not fully inferred without generated DB types.
      // Keep these visible as warnings while the generated schema types are introduced.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];

export default eslintConfig;
