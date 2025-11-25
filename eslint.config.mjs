import js from "@eslint/js";
import globals from "globals";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import unicornPlugin from "eslint-plugin-unicorn";
import prettierPlugin from "eslint-plugin-prettier";
import { defineConfig } from "eslint/config";

export default defineConfig({
  files: ["src/**/*.{js,ts,jsx,tsx}", "pages/**/*.{js,ts,jsx,tsx}"],
  ignores: ["node_modules/**", ".next/**", "dist/**"],

  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      ecmaFeatures: { jsx: true },
    },
    globals: { ...globals.browser, ...globals.node },
  },

  plugins: {
    react: reactPlugin,
    "@typescript-eslint": tsPlugin,
    unicorn: unicornPlugin,
    prettier: prettierPlugin,
  },

  rules: {
    ...tsPlugin.configs.recommended.rules,
    ...reactPlugin.configs.recommended.rules,
    ...unicornPlugin.configs.recommended.rules,

    'unicorn/no-null': 'off',
    "react/react-in-jsx-scope": "off",
    "react/no-unescaped-entities": "warn",
    "react/prop-types": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^__Unused$", caughtErrorsIgnorePattern: "^_" }],
    "@typescript-eslint/ban-ts-comment": ["warn", { "ts-ignore": "allow-with-description" }],
    "@typescript-eslint/no-empty-object-type": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "prettier/prettier": "error"
  },

  settings: {
    react: { version: "detect" },
  },
});
