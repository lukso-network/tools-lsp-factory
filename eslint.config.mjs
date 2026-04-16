import js from "@eslint/js";
import eslintComments from "@eslint-community/eslint-plugin-eslint-comments";
import importPlugin from "eslint-plugin-import";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{
		ignores: [
			"node_modules",
			"build",
			"coverage",
			"test",
			"jest.config.js",
			"eslint.config.mjs",
			"tmp",
		],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		plugins: {
			import: importPlugin,
			"@eslint-community/eslint-comments": eslintComments,
		},
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: "module",
			globals: {
				BigInt: "readonly",
				console: "readonly",
				WebAssembly: "readonly",
			},
		},
		settings: {
			"import/resolver": {
				typescript: true,
				node: true,
			},
		},
		rules: {
			...eslintComments.configs.recommended.rules,
			"@typescript-eslint/explicit-module-boundary-types": "off",
			"@eslint-community/eslint-comments/disable-enable-pair": [
				"error",
				{ allowWholeFile: true },
			],
			"@eslint-community/eslint-comments/no-unused-disable": "error",
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": ["error"],
			"@typescript-eslint/no-explicit-any": "off",
			"import/order": [
				"error",
				{ "newlines-between": "always", alphabetize: { order: "asc" } },
			],
			"sort-imports": [
				"error",
				{ ignoreDeclarationSort: true, ignoreCase: true },
			],
		},
	},
	prettierRecommended,
);
