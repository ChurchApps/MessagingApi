module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'prettier',
  ],
  rules: {
    'no-console': 'error',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    'prettier/prettier': 'off',
    'no-case-declarations': 'off',
    'no-useless-catch': 'off',
  },
  env: {
    node: true,
    es6: true,
  },
  ignorePatterns: [
    'dist/**/*',
    'node_modules/**/*',
    'layer/**/*',
    '*.js',
  ],
};