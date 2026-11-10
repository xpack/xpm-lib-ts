---
name: design-review
description: 'Review the design and implementation of the whole xPack xpm core library (@xpack/xpm-lib): defects, usability for a new user (tasks done from the documentation and the typings alone), the public API, the ES module packaging, structure, naming and consistency, simplicity, modern TypeScript usage, performance, and security. Confirm suspected defects with probe programs. Each review is fresh (the earlier reports are not read); report the problems found in a new numbered report, each with a permanent number, and suggest improvements. Use when the user asks for a "design review", an "architecture review", a "full review" of the library, to "analyse the design", or for a review before a release.'
argument-hint: 'Optional: file or folder to review (e.g. src/classes/build-configurations.ts); defaults to src/ and the packaging in package.json'
---

# Design Review — xPack xpm Core Library

The rules for judging, tagging, numbering, and writing reports are in
`.github/skills/review-common.md`; read it first.

## When to Use

- The user asks for a review of the design, the architecture, or the
  implementation of the library as a whole, or of a part of it.
- Before a release, to collect the changes worth making, in
  particular those that change the contract with the users.
- After a large change to the public API or the packaging, to check
  that the design is still consistent.

This skill judges the library as a user and a maintainer meet it:
through its API, its documentation, its packaging, and its code. It
reports problems and suggests improvements; it does not change the
code, unless the user asks for that separately (see "Acting on an
Item" in `.github/skills/review-common.md`).

Related skills, with different scopes:

- `code-review`: the conventions, documentation, and correctness of a
  change (a diff, a set of commits, or a path); cheap, and run often;
- `consistency-check`: the consistency between the code, the
  packaging, the tests, the website, and the other project files.

## A Fresh Review Each Time

**Each review is independent of the previous ones.** Do not read the
earlier reviews (`maintenance/docs/DESIGN-REVIEW-*.md` and
`maintenance/docs/CODE-REVIEW-*.md`), the other reports in
`maintenance/docs/` (for example `CONSISTENCY-CHECK.md`), or the
commit messages and GitHub issues that refer to their items. Judge the
library as it is now, as if for the first time: the earlier
conclusions must not decide what is examined, what is reported, or how
it is classified. A problem that an earlier review already reported,
and that is still present, is reported again.

The only use of the earlier reports is their file names, to choose
the number of the new report. Never modify an earlier report as part
of a new review.

## Scope

If the user specifies a file or a folder, review only that (but read
whatever it depends on). Otherwise review:

- all the sources in `src/` (`index.ts`, `classes/`, `functions/`,
  `data/`, and `types/`);
- the packaging in `package.json` (`exports`, `main`, `typings`,
  `type`, `engines`, `dependencies`, `devDependencies`, `scripts`) and
  `.npmignore`;
- the TypeScript configuration (`tsconfig.json`,
  `config/tsconfig-common.json`, `tests/tsconfig.json`);
- the tests in `tests/tap/`, as a statement of the intended behaviour
  (`.taprc` for the coverage policy).

Do not review `dist/` (compiled output), `node_modules/`, or
`website/` (the website is
reviewed only for the claims that it makes about the API; see
"Using the Library as a Newcomer"). Do not review the generated common
files, which are produced by `generate-top-commons`.

State the scope, the branch, and the commit (`git rev-parse --short
HEAD`) at the top of the report.

## Using the Library as a Newcomer

Before reading the implementation, use the library as a new user
would, to find what makes it hard to learn and to use. This exercise
comes first: once the implementation has been read, it can no longer
be done without that knowledge.

If the agent can start a sub-agent, give the exercise to a fresh one,
with only this section as its instructions, and use its notes.
Otherwise do it before reading `src/`.

The newcomer reads only what a user sees: `README.md`, the published
typings (`dist/index.d.ts` and the `.d.ts` files it exports, after
`npm run compile`), and the pages of the project website in
`website/docs/` (`getting-started`, `install`, `user`, `developer`,
`faq`, and the generated API reference in `api/`).

The newcomer does not read the sources in `src/`, `src/README.md`, the
tests, or the earlier reports. For each task, write down the steps, and write the
program in `<scratch>/newcomer/`, then run it:

1. install the package, and import it from an ES module program and
   from TypeScript (the packaging is part of the usability; note what
   happens with `require()`);
2. load a `package.json` with an `xpack` section, and read its
   properties, with `Package` and `DataModel`;
3. define build configurations with a matrix and inheritance, expand
   the names, retrieve one, and initialise it;
4. do the same for actions, and read the resulting commands;
5. use Liquid substitutions with `package`, `properties`, `matrix`,
   `env`, `os`, and `path`, and see what happens with an unknown
   variable or filter;
6. cause each kind of error (bad JSON, bad configuration, bad
   template, bad input) and see whether the message and the error class
   tell what to do;
7. check a version requirement with `Policies`, and detect the
   platform with `PlatformDetector`;
8. write a minimal init template by extending `InitTemplateBase`;
9. use the library from TypeScript, with the typings only.

For each task, record what had to be looked up and where it was found,
or not found; the places where several ways are offered for the same
thing; the places where the documentation, the typings, and the
behaviour disagree; and the terms used for one concept.

The findings go to section 2 ("Usability"). A problem whose only cause
is stale documentation goes to the incidental observations, with the
`consistency-check` skill named as the one that covers it.

## Reading the Code

Read **every** file in scope in full; do not skim and do not rely on
searches alone. A useful order:

1. `package.json` and `src/index.ts` (what is exported, and how a
   consumer resolves it);
2. `src/types/` and `src/data/` (the data model of the `xpack` section
   and the base substitution variables);
3. `src/functions/` (the type guards, the matrix expander, and the
   substitution helpers);
4. `src/classes/errors.ts`, `liquid-engine.ts`, `liquid-drop.ts`, and
   `template-expander.ts` with `combinations-generator.ts`;
5. `src/classes/package.ts` and `data-model.ts`;
6. `src/classes/build-configurations.ts` and `actions.ts`, the
   largest files, in full;
7. `src/classes/init-template-base.ts`, `policies.ts`, and
   `platform-detector.ts`;
8. `tests/tap/`, to see which behaviour is specified, and which is
   not.

While reading, note for each member: who calls it, what it costs, and
what it does that its name does not say.

Run the tooling, and report every error and warning:

```sh
npm run compile
npm run lint
npm test
```

Check what would be published with `npm pack --dry-run`, and compare
it with the intention of `.npmignore` and of the `files` field (both
`dist/` and `src/` are published deliberately).

## Checks

### 1. Defects

Wrong results, wrong expansions, lost or duplicated items, wrong
inheritance order, wrong substitutions, exceptions, and unhandled
cases. Probe each one (see "Confirming Findings with Probes" in
`.github/skills/review-common.md`). Look in particular at:

- the two-phase protocol: calling `get()` or an accessor before
  `initialise()`, calling `initialise()` twice or concurrently, and
  state left behind by a failed initialisation;
- matrix expansion: empty and single-value arrays, non-string values,
  names that collide after expansion, a matrix that refers to another
  parameter, and the ordering of the combinations;
- inheritance: circular chains, diamonds (the same parent reached by
  two paths), a missing parent, an item that inherits from itself, and
  the merge of properties, arrays, and nested objects;
- Liquid substitution: strict variables and filters, nested
  substitutions, values that contain Liquid syntax, escaping, and
  substitution variables shared or mutated between items;
- the validation of the JSON input: wrong types, missing or extra
  properties, empty objects, and the handling of `undefined` and `null`;
- version policies (`semver` ranges, pre-releases) and platform
  detection (unusual `process.platform` and `process.arch` values);
- file system helpers: symbolic links, missing or unreadable folders,
  Windows path separators, and permissions;
- the `assert()` calls: whether they remain in the published code,
  whether they validate user data (they must not), and what the caller
  sees;
- error classes and messages: whether each error names the item and
  the property, and whether the same problem always raises the same
  class.

### 2. Usability

The findings of the newcomer exercise, and:

- the clarity of the names of the classes, methods, and substitution
  variables, and of the relationship between `Actions`,
  `BuildConfigurations`, `DataModel`, and `Package`;
- whether the two-phase initialisation is explained where it is
  needed, and whether forgetting a step produces a message that tells
  the caller what to do;
- the documentation in the TSDoc comments and on the website: accuracy,
  examples that work, and completeness for the generated reference;
- the use of the library from TypeScript, with the typings only
  (exported types and the constructor parameter interfaces).

### 3. Structure and layering

- The size and the responsibilities of the largest classes
  (`BuildConfigurations`, `Actions`, `InitTemplateBase`): whether
  logic shared by the two collections is duplicated or belongs in a
  common base, and whether a split would simplify them.
- The visibility of the members (`protected` versus `private`): what a
  subclass may rely on, and whether the protected surface is part of
  the contract.
- The dependency direction between the folders (`types`, `data`,
  `functions`, `classes`), and cycles between files.
- The packaging: the `exports` map (the `types` condition and the
  `default`), the `files` field, the committed `dist/` and the
  published `src/`, and the declaration files.
- The `dependencies`: whether each one (`@xpack/logger`, `liquidjs`,
  `semver`) is used by `src/`, and whether `liquidjs` listed also in
  `devDependencies` is needed.
- The `engines` field against `@types/node`, the `target` and `lib` of
  the compiler, and the syntax emitted.
- The exported surface (`export *` from every file in `src/index.ts`):
  whether it is larger than the consumers (xpm and the xpm enabled
  projects) need, and whether internal helpers leak.

### 4. Naming and consistency

- Names of members, types, and files; a consistent vocabulary
  (configuration, action, template, matrix, substitution, drop,
  properties) in the code, the comments, and the documentation.
- Consistency between `Actions` and `BuildConfigurations`: the same
  treatment of arguments, the same documentation pattern, and the same
  error classes for the same problems.
- Consistency of the constructor parameter interfaces, and of the
  `initialise()` return values.
- The use of `any`, and of exported type names.

### 5. Simplicity and duplication

- The near-identical code in the collections and the items: whether the
  repetition is justified or removable without changing the behaviour.
- Code that is not needed, state that can be derived, and paths that
  can never be taken.
- Abstractions with a single user.

### 6. Modern TypeScript

- The compiler options against the current practice (`strict`,
  `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, and the
  others in `config/tsconfig-common.json`), and the TypeScript version
  pinned in `devDependencies` against the syntax that the code could
  use.
- Exported constants and static members used as mutable global state:
  whether they are `readonly`, `as const`, or modifiable by a consumer;
  the sealing of the base substitution variables.
- Types that can drift apart (a string union and a separate map or
  list of the same values).
- Type guards versus assertions and casts for the validation of the
  JSON input; discriminated unions for the variants of the `xpack`
  section.

### 7. Performance and resources

- The cost of the expansion of a large matrix, and whether the lazy
  initialisation really avoids evaluating unused items.
- Repeated work: Liquid parsing of the same template, deep copies of
  the substitution variables, and repeated file system access.
- The cost of loading the module (the imports of `liquidjs`, `semver`,
  and `@xpack/logger`), and the size of the package.

Measure, do not guess: write a probe that expands a matrix with
thousands of combinations, and report the time and the memory.

### 8. Security

- Liquid templates are evaluated with the data of the user's
  `package.json`: whether a template can read the file system, run
  commands, or reach the global object, and which `liquidjs` options
  (`ownPropertyOnly`, `strictVariables`, root folders for includes)
  are set.
- Prototype pollution through the merge of inherited properties, or
  through keys such as `__proto__` and `constructor` in the JSON input.
- Path handling in `filterPath()` and `chmodRecursively()`: traversal
  outside the intended folder, and the following of symbolic links.
- The environment variables exposed to the templates (`env`), and
  whether the documentation tells the caller.
- The supply chain: the dependencies, the lock file, the scripts that
  run on install or publish, and the files published in the package.

### 9. Incidental observations

Everything noticed that belongs to another category, or to another
skill, with the skill named.

### 10. Reviewed and found sound

Record the areas checked and found sound, so that the next review
knows what was covered.

## Judging Findings and Numbering

Follow "Judging Findings" and "Numbering" in
`.github/skills/review-common.md`.

## Report

Write the report to a new file, `maintenance/docs/DESIGN-REVIEW-<n>.md`
(see "Report Files" in `.github/skills/review-common.md`):

```markdown
# Design review

Date: <YYYY-MM-DD HH:MM>, on branch `<branch>`, commit `<hash>`.

Scope: <files and packaging reviewed>.

Method: <how the code was read, the number of files and lines, the
tooling results, how the probes were built, and who did the newcomer
exercise (a sub-agent, or the reviewer before reading the code)>.

Independence: the earlier reports in `maintenance/docs/`, and the
commits and issues that refer to them, were deliberately not
consulted.

Summary: <n> problems (<open> open, <fixed> fixed, <withdrawn>
withdrawn). <The most serious problems, by number, and the suggested
order of work: defects first, then non-breaking clean-ups, then the
breaking changes, grouped for one major release.>

<the meaning of the tags [breaking], [internal], and [confirmed]>

## 1. Defects

- **#1 — <short title>.** [breaking|internal] **[confirmed]**
  `<file>` lines <n> to <m>: <what is wrong, the evidence, and the
  suggested change>

## 2. Usability

## 3. Structure and layering

## 4. Naming and consistency

## 5. Simplicity and duplication

## 6. Modern TypeScript

## 7. Performance and resources

## 8. Security

## 9. Incidental observations

## 10. Reviewed and found sound

- <parts checked without problems>
```

## Procedure

1. Determine the scope, and the number of the new report (from the
   file names only; do not read the earlier reports).
2. Do the newcomer exercise, or start the sub-agent that does it,
   before reading anything else.
3. Run the tooling (compile, lint, test, `npm pack --dry-run`).
4. Read every file in scope in the order given, noting suspected
   problems with their file and line.
5. Write probes for every suspected defect that can be probed, and
   reproduction steps for the others; record the outcome.
6. Classify, tag, and number the findings, including those of the
   newcomer exercise.
7. Write the report to the new file.
8. Give the user a short summary: the counts, the most serious
   problems by number, and the decisions needed. Do not change the
   code unless asked.
