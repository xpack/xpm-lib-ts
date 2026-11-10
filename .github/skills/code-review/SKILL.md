---
name: code-review
description: 'Perform a thorough, uncompromising code review of a change (uncommitted changes, a set of commits, or a path) in the xPack xpm core library (@xpack/xpm-lib): style, naming, TSDoc documentation, API and packaging, tests, and correctness. Report the problems found in a new numbered report, each with a permanent number. Use when the user asks for a "code review", to "review the code", to "review changes", or to check a file, folder, or diff before a commit.'
argument-hint: 'Optional: path, commit range, or "staged"; defaults to the uncommitted changes, or to the commits on development not yet on master'
---

# Code Review — xPack xpm Core Library

The rules for judging, tagging, numbering, and writing reports are in
`.github/skills/review-common.md`; read it first. The project
conventions are in `.github/copilot-instructions.md` and in
`src/README.md`.

## When to Use

- The user asks for a code review of a file, folder, diff, or set of
  commits.
- The user asks to check adherence to the project's coding standards
  before a commit.

This skill reviews a change against the project's conventions. The
design of the library as a whole (the public API, the packaging, the
structure) is reviewed by the `design-review` skill; suggest it when a
change raises a question of that kind, rather than extending this
review.

## Review Scope

- If the user specifies a path, review that path in full.
- If the user specifies commits or a range, review their diff
  (`git diff <range>`), reading the changed files in full for context.
- Otherwise, review the uncommitted changes (`git diff HEAD`); if the
  working tree is clean, review the commits on `development` that are
  not on `master` (`git diff master...development`).

Include the tests in `tests/tap/` that exercise the changed code, and
the parts of `package.json` that depend on it (`exports`, `main`,
`types`, `dependencies`, `scripts`, `engines`).

Do not review `dist/` (compiled output, committed separately as "dist
update"), `node_modules/`, `website/`, or the generated common files
(the workflows, and the `_common` folders under `website/`), which are
produced by `generate-top-commons`. Do not review `src/README.md`,
`src/CODE-REVIEW.md`, or `tests/CODE-REVIEW.md` as code, but note when
a change makes them stale.

State the scope, the branch, and the commit (`git rev-parse --short
HEAD`) at the top of the report.

## Checklist

Review every item below, with file and line references.

### Naming and style

- The code passes `npm run lint` (ESLint with typescript-eslint and
  prettier, `config/eslint.config.js`) and is formatted by `npm run
  prettier` (`config/.prettierrc.json`); the repository style is
  no semicolons and single quotes, as the prettier configuration
  states.
- No line exceeds 80 characters in comments, except for URLs.
- Classes, interfaces, and types are `PascalCase`; functions, methods,
  properties, and variables are `camelCase`; protected and private
  members start with an underscore (`_isInitialised`).
- Interfaces for constructor parameter objects are named
  `<Class>ConstructorParameters`, as in the existing classes.
- Method names start with a verb that states their effect; getters
  have no side effects.
- Relative imports use the `.js` extension (ES modules).
- Imports follow the existing layout: `node:` modules first, then
  packages, each with the URL comment used in the file, then the
  relative imports.
- The sections of a file use the existing separator comments
  (`// ----` and `// ====`).
- The change follows the patterns already used elsewhere in the code
  base (the two-phase initialisation, the dependency injection through
  constructor parameters, the error hierarchy), or has a visible reason
  not to.

### Documentation (TSDoc)

- Every class, method, property, parameter, and return value has a
  TSDoc comment, including `protected` and `private` members.
- The tags follow `.github/copilot-instructions.md`: `@remarks` after
  the summary (why the member is useful, how to use it, then notes),
  `@param` before `@returns`, and a blank line before `@throws {@link
  Name}` with the description on the next line; no `@public` or
  `@internal`; no `@throws` for assertions; HTML lists (`<ol>`, `<ul>`,
  `<li>`, with `<b>`, `<i>`, `<code>`) inside `@remarks` lists.
- The comments are acceptable to API Extractor (valid `{@link}`
  targets, no unknown tags).
- Examples in the comments are valid and still match the signature.
- Comments use British English spelling ("behaviour", "initialise"),
  formal wording, no contractions, the Oxford comma, and "folder"
  rather than "directory".
- Existing documentation is reviewed: improve it where it is vague,
  repeats the signature, or is out of date with the change.
- The file header carries the xPack MIT licence block, with a
  plausible copyright year range.

### API and packaging

- A new public member is exported through `src/index.ts`; nothing that
  should be private is exported; `liquidjs` is deliberately not
  re-exported.
- A change to a name, a signature, an exported type, a substitution
  variable, a Liquid filter, an inheritance or matrix rule, or an error
  class is a change of the contract with the users; flag it as
  **[breaking]**.
- `package.json` stays consistent with the code: `exports`, `main`,
  and `typings` point to files that exist after `npm run compile`; a
  new runtime import in `src/` is in `dependencies`, and a dependency
  that `src/` no longer imports is removed.
- The package is ES module only (`"type": "module"`); flag any
  CommonJS construct (`require`, `__dirname`, `module.exports`).

### Correctness and robustness

- Two-phase protocol: the constructor does no expensive work;
  `initialise()` is idempotent (guarded by `_isInitialised`), returns
  `Promise<boolean>`, and a method that needs initialisation fails
  clearly when called before it. A collection's `initialise()` expands
  names only; the content of an item is evaluated by the item's own
  `initialise()`.
- Matrix expansion: names are unique after expansion, an empty or
  missing matrix is handled, a duplicate name is reported, and the
  generated order is deterministic.
- Inheritance: circular references are detected and reported with the
  chain; multiple parents are merged in the documented order; a missing
  parent is an error that names the item.
- Liquid: unknown variables and filters fail (strict mode) with a
  `TemplateError` that names the template; the layered substitution
  variables are not mutated across items; `hasLiquidSyntax()` agrees
  with what the engine evaluates.
- Errors: the most specific class of `errors.ts` is used (`JsonSyntaxError`,
  `ConfigurationError`, `TemplateError`, `InputError`,
  `PrerequisitesError`, `OutputError`), the message names the offending
  item, and errors are thrown synchronously where possible, not wrapped
  in a rejected promise.
- Input handling: `undefined`, `null`, empty strings and objects, values
  of the wrong JSON type, and non-string array elements are validated
  with the type guards in `functions/is-something.ts`.
- File system and platform code (`chmod-recursively`, `filter-paths`,
  `platform-detector`): behaviour on Windows paths, symbolic links, and
  missing folders; no hard-coded path separators.
- `assert()` is used for programming errors only, never to validate
  user data.
- Type safety: no `any` (use `unknown` and guards), no non-null
  assertions without justification, and no casts instead of guards.
- The change adds no dead code and does not duplicate logic that
  already exists.

### Tests

- Every behaviour added or changed has a test in `tests/tap/`, in the
  file that mirrors the source file; a defect fix has a test that
  fails without the fix.
- Tests follow the existing files (`import { test } from 'tap'`, the
  helpers in `tests/helpers/`, the fixtures in `tests/fixtures/`), and
  check the exact error class and message, not only that something
  threw.
- The coverage stays at 100% for branches, functions, lines, and
  statements (`.taprc`); `tests/coverage-map.js` is updated when a
  source file is added or renamed.
- The tests would still pass if the implementation were wrong in the
  obvious way (for example, they check both the success and the failure
  paths of an expansion).

## Tooling Verification

Verify by running rather than by reading only:

```sh
npm run compile
npm run lint
npm test
```

`npm test` compiles and lints first, then runs `tap --show-full-coverage`;
report the failures and every uncovered line. Do not run `npm run fix`,
`npm run prettier`, or `npm run fix-compile`, which modify the files.
Do not accept inline `eslint-disable` comments that silence a finding
without a stated reason, but preserve existing ones.

The release notes (`CHANGELOG.md`) are written during the release
preparation, not with each change; do not report their absence from a
change.

## Evidence

Probe the suspected defects as described under "Confirming Findings
with Probes" in `.github/skills/review-common.md`, and tag the
confirmed ones **[confirmed]**.

## Report

Write the report to a new file, `maintenance/docs/CODE-REVIEW-<n>.md`
(see "Report Files" in `.github/skills/review-common.md`):

```markdown
# Code review

Date: <YYYY-MM-DD HH:MM>, on branch `<branch>`, commit `<hash>`.

Scope: <the path, the range, or the uncommitted changes>.

Tooling: <the results of compile, lint, and test, with the coverage>.

Summary: <n> problems. <The most serious, by number.>

## Naming and style

- **#1 — <short title>.** [internal] **[confirmed]**
  `<file>` line <n>: <what is wrong, the evidence, and the suggested
  change>

## Documentation

## API and packaging

## Correctness and robustness

## Tests

## Not reported

<anything left out because it was not certain enough to include>
```

## Procedure

1. Identify the review scope, and the number of the new report.
2. Read the changed files fully; do not review from partial context.
3. Go through the checklist section by section, collecting concrete
   findings (file, line, description, why it matters).
4. Probe the suspected defects that can be probed.
5. Run the tooling, and include the results.
6. Write the report to the new file.
7. Give the user a short summary: the counts and the most serious
   problems by number.
8. Do not fix the issues unless the user asks for that separately; see
   "Acting on an Item" in `.github/skills/review-common.md`.
