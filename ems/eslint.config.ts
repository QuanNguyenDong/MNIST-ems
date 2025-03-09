export default {
  languageOptions: {
    parser: "@typescript-eslint/parser",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  plugins: {
    prettier: require("eslint-plugin-prettier"),
    "@typescript-eslint": require("@typescript-eslint/eslint-plugin"),
    react: require("eslint-plugin-react"),
  },
  extends: [
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  rules: {
    "react/prop-types": "off",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "prettier/prettier": [
      "error",
      {
        singleQuote: true,
        semi: false,
        trailingComma: "all",
      },
    ],
  },
};
