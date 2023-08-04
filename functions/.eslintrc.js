module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    "ecmaVersion": 2018,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": ["error", "double", {"allowTemplateLiterals": true}],

  },

  overrides: [
    // Next.js needs default exports for pages and API points
    {
      files: ["pages/*', 'pages/api/*"],
      rules: {
        "import/no-default-export": "off",
      },
    },
  ],
  globals: {},
};
