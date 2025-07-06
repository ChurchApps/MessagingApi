module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  env: {
    node: true,
    es6: true
  },
  rules: {
    // TypeScript-specific rules
    '@typescript-eslint/no-unused-vars': [
      'warn', 
      { 
        argsIgnorePattern: '^_|^req$|^res$|^au$|^ex$|^e$|^bind$',
        varsIgnorePattern: '^_|^start$|^result$|^app$',
        caughtErrorsIgnorePattern: '^_'
      }
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-require-imports': 'error',
    '@typescript-eslint/no-inferrable-types': 'off',
    
    // General rules
    'no-console': 'error',
    'prefer-const': 'error',
    
    // Code style (enforced by Prettier, but useful for linting)
    'semi': ['error', 'always'],
    'quotes': ['error', 'double'],
    'comma-dangle': ['error', 'never']
  }
};