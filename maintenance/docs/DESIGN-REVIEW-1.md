# Design review

Date: 2026-11-10 14:43, on branch `development`, commit `0004d13`
(with uncommitted changes: the move of `config/` to `maintenance/config/`,
and the regenerated `dist/`).

Scope: all sources in `src/`; the packaging in `package.json` and
`.npmignore`; the TypeScript, ESLint, and Prettier configuration in
`tsconfig.json`, `maintenance/config/`, and `tests/tsconfig.json`; the
tests in `tests/tap/` as a statement of intended behaviour; the
website only for its claims about the API.

Method: the newcomer exercise was done first, by the reviewer, from
`README.md`, `dist/*.d.ts`, and `website/docs/user/`, before any file of
`src/` was read (no sub-agent was started). Then every file of `src/`
(9915 lines) was read with the comments removed, and the TSDoc was
sampled. Tooling: `npm run compile` (clean), `npm run lint` (clean),
`npm test` (1017 asserts pass, 34 suites, 100% coverage, 49 s),
`npm pack --dry-run` (120 files, 134 kB packed, 617 kB unpacked). About 60
probe programs (ES modules importing `dist/index.js`, and a TypeScript
consumer project with only the typings) were run in the scratchpad
folder. Findings marked **[confirmed]** were reproduced; the others are
derived from reading, and say so.

Independence: the earlier reports in `maintenance/docs/`, and the
commits and issues that refer to them, were deliberately not
consulted. The file `src/CODE-REVIEW.md` was not read (see #34).

Summary: 66 problems (66 open, 0 fixed, 0 withdrawn). The most serious
are defects that produce wrong results or spurious errors with ordinary
input: #9 (init template properties set to `false` or `0` are replaced
by the defaults), #10 (init template files written to the wrong folder),
#5 (build configuration templates are substituted as JSON text, so a
backslash becomes a tab and a quote is a crash), #1 (parallel
initialisation reports a false circular reference), #4 (inherited
template actions fail), #6 and #8. Suggested order of work: first the
confirmed defects that are not breaking (#1 to #6, #8 to #14, #16 to
#20, #22 to #25), then the packaging and configuration changes, which
are small and independent (#33 to #37, #51, #57, #61 to #66), then the
internal clean-ups (#40 to #44, #47 to #50, #52 to #56), and last the
changes that alter the contract (#7, #15, #18, #21, #26, #42, #45, #58,
#59), grouped for one major release.

Tags: **[breaking]** means that the suggested change alters the contract
with the users of the library and needs a major version, with a
migration path; **[internal]** means that it does not; **[confirmed]**
means that a probe or a reproduction confirmed it.

## 1. Defects

- **#1 — Initialising configurations in parallel reports a false
  circular reference.** [internal] **[confirmed]**
  `src/classes/build-configurations.ts` lines 1513 to 1520 and 1940 to
  1948. `initialise()` sets `_isInitialised` only at the end, and the
  circular check is "this parent is already in my own set". Two
  concurrent calls on the same configuration, or two children that share
  a parent which itself inherits, enter the same `initialise()` twice,
  and the second entry finds the parent in the set. Probe: `a` and `c`
  both inherit `b`, which inherits `g`; `Promise.all` over `a` and `c`
  throws `buildConfiguration "b" inherits from circular reference "g"`.
  `Promise.all([x.initialise(), x.initialise()])` fails the same way.
  Parallel initialisation is the obvious way to initialise all the
  configurations of a matrix. Change: memoise the in-flight promise
  (`this._initialisePromise ??= this._doInitialise()`), and detect cycles
  with an explicit chain of names passed down the recursion, not with a
  per-instance set.

- **#2 — A failed `initialise()` leaves state behind, and a retry gives
  a wrong message.** [internal] **[confirmed]**
  Same lines. After `a` inherits `["b", "zz"]` fails on `zz`, `b` stays
  in `_inheritedNamesSet`; a second `initialise()` throws `inherits from
  circular reference "b"` instead of `inherits from missing "zz"`.
  Change: as for #1, build the state in locals and assign it at the end.

- **#3 — A parent listed twice is reported as a circular reference.**
  [internal] **[confirmed]**
  Same lines. `inherits: ["b", "b"]` throws `inherits from circular
  reference "b"`. Change: skip a duplicate, or report it as a duplicate.

- **#4 — Actions inherited from a template action lose their matrix.**
  [internal] **[confirmed]**
  `src/classes/actions.ts` lines 406 to 418. The inherited actions are
  recreated with `new Action({ actionName, jsonAction, parentActions })`;
  the `matrixParameters` of the original are dropped. Probe: `base` has
  the action `run-{{ matrix.os }}` (matrix `os: [l, m]`); `child`
  inherits `base`; `run-l` in `child` throws `undefined variable:
  matrix.os in action "run-l" commands substitution`. The same action in
  `base` itself gives `echo l`. Change: copy the matrix parameters
  (expose them on `Action` as a read-only member, or pass the substituted
  commands).

- **#5 — Template build configurations are substituted as JSON text.**
  [internal] **[confirmed]**
  `src/classes/build-configurations.ts` lines 1726 to 1760 (template),
  1577 to 1605 (dependencies), and 1814 to 1844 (inherits). The object is
  `JSON.stringify`-ed, run through Liquid, and `JSON.parse`-d. A
  substituted value is inserted into JSON text without escaping:
  - a backslash starts an escape sequence: matrix value `C:\temp` gives
    `C:<TAB>emp` silently (probe P5); on Windows `{{ env.HOMEDRIVE }}`
    style values, `{{ os.homedir }}`, and `{{ os.tmpdir }}` all contain
    backslashes;
  - a double quote or an unlucky backslash gives a raw `SyntaxError`
    (`Bad escaped character in JSON at position 25`) that is not wrapped
    in `ConfigurationError`, and names neither the configuration nor the
    property (probes P5b, P5c, P5d).
  Change: substitute the leaf strings of the object (a recursive walk),
  or apply a JSON-string escaping filter to every substituted value; in
  both cases wrap `JSON.parse` failures. This also removes the risk of a
  Liquid value changing the structure of the object.

- **#6 — Actions inside a template configuration cannot use the
  properties of that configuration.** [internal] **[confirmed]**
  `src/classes/build-configurations.ts` lines 1726 to 1751. The whole
  template, including its `actions`, is substituted at configuration
  initialisation, with the package-level properties only. Probe: the
  action `echo {{ properties.folder }}` works in a plain configuration
  (`["echo f"]`) and fails in a template configuration with identical
  content: `undefined variable: properties.folder in buildConfiguration
  "c-a"`. The two forms of the same data therefore behave differently,
  and the second contradicts the layering in `src/README.md`. Change:
  keep the `actions` object out of the early substitution (only `matrix`
  and `configuration` apply there), so that actions are substituted
  lazily, as for plain configurations.

- **#7 — Names that collide inside one template silently drop
  combinations.** [breaking] **[confirmed]**
  `src/classes/template-expander.ts` lines 256 to 271. `instances.set()`
  overwrites. Probe: the action `a-{{ matrix.os }}` with matrix `os: [x]`
  and `arch: [p, q]` yields the single name `a-x`, with the commands of
  the last combination (`echo q`); the `p` variant is lost without a
  message. The check at `actions.ts` 688 only covers collisions between
  templates. Change: throw `ConfigurationError` on a duplicate expanded
  name. Breaking because a package that loads today will fail to load;
  requires a major version; migration: announce it in the release notes
  as "a template whose name does not use every matrix parameter now
  raises a configuration error; add the missing `{{ matrix.* }}`
  references to the name".

- **#8 — An action whose value is not a string or an array of strings
  crashes with a raw `TypeError`.** [internal] **[confirmed]**
  `src/classes/actions.ts` lines 467 to 473 and 1096 to 1124. Templates
  are recognised only by Liquid syntax in the name. A `{ matrix, template }`
  object under a plain name (a very natural mistake) and a number, `null`,
  or object value all reach `substitutedCommands.replace(...)`:
  `TypeError: substitutedCommands.replace is not a function`. There is no
  message naming the action. Change: validate the content in
  `Action.initialise()` (or in `Actions.initialise()`), and raise
  `ConfigurationError` `action "x" must be a string or an array of
  strings`, with a hint when the object has `matrix` and `template`.

- **#9 — `InitTemplateBase.run()` replaces user values `false` and `0`
  with the defaults, and treats them as missing.** [internal]
  **[confirmed]**
  `src/classes/init-template-base.ts` lines 375 to 379 and 398 to 403
  (and 789 in the prompt loop). The tests use truthiness, but the values
  have already been converted to boolean and number by line 353. Probe:
  `flag` (boolean, default `true`) given as `false`, and `count` (number,
  default 5) given as `0`, come out as `true` and `5`. A mandatory
  boolean given as `false` makes `mustAsk` true, and without a TTY the
  run fails with `Interactive mode not possible without a TTY.` The user
  cannot switch a default-on option off. Change: compare with `undefined`
  and the empty string, not with truthiness.

- **#10 — Init template files are written relative to `process.cwd()`,
  not to `config.cwd`.** [internal] **[confirmed]**
  `src/classes/init-template-base.ts` lines 526 to 539, 573 to 579, and
  650 to 651. The message uses `path.relative(config.cwd, ...)`, but the
  `mkdir`, `copyFile`, `writeFile`, and `path.resolve(destination)` calls
  use the process folder. Probe: with `config.cwd = cwdx` and
  `process.cwd() = out`, `copyFile({sourceFileRelativePath: 'a.md'})`
  creates `out/a.md` and nothing in `cwdx`. Change: resolve relative
  destinations against `config.cwd`.

- **#11 — The interactive prompt never closes its readline interface.**
  [internal] (derived from reading)
  `src/classes/init-template-base.ts` lines 783 to 877. No `rl.close()`
  on any path (success, `InputError` after 42 attempts, or an exception).
  The interface keeps `stdin` open and can keep a process alive. Change:
  `try { ... } finally { rl.close() }`.

- **#12 — Properties that are numbers, booleans, or `null` fail with an
  internal message.** [internal] **[confirmed]**
  `src/classes/liquid-drop.ts` lines 169 to 197 (and the same in the
  matrix drop, 338 to 366). `JsonProperties` allows any value, but the
  drop calls `valueString.includes(...)`. Probes: `{n: 1}` and `{n: true}`
  give `TemplateError: valueString.includes is not a function`; `{n:
  null}` gives `Cannot read properties of null (reading 'includes')`.
  Change: convert primitives with `String()`, or reject them early with a
  message that names the property.

- **#13 — The type of a property depends on its content.** [internal]
  **[confirmed]**
  `src/classes/liquid-drop.ts` lines 189 to 197. An array property
  without Liquid is returned as an array; with Liquid it is joined
  (with `''`) and rendered into a string. Probe: `{{ properties.a |
  join: ',' }}` gives `x,y` for `['x', 'y']`, and `xx` for `['x', '{{
  package.name }}']`. A filter that works until someone adds a variable
  to one element. Change: always render element by element and return an
  array (or always a string).

- **#14 — The drops answer for inherited object keys.** [internal]
  **[confirmed]**
  `src/classes/liquid-drop.ts` lines 169 and 338. `this._properties[key]
  === undefined` also finds `constructor`, `__proto__`, `hasOwnProperty`.
  Probes: `{{ properties.constructor }}` gives `Class constructor
  LiquidPropertiesDrop cannot be invoked without 'new'`;
  `{{ properties.__proto__ }}` gives `[object Object]`. No pollution
  results (see section 10), but the error is misleading and the values are
  garbage. Change: use `Object.hasOwn(this._properties, key)`.

- **#15 — Output is evaluated again, and Liquid cannot be escaped.**
  [breaking] **[confirmed]**
  `src/functions/perform-substitutions.ts` lines 175 to 247. The result
  of each render is rendered again while it contains `{{` or `{%`.
  Consequences: `{% raw %}{{ env.HOME }}{% endraw %}` prints
  `/Users/ilg` (the raw block is evaluated one pass later), so a literal
  `{{` can never be produced; and a value that contains Liquid syntax
  (an environment variable, a package description) is executed as a
  template (`env.EVIL = '{{ os.hostname }}'` prints the host name). The
  re-rendering exists to support properties that refer to properties,
  but the drops already do that (`liquidMethodMissing` renders values).
  Change: render once, and let the drops provide the nesting. Breaking
  because configurations that rely on the second pass change their
  output; requires a major version; migration: keep a
  `maxIterations: 1` option, default 42 in the old major, and deprecate
  the loop; release note: "substitution is single pass; use properties
  for indirection".

- **#16 — `Package` methods throw raw `TypeError`s on ordinary bad
  input.** [internal] **[confirmed]**
  `src/classes/package.ts` lines 305, 568, and 676. `jsonPackage.name`
  as a number gives `name.trim is not a function`; `getMinimumXpmRequired()`
  on a package without `xpack` gives `Cannot read properties of
  undefined (reading 'minimumXpmRequired')` (the type says `xpack` is
  always present, but `readPackageDotJson()` casts a bare `JSON.parse`,
  line 251); `minimumXpmRequired: "0.20"` makes
  `checkMinimumXpmRequired()` throw `TypeError: Invalid Version: 0.20`.
  Change: validate the shape after parsing, make `xpack` optional in the
  type returned by `readPackageDotJson()`, and check
  `semver.valid(minimum)` with a `ConfigurationError` that names the
  value.

- **#17 — `readPackageDotJson()` keeps a stale `jsonPackage` and
  discards the parse error.** [internal] **[confirmed]**
  `src/classes/package.ts` lines 227 to 266. When `withThrow` is false
  and the file is missing or invalid, the old `this.jsonPackage` is kept
  and `undefined` is returned (probe: second read of a missing folder
  returns `undefined` but `jsonPackage.name` is still `x`). With
  `withThrow` true the property is cleared only for invalid JSON, not for
  a missing file. The `JSON.parse` message (the position) goes to the
  trace log only (see #30). Change: assign `this.jsonPackage` on every
  call, and chain the cause.

- **#18 — `Policies` silently applies the newest policy to an invalid
  `minVersion`.** [breaking] **[confirmed]**
  `src/classes/policies.ts` lines 198 to 213. `semver.valid()` returns
  `null` for `"0.20"` (a natural value), and the constructor then skips
  every rule, so all legacy flags are `false` and `minVersion` stays
  `0.0.0` (probe). A package that asks for 0.20 receives the behaviour of
  the latest xpm. `v0.20.0` is accepted but stored with the `v`. Change:
  throw `ConfigurationError` for a defined but invalid `minVersion`, and
  store the normalised value. Breaking because it turns a silent
  acceptance into an error; requires a major version; release note:
  "an invalid `minimumXpmRequired` now raises an error".

- **#19 — An empty action has one empty command.** [internal]
  **[confirmed]**
  `src/classes/actions.ts` lines 1122 to 1124. `'' .split(os.EOL)` is
  `['']`; the probe prints `[""]`. A caller that runs every command will
  run an empty one. Change: return `[]`.

- **#20 — `names` returns the internal array.** [internal] **[confirmed]**
  `src/classes/actions.ts` line 551 and `build-configurations.ts` line
  510. Probe: `actions.names.push('zzz')` changes `names`, while `has('zzz')`
  is `false` and `size` is 1. Change: return a copy, or type the
  property `readonly string[]` (compatible for readers).

- **#21 — User data is validated with `assert()`, and the caller sees an
  `AssertionError`.** [breaking] **[confirmed]**
  `src/classes/data-model.ts` lines 293 to 296 (`xpack section missing in
  package.json`), `src/classes/package.ts` lines 192 to 195 (relative
  `packageFolderPath`), `actions.ts` 386 to 388, `build-configurations.ts`
  347 to 349 and 1432 to 1434, `policies.ts` 199, and many others.
  `assert` is not removed from the published code, and `AssertionError`
  is not a member of the error hierarchy that callers match (`ConfigurationError`
  and the others). Probe: `new DataModel({ jsonPackage: { name, version }
  })` throws `AssertionError: xpack section missing in package.json`.
  The same applies to the "must be initialised" guards (a programming
  error, but then `assert` is acceptable). Change: use `ConfigurationError`
  or `InputError` for anything that comes from the user's files, and keep
  `assert` for the programmer's contract. Breaking for callers that catch
  `AssertionError`; requires a major version; migration: throw the new
  class for one major version while keeping the message; release note:
  "invalid package data now raises `ConfigurationError`".

- **#22 — `isObject(null)` is `true`.** [internal] **[confirmed]**
  `src/functions/is-something.ts` lines 140 to 142. `typeof null ===
  'object'`. The sibling `isJsonObject(null)` is `false`. Used at
  `init-template-base.ts` 803 and 864 on values that may be `null`.
  Change: add `value !== null`.

- **#23 — `parsePackageSpecifier()` mishandles aliases and empty
  versions.** [internal] **[confirmed]**
  `src/classes/package.ts` lines 723 to 762. `a@npm:b@1.0.0` gives
  `{ name: 'a', version: 'npm:b' }`; `a@` gives `version: ''`; `@scope`
  gives a scope with no name and no error. Change: split on the last `@`
  after the name, and reject empty parts.

- **#24 — A trace message prints a placeholder instead of the name.**
  [internal] (derived from reading)
  `src/classes/build-configurations.ts` lines 1618 to 1621. The template
  literal `` `@{this.buildConfigurationName}` `` has no `$`, and
  `buildConfigurationName` is not a member. Change: use
  `` `@${this.name}` ``.

- **#25 — `rewritePackageDotJson()` is not atomic and reformats the
  file.** [internal] (derived from reading)
  `src/classes/package.ts` lines 278 to 287. `fs.writeFile` truncates the
  target first; a crash or a full disk leaves a damaged `package.json`.
  The indentation is forced to two spaces, which rewrites every line of
  a file that uses tabs or four spaces. Change: write a temporary file
  in the same folder and rename it; detect the existing indentation.

- **#26 — `doForce` and `isDryRun` are documented but never honoured, and
  existing files are overwritten.** [breaking] **[confirmed]**
  `src/types/xpm.ts` lines 67 to 95 describe a force mode that "bypasses
  safety checks" and a dry run that "simulates operations", and
  `grep` finds no use of either in `src/`. `InitTemplateBase.render()` and
  `copyFile()` overwrite an existing file unconditionally (probe: an
  existing file containing `USER DATA` was replaced). Change: refuse to
  overwrite unless `doForce`, and skip writes on `isDryRun`; or delete the
  two flags from the type. Breaking because the default behaviour
  changes; requires a major version; migration: add the check behind an
  `overwrite` option that defaults to the old behaviour for one major
  version.

## 2. Usability

- **#27 — The user guide shows code that does not compile.** [internal]
  **[confirmed]**
  `website/docs/user/_project/_content.mdx`. `buildConfigurations.names()`
  and `actions.empty()` are used as methods; the typings have the getters
  `names` and `isEmpty` (a TypeScript consumer gets `TS6234: This
  expression is not callable because it is a 'get' accessor` and `TS2551:
  Property 'empty' does not exist on type 'Actions'`). The lists of "other
  members" name `buildConfigurationName`, `templateBuildConfigurationName`,
  and `actionName`, which are `name` and `templateName` in the typings;
  `rewritePackageDotJson(jsonPackage)` is shown without its receiver.
  The `consistency-check` skill covers stale documentation; it is listed
  here because it is the first thing a newcomer hits.

- **#28 — The documentation does not cover most of the library.**
  [internal]
  `README.md` has no example at all; the user guide covers `Package`,
  `DataModel`, `BuildConfigurations`, and `Actions` as lists of member
  names. A newcomer cannot learn from it: the format of the `xpack`
  section; what a `matrix` is and how the name must use it (see #7 and
  #8); how inheritance merges properties, dependencies, and actions;
  which substitution variables and filters exist (`path_*`, `to_filename`,
  `join_lines`, `split_lines`, `keys`, `util_format`); the error classes
  and when each is thrown; `Policies`, `PlatformDetector`, and
  `InitTemplateBase` (no guide at all). Change: add one worked example
  to the README and a page per topic; the TSDoc already contains most of
  the text (but see #33).

- **#29 — Five calls are needed to read one action of one
  configuration.** [internal] **[confirmed]**
  `buildConfigurations.initialise()`, `get(name)`, `config.initialise()`,
  `config.actions.initialise()`, `actions.get(name)`, `action.initialise()`,
  then `commands`. Forgetting any step gives an `AssertionError` (the
  messages are clear, as in `BuildConfigurations collection must be
  initialised before accessing names`, but the class is not a library
  error, see #21). `DataModel` has no `initialise()`, although the guide
  says "objects must be initialised before use". Change: offer
  `await collection.getInitialised(name)` (or make `get()` async and
  initialise the item), and keep the two-phase protocol as an
  optimisation.

- **#30 — A bad `package.json` reports no reason.** [internal]
  **[confirmed]**
  `src/classes/package.ts` lines 250 to 264. The message is `invalid
  package.json in folder ‘…’`; the position and the reason of the
  `JSON.parse` error are only traced. The class is `InputError`, and
  `JsonSyntaxError`, which exists for this, is used only by
  `InitTemplateBase` for other purposes (#45). Change: append the parse
  message, and attach it as `cause` (see #54).

- **#31 — `require()` support depends on the Node version and is not
  stated.** [internal] **[confirmed]**
  The package is ES module only (`type: module`, `exports` with no
  `require` condition), and `engines` says `>=20.0`. `require()` of the
  package works on Node 20.20 (probe) because `require(esm)` exists since
  20.19, and fails with `ERR_REQUIRE_ESM` on 20.0 to 20.18. Change: state
  "ES module only; `require()` needs Node 20.19 or later" in the README and
  the install page, or raise the `engines` floor to `>=20.19`.

- **#32 — `buildFolderRelativePath` of a hidden configuration throws an
  `AssertionError` with an internal message.** [internal] **[confirmed]**
  `src/classes/build-configurations.ts` lines 1553 and 1665 to 1676. For a
  hidden configuration the value is never computed, and the getter fails
  with `BuildConfiguration _buildFolderRelativePath not initialised`; the
  guide lists `buildFolderRelativePath` among the ordinary members. Change:
  document it, and return `undefined` (or throw a `ConfigurationError`
  that says "hidden configurations have no build folder").

## 3. Structure and layering

- **#33 — `removeComments: true` strips every TSDoc comment from the
  published typings.** [internal] **[confirmed]**
  `maintenance/config/tsconfig-common.json` line 24. The project's rules
  demand "comprehensive TSDoc comments", yet `dist/**/*.d.ts` contains
  no `/**` at all (probe: 0 in `actions.d.ts`), so editors show no hover
  documentation to the consumers; the same is true of `.d.ts.map`
  navigation, which leads to the unreadable generated declarations. The
  comments cost nothing in the JavaScript that matters. Change: set
  `"removeComments": false`, or keep it only for JavaScript with two
  configurations; recompile `dist/`. (This is the most useful single
  change to the build configuration.)

- **#34 — `src/CODE-REVIEW.md` (53 kB) is published in the package.**
  [internal] **[confirmed]**
  `package.json` line 14 (`files` lists `src/`) and `.npmignore` (which
  lists `**/CODE-REVIEW.md`). `npm pack --dry-run` shows
  `src/CODE-REVIEW.md` and `src/README.md`: a root `.npmignore` does not
  filter inside a folder named by `files`. Change: move the review out of
  `src/` (the skill already writes to `maintenance/docs/`), or add the
  negations `"!src/**/*.md"` to `files`.

- **#35 — The `prepare` script deletes the committed `dist/`, rewrites
  the sources, and runs on every `npm install`.** [internal]
  `package.json` line 98: `del-cli dist && npm run prettier && npm run
  lint && npm run compile`. `prepare` runs after a plain `npm install` in
  the repository, and when the package is installed from git. A lint error
  leaves `dist/` deleted (it is tracked, 92 files), and `prettier --write`
  silently reformats `src` and `tests` as a side effect of installing.
  Change: `prepare` only compiles (or nothing, since `dist/` is committed
  and `prepublishOnly` rebuilds); keep `del-cli` out of it.

- **#36 — Lint runs two or three times per `npm test` and `npm publish`.**
  [internal] **[confirmed]**
  `package.json` lines 99, 114, and 116. `npm test` runs `pretest`
  (compile and lint), then `test-coverage` triggers `pretest-coverage`
  (lint again); `prepublishOnly` runs lint, then `npm test` (lint twice
  more). Change: remove `pretest-coverage` and `pretest-no-coverage`, and
  let `prepublishOnly` run `npm test` only.

- **#37 — Unused, obsolete, and duplicated development dependencies.**
  [internal]
  `package.json` lines 62 to 78. No file in `src/`, `tests/`, or
  `maintenance/` (outside comments and README text) uses
  `@types/decompress`, `@types/pacote`, `@types/npmcli__arborist`,
  `@types/proxy-from-env`, `ts-node` (tap 21 loads TypeScript itself),
  `@types/tap` (tap 21 ships its types, and version 15 types belong to
  tap 15), `glob`, or `json`; they look copied from the `xpm` CLI
  package. Verify that the shared `@xpack/npm-packages-helper` scripts do
  not need `glob` or `json` before removing them. `liquidjs` is both a
  dependency (`^10.27.0`, line 39) and a development dependency
  (`^10.30.1`, line 74): the second one is the version that is tested and
  the first one is the version that is promised; keep one entry, and
  raise the dependency range to the tested minimum.

- **#38 — `@types/node` 26 is compiled against, `engines` promises Node
  20, and the typings need `@types/node`.** [internal] **[confirmed]**
  `package.json` lines 63 and 138. A call to an API that exists only in a
  newer Node compiles and fails at run time on Node 20 (CI runs tests on
  20, 22, and 24, so a test may catch it, but the compiler cannot).
  Change: depend on `@types/node@^20` (the floor), or compile once against
  it in CI. Separately, the published `.d.ts` files use `NodeJS.Process`,
  `NodeJS.ProcessEnv`, `NodeJS.Platform`, and `node:os` types: in a clean
  consumer project without `@types/node`, `tsc` reports `TS2503: Cannot
  find namespace 'NodeJS'` for several files of the library. `@xpack/logger`
  and `liquidjs` have the same need, so the practical impact is small;
  declare `@types/node` as an optional peer dependency, or state the
  requirement in the install page.

- **#39 — `exports` has no `./package.json` entry, and `main` and
  `typings` repeat it.** [internal]
  `package.json` lines 6 to 13. `import 'x/package.json'` (a common way to
  read the version) is blocked by the `exports` map. `main` and `typings`
  are redundant with `exports` on every Node and TypeScript version that
  supports `engines`, apart from old tooling. Change: add
  `"./package.json": "./package.json"`; decide whether to keep `main` and
  `typings` for old tooling.

- **#40 — Two import cycles in `dist/`.** [internal] **[confirmed]**
  Found by walking the compiled imports: `classes/build-configurations.js
  -> classes/data-model.js -> classes/build-configurations.js` (a runtime
  constant `buildFolderRelativePathPropertyName`, imported at
  `build-configurations.ts` line 40, is defined in the file that imports
  the classes), and `functions/chmod-recursively.js -> index.js ->
  functions/chmod-recursively.js` (line 20 imports `ConfigurationError`
  from the barrel). They work today because the uses are lazy; a
  reordering of the exports in `index.ts` or an eager use would give
  `undefined` at load time. Change: move the constant to
  `data/substitutions-variables.ts` (or a new `data/constants.ts`), and
  import `./errors.js` directly.

- **#41 — Duplicated logic and redundant state in the collections and
  the drops.** [internal]
  `Actions` and `BuildConfigurations` repeat the same fields and the same
  `initialise()`, `has()`, `get()`, `size`, `isEmpty`, `names`, and
  template-processing code (a large part of the 3281 lines of the two
  files); `_namesSet` always holds exactly the keys of
  `_jsonActionsNamesMap` (`actions.ts` 285 and 310; `build-configurations.ts`
  244 and 270), and `_names` is a cached copy of the keys of the item map.
  `LiquidPropertiesDrop` and `LiquidMatrixDrop` (`liquid-drop.ts` 82 to
  205 and 257 to 374) differ only in the word `properties` or `matrix`,
  and each fix in this report (#12, #13, #14) must be made twice. Change:
  an abstract `Collection<TItem, TJson>` base class, and one generic drop
  taking the label.

- **#42 — `export *` publishes helpers that are not part of a stable
  API.** [breaking]
  `src/index.ts` lines 55 to 79. Besides the classes, the barrel exports
  `getErrorMessage`, `isPrimitive`, `isObject`, `isJsonObject`,
  `filterWin32Path`, `filterPosixPath`, `hasLiquidSyntax`,
  `processMatrixForExpansion`, `performSubstitutions`, the constant
  `COMBINATIONS_GENERATOR_MAX_COMBINATIONS_LIMIT`, and 40 types; every
  one is now a promise to the users. Whether `xpm` and the xpm enabled
  projects use them cannot be decided from this repository. Change: list
  the intended names explicitly in `index.ts`, and mark the others
  `@internal` (they remain reachable by the compiled path only if the
  `exports` map allows it, which it does not). Breaking for any consumer
  that imports a helper; requires a major version; migration: re-export the
  helpers with `@deprecated` for one major version.

- **#43 — Most members that describe state are public and mutable.**
  [breaking]
  `Package.packageFolderPath` and `jsonPackage`; every flag of `Policies`;
  `BuildConfiguration.inheritsNames`, `properties`, `dependencies`,
  `devDependencies`, `jsonBuildConfiguration`, and `isTemplate` (the
  latter is `templateName !== undefined`, `build-configurations.ts` 1225
  and 1457); `InitTemplateBase.policies` and `isInteractive`. A consumer
  can change them after `initialise()` and desynchronise the object.
  Change: `readonly` (and `ReadonlyArray`, `Readonly<Record<…>>`) where
  the library does not assign them after construction. Breaking only for
  TypeScript consumers that assign them.

- **#44 — `DataModel` creates its own `LiquidEngine`, although the
  architecture is dependency injection.** [breaking]
  `src/classes/data-model.ts` line 291. `Actions` and `BuildConfigurations`
  take an `engine`, but the one place that is used in practice creates it
  with no options, so a consumer cannot add a filter or change
  `strictVariables`. `CLAUDE.md` states "classes take engine …; no
  singletons". Change: an optional `engine` in `DataModelConstructorParameters`
  (additive, so not breaking).

## 4. Naming and consistency

- **#45 — Error classes do not mean what their names say.**
  [breaking] **[confirmed]**
  `src/classes/init-template-base.ts` lines 363, 385, and 654.
  Invalid property values and "no TTY" raise `JsonSyntaxError` (the
  probe prints `JsonSyntaxError: 1 invalid property`), a class whose
  name and documentation are about JSON; a missing variable in a template
  raises `OutputError` (`OutputError: undefined variable: nope, line:1,
  col:4`, with the line suffix that `performSubstitutions()` strips), and
  a non-`Error` throw inside `render()` is swallowed (lines 652 to 656,
  the function returns normally). `chmodRecursively()` raises
  `ConfigurationError` for a depth limit (`chmod-recursively.ts` 106).
  Change: `InputError` for invalid properties and the missing TTY,
  `TemplateError` for template errors, and rethrow unknown values.
  Breaking for callers that match the classes; requires a major version;
  migration: make the new classes subclasses of the old ones for one
  major version.

- **#46 — Inconsistent member names across the two collections and their
  items.** [internal]
  `BuildConfiguration` has `protected readonly matrixParameters` (line
  1301, no underscore, against the project rule and against
  `Action._matrixParameters`); the collections expose `log`, `engine`,
  `substitutionsVariables` as public members while the items keep `_log`
  protected; `BuildConfigurations.isHidden(name)` is a method while
  `BuildConfiguration.isHidden` is a property; `getJsonName`,
  `hasJson`, `getJson` exist only on `BuildConfigurations`, not on
  `Actions`; `initialise()` returns `true` the first time and `false`
  after (a boolean whose meaning must be looked up). Change: align the
  names in the next major release, and keep the old ones as deprecated.

## 5. Simplicity and duplication

- **#47 — The path filter is written four times, and part of it cannot
  run.** [internal] **[confirmed]**
  `src/functions/filter-paths.ts` lines 51 to 58, 86 to 91, and 119 to
  124, and `liquid-engine.ts` lines 207 to 220. In every copy the final
  `.replace(/--/g, '-')` is dead: the first replacement collapses every
  run of disallowed characters (including `-`) into one `-`, so `--`
  cannot occur (an exhaustive probe over all strings of three characters
  from `a-/ .\_` plus a suffix found 0 cases). Change: one function
  taking the platform, used by `filterPath`, the two variants, and the
  `to_filename` filter.

- **#48 — A dead assertion for Node 12.** [internal]
  `src/classes/data-model.ts` lines 300 to 303:
  `assert(typeof os.version === 'function', 'Mandatory os.version
  available only since 12.x')`. `engines` is `>=20`. Remove it, and the
  `node:os` import if nothing else uses it there.

- **#49 — Command lists depend on `os.EOL`.** [internal] (derived from
  reading)
  `src/classes/actions.ts` lines 1096 to 1124, `matrix-expander.ts` 140
  to 165, `build-configurations.ts` 1888 to 1889, and the filters
  `join_lines` and `split_lines`. Data from a JSON file is joined and split
  with the host line ending, and a new `RegExp(os.EOL + '$')` is built at
  each call. On Windows a single string `"a\nb"` stays one command; on
  Linux and macOS it becomes two. Change: split on `/\r?\n/` always, and
  use a constant regular expression.

- **#50 — `InitTemplateBase.run()` has an unused result and a side
  effect.** [breaking]
  `src/classes/init-template-base.ts` lines 394 and 445. It always
  returns `0` (failures throw), and it sets `context.startTime` on the
  shared `Context` only in interactive mode. Change: return `void`, and
  drop the assignment (or document it). Breaking only for TypeScript
  code that uses the result in a type position; requires a major version
  to be safe.

## 6. Modern TypeScript

- **#51 — The compiler configuration is looser than the code needs.**
  [internal] **[confirmed]**
  `maintenance/config/tsconfig-common.json` extends `@tsconfig/node20`
  (`strict`, `target es2022`, `lib es2023`, `module nodenext`) and adds
  nothing that tightens it. Probes with extra flags on the current code:
  `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`,
  `noUnusedLocals`, and `noUnusedParameters` give 0 errors, so they can be
  enabled today. `exactOptionalPropertyTypes` gives 2 errors,
  `noUncheckedIndexedAccess` 18, and `verbatimModuleSyntax` 32 (it needs
  `import type`, which `@typescript-eslint/consistent-type-imports` can
  fix). The 18 indexed-access errors are the places that index a map or
  an array without checking (for example `matrix-expander.ts` and
  `combinations-generator.ts` 319 and 320). Also redundant:
  `inlineSourceMap: false`, `inlineSources: false` (defaults), and
  `esModuleInterop` (implied by `module nodenext`). Change: enable the five
  free flags now, and the other three one at a time. The base file is a
  generated file: the change belongs in its template.

- **#52 — The type guards return `boolean` and force casts.**
  [internal]
  `src/functions/is-something.ts` (all functions). `isString(x)` is
  declared `: boolean`, not `x is string`, so every use needs
  `as string[]` or `as string` (for example `matrix-expander.ts` lines 128,
  140, and 165; `init-template-base.ts` 805 and 866). Change: declare type
  predicates (`value is string`, `value is Record<string, unknown>`); this
  is source-compatible for callers.

- **#53 — `any` and open index signatures defeat the types of the
  JSON input.** [internal] **[confirmed]**
  `src/types/json.ts` lines 18 and 176 (`JsonPropertyValue = any`,
  `[key: string]: any` on `JsonBuildConfigurationContent`),
  `substitutions-variables.ts` 269 and 294. In a consumer project
  (typings only), `const c: JsonBuildConfigurationContent = { inherts:
  ['a'], hiden: true }` compiles without a diagnostic, so the most
  frequent configuration errors, the misspelt keys, are accepted by the
  compiler (and at run time: `inherit` and `inherits` are both honoured
  while `inherts` is ignored silently). `JsonProperties` (any value) and
  `LiquidSubstitutionsStrings` (`string | string[]`) also disagree, which
  is the cause of #12. Change: `unknown` in place of `any`; drop the index
  signature, or restrict it to a prefix (``` `x-${string}` ```).

- **#54 — Errors are rethrown without `cause`.** [internal]
  `actions.ts` 475, 700, and 1112 to 1117; `build-configurations.ts` 796
  to 799, 1588 to 1593, and 1752 to 1756; `template-expander.ts` 321 to
  326; `matrix-expander.ts` 151 to 156. Each `catch` builds a new
  `ConfigurationError(message)` from `getErrorMessage(error)`, so the
  original stack and class are lost, and the messages grow by suffixes
  (`... in action "x" commands substitution in action "x"`). The target
  is ES2022, where `new Error(message, { cause })` is available. Change:
  pass `{ cause: error }` in each place.

- **#55 — A union is cast from a string, and unions drift from the
  strings produced elsewhere.** [internal]
  `src/classes/template-expander.ts` lines 229 and 241
  (`templateType: string` then `templateType as 'action' |
  'buildConfiguration'`); `InitTemplatePlatform` (a union of seven
  values) against `PlatformInfo.platform: string` and `getPlatformKey()`,
  which builds the same strings from `process.platform` and `process.arch`
  with no link between them. Change: declare `templateType` with the union
  type, and derive the platform key type from one list.

- **#56 — The base substitution variables are shared, live, and mutable.**
  [internal] **[confirmed]**
  `src/data/substitutions-variables.ts` lines 355 to 388,
  `src/classes/data-model.ts` lines 305 to 317. `liquidSubstitutionsVariablesBase`
  is an exported mutable object; `DataModel` copies it one level deep and
  `Object.seal`s the copy, which does not protect `env`, `os`, `path`, or
  `properties`. `properties: {}` is the same object in every `DataModel`
  without `xpack.properties`. Probe: writing `d1.substitutionsVariables.properties.leak
  = 'yes'` makes it visible in a second `DataModel` and in the exported
  base. `env` is `process.env` itself (live, so a later `process.env`
  change alters templates mid-run), and `os.cpus()` and `os.hostname()`
  are evaluated at import. Change: build the base in a function
  (`createSubstitutionsVariables()`), copy `properties`, freeze the nested
  objects, and keep the exported constant as a deprecated alias.

## 7. Performance and resources

- **#57 — Trace messages are built even when tracing is off.** [internal]
  `src/classes/combinations-generator.ts` lines 201 to 205 and 306 to 310
  (`JSON.stringify` of the matrix and of every partial combination),
  `perform-substitutions.ts` 167 and 242, and most of the
  `log.trace(\`...${x}\`)` calls in the collections. Measured: expanding a
  420-combination matrix of build configurations takes 45 ms, and
  initialising all 420 of them 32 ms (13 MB heap), so the effect today is
  small; it grows with the combination limit and with trace calls inside
  loops. Change: pass the arguments to `log.trace()` separately (the
  logger formats lazily) or test the level first.

## 8. Security

- **#58 — Templates can read any file on the machine.** [breaking]
  **[confirmed]**
  `src/classes/liquid-engine.ts` lines 119 to 130. The engine keeps the
  `liquidjs` defaults, so `{% include %}` and `{% render %}` are enabled
  and unrestricted: `{% include '/abs/path/secret.txt' %}` returned the
  file content in a probe, as did a path relative to the process folder.
  `package.json` files of dependencies (xpacks) are also templates, and
  they can already define actions that run commands, so the exposure is
  bounded; but reading a file is not something `package.json`
  substitution needs. Change: pass an empty `root`/`partials`, or a custom
  `fs` that rejects every path, for the engine used by `DataModel` (the
  engine of `InitTemplateBase` needs `root` and keeps it). Breaking for
  any package that uses include in a substitution; requires a major
  version; release note: "`include` and `render` are disabled in
  `package.json` substitutions".

- **#59 — The size and iteration limits do not bound the work.**
  [breaking] **[confirmed]**
  `src/functions/perform-substitutions.ts` lines 39 to 45 and 194 to 204.
  The 42 KB limit is tested after the render, and it counts characters
  although the message says bytes. Probe: `{% for i in (1..5000000) %}x{%
  endfor %}` ran for 4.5 s and built a 5 MB string before the limit
  fired. Change: set the `liquidjs` options `renderLimit` (milliseconds)
  and `memoryLimit`, which stop the render itself. Breaking only in the
  sense that a very slow legitimate template now fails; release note
  accordingly.

- **#60 — `env` exposes the whole environment to every template, and
  nothing says so.** [internal]
  `src/data/substitutions-variables.ts` line 356 and the documentation
  (the user guide has no page on substitution variables). Any
  `package.json` can print `{{ env.NPM_TOKEN }}` or `{{ env.GITHUB_TOKEN }}`
  into a command or a generated file, which together with the repeated
  rendering (#15) also makes a variable that contains Liquid syntax
  executable. Change: document it; optionally add an allow-list option.

## 9. Incidental observations

- **#61 — ESLint `tsconfigRootDir` points at the wrong folder.**
  [internal]
  `maintenance/config/eslint.config.js` line 56:
  `path.resolve(configFolderPath, '..')` is `maintenance/` since the move
  from `config/`. Linting still works because `projectService` finds the
  nearest `tsconfig.json`, but the value should be `'../..'`. (The file
  is generated; fix the template. The same applies to the prettier ignore
  path and the two `tsconfig` paths already corrected in this session.)

- **#62 — `tests/tsconfig.json` has `"include": []`.** [internal]
  **[confirmed]**
  `tsc -p tests/tsconfig.json` reports `TS18003: No inputs were found`.
  The file serves editors only if they accept an empty project, and tap
  does the type check (`typecheck: true` in `.taprc`). Change: include
  `tap/**/*.ts` and `helpers/**/*.ts`, so that the editor and `tsc`
  see the tests.

- **#63 — `.gitignore` ignores the folder `tests/tap/classes/build-configurations/`.**
  [internal] **[confirmed]**
  `.gitignore` line 156 (`build*/`) matches that folder name. The five
  `.ts` files are tracked, but a new test file added there is ignored by
  `git add` without a message, and five stale compiled `.js` copies
  (dated Feb 21 2026) sit next to the sources, ignored by the same
  rule. Change: anchor the pattern (`/build*/`), and delete the `.js`
  files. (`consistency-check` covers the stale files.)

- **#64 — `maintenance/config/tsconfig-original.json` is a leftover.**
  [internal] (derived from reading)
  It is not referenced by any script or configuration in the repository
  (`grep`), and it mentions `glob`, which is where the `glob` development
  dependency of #37 is mentioned. Delete it, or document its purpose.

- **#65 — The `npm-audit` script runs `npm audit fix --force`.**
  [internal]
  `package.json` line 111. `--force` accepts semver-major updates and
  can break the build with a single command. Change: `npm audit`.

- **#66 — Compiling changes a tracked file, and Node 20 is end of life.**
  [internal] **[confirmed]**
  `npm run compile` modified `dist/types/json.d.ts.map` in this working
  tree, so the committed `dist/` is not exactly reproducible from the
  committed sources (`consistency-check` covers it). `engines` still
  allows Node 20.0 and the CI matrix tests Node 20, whose upstream
  support ended in April 2026; the `TODO` in `tsconfig-common.json` line 8
  already plans the move to `node22`, which is also the point to raise
  the `engines` floor (see #31 and #38).

## 10. Reviewed and found sound

- Error messages of the substitution and validation paths name the
  item and the property (`undefined variable: properties.folder in
  buildConfiguration "c-a"`, `action "zzz" does not exist`,
  `matrix.os cannot be empty`), and unknown variables and filters fail
  (`strictVariables`, `strictFilters`) with a `ConfigurationError`.
- Matrix validation (not an array, empty, non-string values), the 420
  combination limit, and the recursion of `CombinationsGenerator` behave
  as documented; 420 combinations expand in 45 ms.
- `liquidjs` `ownPropertyOnly` protects the data: `{{ package.constructor }}`
  is an undefined variable.
- Prototype pollution: `__proto__` keys in `xpack.properties`, in a build
  configuration, in its properties, and as an action name were accepted
  as ordinary own keys and did not change `Object.prototype` (probe V1).
- `chmodRecursively()` does not follow symbolic links (`lstat`) and has a
  depth limit; the order of the permission changes is right for both
  directions.
- `PlatformDetector` and `getPlatformKey()` are small and injectable;
  `Policies` flags follow the thresholds (apart from #18).
- Diamond inheritance (a child with two parents that share a grandparent),
  when initialised sequentially, merges properties and actions in a
  stable order; hidden configurations are listed and flagged correctly
  (`isHidden` is right for template names that contain `{{`).
- Start-up cost is dominated by the dependencies (75 ms to import the
  library, 69 ms to import `liquidjs`, `semver`, and `@xpack/logger`).
- Tooling: compile and lint are clean with `strictTypeChecked` rules, the
  tests pass (1017 asserts) with 100% coverage, and the pack contains
  `dist/`, `src/`, and `package.json` (apart from #34).
- The three runtime dependencies (`@xpack/logger`, `liquidjs`, `semver`)
  are all used by `src/`; no install-time scripts run for consumers (the
  `prepare` script is not run for a tarball install).
