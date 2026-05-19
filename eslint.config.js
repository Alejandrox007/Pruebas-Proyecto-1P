const js = require('@eslint/js');

module.exports = {
  files: ['src/**/*.js'],

  languageOptions: {
    ecmaVersion: 2021,
    sourceType: 'commonjs',
    globals: {
      __dirname: 'readonly',
      __filename: 'readonly',
      require: 'readonly',
      module: 'readonly',
      console: 'readonly'
    }
  },

  rules: {
    ...js.configs.recommended.rules,
    semi: ['error', 'always'],
    quotes: ['error', 'single'],
    'no-console': ['error', { allow: [ 'error' ] }],
    eqeqeq: ['error'],
    camelcase: ['error'],
    'no-unused-vars': ['error'],
    'max-lines-per-function': ['error', { max: 130, skipBlankLines: true, skipComments: true }]
  }
};
