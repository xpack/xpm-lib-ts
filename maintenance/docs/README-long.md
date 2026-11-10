[![GitHub package.json version](https://img.shields.io/github/package-json/v/xpack/xpm-lib-ts)](https://github.com/xpack/xpm-lib-ts/blob/mater/package.json)
[![license](https://img.shields.io/github/license/xpack/xpm-lib-ts.svg)](https://github.com/xpack/xpm-lib-ts/blob/xpack/LICENSE)
[![npm (scoped)](https://img.shields.io/npm/v/@xpack/xpm-lib.svg)](https://www.npmjs.com/package/@xpack/xpm-lib/)

# A Node.js ES6 module with the xpm library

This project provides a **TypeScript** Node.js **ES6** module with
the **xpm** code that might be shared with xpm-enabled projects, like the
[VS Code xPack C/C++ Managed Build](https://github.com/xpack/vscode-xpack-extension-ts/)
extension.

The project is open-source and hosted on GitHub as
[xpack/xpm-lib-ts](https://github.com/xpack/xpm-lib-ts.git).

## Maintainer & developer info

This page documents how to use this module in an xpm-enabled project.
For maintainer information, see the separate
[README-MAINTAINER](https://github.com/xpack/xpm-lib-ts/blob/master/README-MAINTAINER.md)
page.

## Prerequisites

A recent [Node.js](https://nodejs.org) (>=20.0.0), since the TypeScript code
is compiled into ECMAScript 2020 code, and the tests use ES6 modules.

## Install

The module is available as
[`@xpack/xpm-lib-ts`](https://www.npmjs.com/package/@xpack/xpm-lib-ts)
from the public [`npmjs`](https://www.npmjs.com) repository;
it can be added as a dependency to any TypeScript or JavaScript
project with `npm install`:

```console
npm install --save @xpack/xpm-libs@latest
```

The module does not provide any executables, and generally there are no
reasons to install it globally.

## User info

This section is intended for those who want to use this module in their
xpm-enabled projects.

The `@xpack/xpm-lib` module can be imported into both TypeScript
and JavaScript Node.js code.

In TypeScript and ECMAScript modules, use `import`:

```typescript
import { XpmPackage } from '@xpack/xpm-lib'
```

To use the `XpmPackage` class, provide the path to the 
`package.json` file and a logger.

TBD

### Reference

For more details on the available class definitions, including all methods,
accessors, properties, etc,
please see the TypeDoc
[reference pages](https://xpack.github.io/xpm-lib-ts/).

## Known problems

- none

## Status

The `@xpack/xpm-lib-ts` module is fully functional and stable.

The main clients for this module is the `xpm` CLI application and the
[VS Code xPack C/C++ Managed Build](https://github.com/xpack/vscode-xpack-extension-ts/)
extension.

## Tests

The module is CI tested on every push via GitHub
[Actions](https://github.com/xpack/xpm-lib-ts/actions).

100% coverage is planned for a future release.

## Compatibility notices

According to [semver](https://semver.org) rules:

> Major version X (X.y.z | X > 0) MUST be incremented if any
backwards incompatible changes are introduced to the public API.

### v4.0.0

The API was updated after template instantiation was implemented.
Only `initialise()` is async for actions and build configurations.

### v3.0.0

The API was greatly extended to use XpmPackage & XpmLiquid*.
The project was renamed xpm-lib and updated to ESM only.

### v2.0.0

The project was updated to dual ESM & CJS.

## License

The original content is released under the
[MIT License](https://opensource.org/license/mit),
with all rights reserved to
[Liviu Ionescu](https://github.com/ilg-ul).
