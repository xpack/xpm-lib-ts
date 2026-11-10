[![GitHub package.json version](https://img.shields.io/github/package-json/v/xpack/xpm-lib-ts)](https://github.com/xpack/xpm-lib-ts/blob/mater/package.json)
[![npm (scoped)](https://img.shields.io/npm/v/@xpack/xpm-lib.svg)](https://www.npmjs.com/package/@xpack/xpm-lib/)
[![license](https://img.shields.io/github/license/xpack/xpm-lib-ts.svg)](https://github.com/xpack/xpm-lib-ts/blob/xpack/LICENSE)
[![TS-Standard - TypeScript Standard Style Guide](https://badgen.net/badge/code%20style/ts-standard/blue?icon=typescript)](https://github.com/standard/ts-standard/)
[![CI on Push](https://github.com/xpack/xpm-lib-ts/actions/workflows/nodejs.yml/badge.svg)](https://github.com/xpack/xpm-lib-ts/actions/workflows/nodejs.yml)
[![GitHub issues](https://img.shields.io/github/issues/xpack/xpm-lib-ts.svg)](https://github.com/xpack/xpm-lib-ts/issues)
[![GitHub pulls](https://img.shields.io/github/issues-pr/xpack/xpm-lib-ts.svg)](https://github.com/xpack/xpm-lib-ts/pulls/)

# Maintainer & developer info

## Project repository

The project is hosted on GitHub:

- <https://github.com/xpack/xpm-lib-ts.git>

The project uses two branches:

- `master`, with the latest stable version (default)
- `development`, with the current development version

To clone the `master` branch, use:

```sh
mkdir ${HOME}/Work/npm-packages && cd ${HOME}/Work/npm-packages
git clone \
https://github.com/xpack/xpm-lib-ts.git xpm-lib-ts.git
```

For development, to clone the `development` branch, use:

```sh
git clone --branch development \
https://github.com/xpack/xpm-lib-ts.git xpm-lib-ts.git
```

## Prerequisites

The prerequisites are:

- node >= 20.0.0
- npm

To ensure compatibility with older node, revert to an older one:

```sh
nvm use --lts 20
code
```

## Satisfy dependencies

```sh
npm install
```

## Add links for development

```sh
cd xpm-lib-ts.git
npm link
```

And in the projects referring it:

```sh
npm link @xpack/xpm-lib
```

## Start the compile background task

The TypeScript compiler can automatically recompile modified files. For
this, start it in `watch` mode.

```sh
npm run compile-watch
```

## Language standard compliance

The current version is TypeScript 4:

- <https://www.typescriptlang.org>
- <https://www.typescriptlang.org/docs/handbook>

The compiler is configured to produce `es2020` & `commonjs` files,
which means ECMAScript6 with legacy CommonJS modules, that can be imported
by any other project either via `require()` or `import`.

For more details on how to configure `tsconfig.json`, please see:

- <https://www.typescriptlang.org/tsconfig/>

## Standard style

As style, the project uses `ts-standard`, the TypeScript variant of
[Standard Style](https://standardjs.com/#typescript),
automatically checked at each commit via CI.

```js
// eslint-disable-next-line @typescript-eslint/no-xxx-yyy
```

The known rules are documented in the
[typescript-eslint](https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/eslint-plugin/docs/rules)
project.

Generally, to fit two editor windows side by side in a screen,
all files should limit the line length to 80.

```js
/* eslint max-len: [ "error", 80, { "ignoreUrls": true } ] */
```

Known and accepted exceptions:

- none

To manually fix compliance with the style guide (where possible):

```console
% npm run fix

> @xpack/xpm-lib@4.0.0 fix
> ts-standard --fix src && standard --fix test
...
```

## Documentation metadata

The documentation metadata uses the
[TypeDoc](https://typedoc.org/guides/doccomments/) tags, without
explicit types, since they are provided by TypeScript.

## Tests

The tests use the [`node-tap`](http://www.node-tap.org) framework
(_A Test-Anything-Protocol library for Node.js_, written by Isaac Schlueter).

Tests can be written in TypeScript.

As for any `npm` package, the standard way to run the project tests is via
`npm run test`:

```sh
cd xpm-lib-ts.git
npm install
npm run test
```

A typical test result looks like:

```console
% npm run test



> @xpack/xpm-lib@4.0.0-pre pretest
> npm run compile && npm run lint


> @xpack/xpm-lib@4.0.0-pre compile
> tsc --build --verbose src

[9:23:13 PM] Projects in this build: 
    * src/tsconfig.json

[9:23:13 PM] Project 'src/tsconfig.json' is up to date because newest input 'src/core/liquid-package.ts' is older than output 'dist/functions/chmod-recursive.js'


> @xpack/xpm-lib@4.0.0-pre lint
> eslint src


> @xpack/xpm-lib@4.0.0-pre test
> tap run --disable-coverage


2> tests/tap/040-liquid-actions.ts
error: "properties.X" not defined

Asserts:  169 pass  0 fail  169 of 169 complete
Suites:     6 pass  0 fail      6 of 6 complete

# No coverage generated
# { total: 169, pass: 169 }
# time=4848.501ms
```

To run a specific test with more verbose output, use `npm run tap *`:

```console
% npm run tap tests/tap/010-functions.ts
> @xpack/xpm-lib@4.0.0-pre test-one-010
> tap run --reporter=tap --disable-coverage tests/tap/010-*.ts

TAP version 14
1..1
# Subtest: tests/tap/010-functions.ts
    # Subtest: filterPath
        ok 1 - preserves posix path separator /
        ok 2 - preserves windows path separator \\
        ok 3 - preserves posix path separator /
        ok 4 - replaces by dash
        ok 5 - replaces by dash
        ok 6 - replaces by dash
        ok 7 - replaces two dashes
        ok 8 - replaces three dashes
        1..8
    ok 1 - filterPath # time=5.033ms
    
    1..1
ok 1 - tests/tap/010-functions.ts # time=1972.021ms

# No coverage generated
# { total: 8, pass: 8 }
# time=1991.621ms
```

### Coverage tests

Coverage tests are a good indication on how much of the source files is
exercised by the tests. Ideally all source files should be covered 100%,
for all 4 criteria (statements, branches, functions, lines).

Thus, in a future release, passing coverage tests will be enforced for
all tests.

#### Coverage exceptions

Exclusions are marked with `/* istanbul ignore next */` for
[istanbul](https://github.com/gotwarlost/istanbul/blob/master/ignoring-code-for-coverage.md)
and `/* c8 ignore start */` `/* c8 ignore stop */` for
[c8](https://github.com/bcoe/c8).

- a platform dependent logic in the `filterPath()` function
- TBD

### Continuous Integration (CI)

The continuous integration tests are performed via GitHub
[Actions](https://github.com/xpack/xpm-lib-ts/actions) on 
multiple platforms, with multiple node versions.

## Tricks & tips

To trace module resolution:

```json
    "compile": "tsc --traceResolution  -p ./",
```

## How to make new releases

### Release schedule

There are no fixed releases.

### Check Git

In the `xpack/xpm-lib-ts` Git repo:

- switch to the `development` branch
- if needed, merge the `master` branch

No need to add a tag here, it'll be added when the release is created.

### Update npm packages

Notice: this package is also used by the VS Code extension and must be
kept as a legacy CommonJS dependency.

- `npm outdated`
- `npm update` or edit and `npm install`
- repeat and possibly manually edit `package.json` until everything is
  up to date
- commit the changes

Keep:

- [`@types/node`](https://www.npmjs.com/package/@types/node?activeTab=versions)
  locked to the oldest supported node (^18.11.9)
  [release](https://nodejs.org/download/release/) available for TypeScript.

To be updated when fully migrated to ESM.

### Determine the next version

As required by npm modules, this one also uses [semver](https://semver.org).

Determine the next version (like `4.0.0`),
and eventually update the
`package.json` file; the format is `4.0.0-pre`.

### Fix possible open issues

Check GitHub issues and pull requests:

- <https://github.com/xpack/xpm-lib-ts/issues/>

### Update `README-MAINTAINER.md`

Update the `README-MAINTAINER.md` file to reflect the changes
related to the new version.

## Update `CHANGELOG.md`

- check the latest commits `npm run git-log`
- open the `CHANGELOG.md` file
- check if all previous fixed issues are in
- add a line _* v4.0.0 released_
- commit with a message like _prepare v4.0.0_

## Prepare to publish

- terminate all running tasks (**Terminal** → **Terminate Task...**)
- select the `development` branch
- commit everything
- `npm run fix`
- in the development branch, commit all changes
- `npm run test`
- `npm run typedoc` and open the `docs/index.html` in a browser
- `npm run pack`; check the list of packaged files, possibly
  update `.npmignore`
- `npm version patch` (bug fixes), `npm version minor` (compatible API
  additions), `npm version major` (incompatible API changes)
- push all changes to GitHub;
- the `postversion` npm script should also update tags via
  `git push origin --tags`; this should trigger CI
- **wait for CI tests to complete**
- check <https://github.com/xpack/xpm-lib-ts/actions/>

## Publish to npmjs.com

- `npm publish --tag test` (use `--access public` when publishing for the first time)

Check if the version is present at
[@xpack/xpm-lib Versions](https://www.npmjs.com/package/@xpack/xpm-lib?activeTab=versions).

### Test

Test it with:

```bash
npm install -global @xpack/xpm-lib@test
```

### Merge into `master`

In this Git repo:

- select the `master` branch
- merge `development`
- push all branches

### Close milestone

In <https://github.com/xpack/xpm-lib-ts/milestones>:

- close the current milestone.

## Web site deployment

The documentation site is built with [TypeDoc](https://typedoc.org/) and
published in the project GitHub
[Pages](https://xpack.github.io/xpm-lib-ts/).

The Web site deployment is performed automatically when pushing to the
master branch, by a dedicated workflow in GitHub
[Actions](https://github.com/xpack/xpm-lib-ts/actions/workflows/typedoc.yml).

### Tag the npm package as `latest`

When the release is considered stable, promote it as `latest`:

- `npm dist-tag ls @xpack/xpm-lib`
- `npm dist-tag add @xpack/xpm-lib@4.0.0 latest`
- `npm dist-tag ls @xpack/xpm-lib`

## Useful links

- <https://www.typescriptlang.org/docs/>
- <https://www.typescriptlang.org/tsconfig/>
- <https://typedoc.org>, <https://typedoc.org/guides/doccomments/>
- <https://tsdoc.org>
- <https://jsdoc.app/index.html>
- <https://redfin.engineering/node-modules-at-war-why-commonjs-and-es-modules-cant-get-along-9617135eeca1>
