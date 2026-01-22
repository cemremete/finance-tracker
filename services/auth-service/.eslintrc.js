module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    'no-console': 'warn',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'brace-style': ['error', '1tbs'],
    'comma-dangle': ['error', 'never'],
    'no-multiple-empty-lines': ['error', { 'max': 1 }],
    'no-trailing-spaces': 'error',
    'arrow-spacing': ['error', { 'before': true, 'after': true }],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'keyword-spacing': ['error', { 'before': true, 'after': true }],
    'space-before-blocks': 'error',
    'space-infix-ops': 'error'
  }
};
