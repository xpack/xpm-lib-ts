# Website

This website is built using [Docusaurus](https://docusaurus.io/),
a modern static website generator.

The folder was created with:

```sh
npx create-docusaurus website classic --typescript
```

## The API reference

The pages under `docs/api` are generated from the TSDoc comments of the
library, with `@microsoft/api-extractor`, `@microsoft/api-documenter`, and
`@xpack/tsdoc2docusaurus-cli`:

```sh
cd website
npm run generate-website-tsdoc
```

The configuration files are in the `config` folder. The generated pages
must not be edited; to change them, edit the TSDoc comments in
`src/lib/logger.ts`, and generate the pages again.

- https://api-extractor.com
- https://xpack.github.io/tsdoc2docusaurus/
