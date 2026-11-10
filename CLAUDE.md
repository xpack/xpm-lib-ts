# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@.github/copilot-instructions.md

## Project

`@xpack/xpm-lib`: a TypeScript ES module (Node >= 20) with the xpm core library (package.json parsing, `xpack` section handling, actions, build configurations, Liquid template substitutions, init templates). Branches: `master` (stable), `development` (current work).

## Commands

```sh
npm run compile          # tsc --project tsconfig.json, output to dist/
npm run lint             # eslint --config config/eslint.config.js src
npm run prettier         # format src and tests (config/.prettierrc.json)
npm run fix-compile      # prettier + eslint --fix + compile
npm test                 # compile + lint, then tap with 100% coverage thresholds
npm run test-all         # tap, no coverage
npm run test-one         # single test; edit the file path in the package.json script,
                         # or run: npx tap run --reporter=tap --disable-coverage tests/tap/classes/policies.ts
```

- Tests are tap 21 `.ts` files under `tests/tap/**` (mirroring `src/`), with fixtures in `tests/fixtures` and helpers in `tests/helpers`. `.taprc` enforces 100% branch/function/line/statement coverage and `typecheck: true`. `tests/coverage-map.js` maps tests to the source files they cover.
- `dist/` is committed to git; recompile before committing source changes (the history has separate "dist update" commits).
- `package.json` top-level scripts such as `generate-top-commons` come from shared `@xpack/npm-packages-helper` tooling; the `website/` folder is a generated Docusaurus site.

## Architecture

Detailed notes are in [src/README.md](src/README.md); the key ideas:

- **Two-phase lazy evaluation.** `Actions` and `BuildConfigurations` collections are first `initialise()`d, which only expands the template *names* using matrix parameters. Each individual `Action`/`BuildConfiguration` obtained with `get()` must itself be `initialise()`d before its content, inheritance and substitutions are evaluated. Classes use a constructor + async `initialise(): Promise<boolean>` pattern guarded by `_isInitialised`.
- **Matrix expansion.** `TemplateExpander` with `CombinationsGenerator` (cartesian product) and `functions/matrix-expander.ts` turn a `{ matrix, template }` entry into many concrete named items.
- **Liquid substitutions.** `LiquidEngine` (custom filters) and `LiquidPropertiesDrop`/`LiquidMatrixDrop` provide strict-variable access. Variables are layered: `data/substitutions-variables.ts` base (`env`, `os`, `path`) → `DataModel` (adds `package`, `properties`) → each `BuildConfiguration`/`Action` (adds `configuration`, merged inherited `properties`, `matrix`).
- **Build configuration inheritance.** Configurations may inherit from several others, with circular-reference detection and property merging (`classes/build-configurations.ts`, the largest file).
- **Dependency injection.** Classes take engine, substitution variables and a `@xpack/logger` `log` via constructor parameter objects; no singletons.
- **Errors.** Use the hierarchy in `classes/errors.ts` (`JsonSyntaxError`, `ConfigurationError`, `TemplateError`, `InputError`, `PrerequisitesError`, `OutputError`).
- Public API is exported only through `src/index.ts`; imports use explicit `.js` extensions (ESM).
