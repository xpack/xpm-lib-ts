# Rules Shared by the Review Skills

This file is read by the `code-review`, `design-review`, and
`consistency-check` skills, and by the `github-commit` and
`create-github-issue` skills where they refer to review reports. It is
not a skill.

## Judging Findings

- Report a problem only when it can mislead a user, cause a wrong
  result, cost resources, open a security hole, or make the code
  harder to understand or maintain. Do not report a preference.
- Each finding cites the file and the line, states the problem
  directly, gives the evidence (the probe and its output, the
  reproduction steps, or the code path), and proposes a concrete
  change. When several solutions are reasonable, offer them and leave
  the decision to the maintainer.
- Verify every line number before writing it.
- Do not soften findings; state flaws directly.
- Tag each finding:
  - **[breaking]** when the suggested change alters the contract with
    the users of the library (xpm itself and the xpm enabled projects
    that import it): the names exported by `src/index.ts`, the
    signatures and behaviour of the exported classes and functions
    (including the two-phase `initialise()` protocol), the shape of the
    types in `src/types/`, the names and values of the substitution
    variables (`env`, `os`, `path`, `package`, `properties`,
    `configuration`, `matrix`), the Liquid filters, the inheritance and
    matrix expansion rules, the error classes and their messages that
    callers match, the `xpack` JSON properties that are accepted, the
    `exports` map and the files shipped in the package, or the minimum
    supported Node.js version;
  - **[internal]** when it does not;
  - **[confirmed]** when a probe or a reproduction confirmed it.
- For each **[breaking]** finding, state that it requires a major
  version (semantic versioning), propose a migration path (keep the
  old member as deprecated, with a TSDoc `@deprecated` tag, for one
  major version), or give the reason why that is not possible, and the
  text that the release notes should give to the users.

## Confirming Findings with Probes

A suspected defect is reported as a defect only after it has been
reproduced; otherwise say that it is derived from reading the code.

Write small probe programs in the scratchpad folder, never in the
repository:

1. Run `npm run compile`, so that `dist/` is current.
2. Write an ES module probe (`.mjs`) that imports the library by the
   absolute path of `dist/index.js`. The package is ES module only;
   there is no CommonJS entry point.
3. Build the inputs in memory (a `package.json` object, an `xpack`
   section, a minimal `Context`), or use the folders in
   `tests/fixtures/`; pass a `Logger` from `@xpack/logger` created with
   the level `silent` or `debug`, as the case requires. For file
   system behaviour, work in a new folder under the scratchpad.
4. Run the probe with `node`, and keep the output as the evidence.

Do not use `ts-node` or edit the sources to build a probe. For a
suspected defect that the existing tests could show, prefer reading
`tests/tap/` and running the single test (see `CLAUDE.md`).

## Numbering

Every actionable item in a report gets a permanent number, `#1`,
`#2`, and so on, counting through the whole report (not restarting in
each section), so that the user can refer to any of them (for example
"fix #12"). The descriptive parts of the report (the header, the
summary) and the lists of what was found sound are not numbered. Each
new report starts again from `#1`, so an item is identified by the
report and the number (for example `DESIGN-REVIEW-3.md #12`).

- Each problem is a separate item; several occurrences of the same
  problem are one item. Do not group independent problems under one
  number; a sub-list is acceptable only for the details of a single
  problem.
- The summary and the suggested order of work refer to the items by
  number.
- Numbers never change once assigned, and are never reused.
- An item that is fixed later is marked `(fixed)` as described under
  "Review Documents" in `.github/skills/github-commit/SKILL.md`.
- An item that turns out to be wrong is marked `(withdrawn)` with the
  reason; it is not deleted.

## Report Files

Reports are written in the `maintenance/docs/` folder (create it if it
does not exist; add it to `.npmignore` if it is not excluded from the
npm package, and tell the user), in British English and a formal tone
(no contractions, the Oxford comma, "folder" rather than "directory"),
with lines shorter than 80 characters, except inside code blocks when
unavoidable. Paths in a report are relative to the repository root.

| Skill               | Report file                                  |
| ------------------- | -------------------------------------------- |
| `design-review`     | `maintenance/docs/DESIGN-REVIEW-<n>.md`      |
| `code-review`       | `maintenance/docs/CODE-REVIEW-<n>.md`        |
| `consistency-check` | `maintenance/docs/CONSISTENCY-CHECK.md`      |

`<n>` is one more than the highest number among the existing files of
the same kind (list the file names only; `1` if there are none). Never
overwrite an existing numbered report. The `consistency-check` report is
a single file that is updated in place.

The `Date:` line of a report gives the local time at which it was run
(`date '+%Y-%m-%d %H:%M'`). It is never changed afterwards, not even
when items are marked `(fixed)` or `(withdrawn)`, because it decides
which report is the most recent (see below). The exception is
`CONSISTENCY-CHECK.md`, where it is updated when a new check is run,
and only then.

## Acting on an Item

When the user refers to a number (for example "fix #7"), it refers to
the most recent report, unless the user names another report. The most
recent report is the one with the latest `Date:` line among the files
in `maintenance/docs/`; the modification times of the files do not
count, since marking an item changes them.

1. Make sure that the previous fix is committed; do not start a new
   fix on top of uncommitted changes.
2. If the item has no GitHub issue, offer to create one with the
   `create-github-issue` skill, since the commit subject refers to it,
   and record its number in the report as described there.
3. Change the code, keeping the tests and the TSDoc comments consistent
   with it.
4. Run `npm run compile` and `npm test` (which runs the lint first),
   run the probe again, and report the outcome. A defect fix needs a
   new test in `tests/tap/` (in the file that mirrors the changed
   source file) that fails without the fix, and the 100% coverage
   thresholds in `.taprc` must still hold.
5. Commit only when the user asks, following the `github-commit`
   skill. Do not stage the report in the commit of the fix.
6. After the commit, mark the item `(fixed)` in the report that lists
   it, as described under "Review Documents" in the `github-commit`
   skill. Leave the report uncommitted; the user commits it
   separately, when they ask.
