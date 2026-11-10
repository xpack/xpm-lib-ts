---
name: github-commit
description: 'Prepare and create a git commit in the xPack xpm core library repository (xpack/xpm-lib-ts), following the project''s commit message conventions, and add the closing comment to the GitHub issue it fixes. Use when the user asks to "commit", "make a commit", "commit the fix", or to write a commit message for the current changes.'
argument-hint: 'Optional: the GitHub issue number (#N), and whether the commit completes the issue'
---

# Commit — xPack xpm Core Library

## When to Use

- The user asks to commit the current changes, or a subset of them.
- The user asks for a commit message for the staged or unstaged
  changes.

Never commit without explicit user approval of the file list and the
message.

## Procedure

1. **Inspect the working tree.** Run `git status` and `git diff` (and
   `git diff --cached` if anything is staged). Identify which changes
   belong to this commit; the working tree often has changes unrelated
   to it (for example the regenerated common files, the review reports
   in `maintenance/docs/`, the skills, or `CLAUDE.md`), and untracked
   files, which must not be included unless the user says so. The
   compiled `dist/` folder is committed to this repository, but in a
   separate commit (see "Compiled output").
2. **Identify the issue**, if any. Fixes of reported problems refer to
   a GitHub issue (`#17: ...`); maintenance commits (dependency bumps,
   re-generated commons, website updates, release preparation) have
   none. If the user did not give a number and it cannot be determined
   with certainty from the conversation, ask; do not guess. If a fix
   has no issue, offer to create one with the `create-github-issue`
   skill.
3. **Verify the build.** Run `npm run compile` and `npm test` (which
   runs the lint first, and checks the coverage); both must pass.
   Changes limited to `website/` or to the generated common files do
   not need the library tests; say so. Report failures; do not commit
   over them without explicit approval.
4. **Check consistency.** If an exported member, a type, a
   substitution variable, or the packaging changed, the TSDoc comments,
   the tests, `src/README.md`, and the website pages that describe it
   must be updated in the same commit. Do not stage `dist/` together
   with source changes, and never stage `*.tgz` files (they are
   ignored).
5. **Draft the message** (see "Message Format") and write it to a file
   in the scratchpad folder.
6. **Show the user** the list of files and the full message, and wait
   for approval.
7. **Stage and commit** only the approved files, by name (no
   `git add -A` or `git add .`):

   ```sh
   git add <file> ...
   git commit -F <scratchpad>/commit-message.txt
   ```

   Do not amend, rebase, or skip hooks (`--no-verify`) unless asked.
   If a hook fails, fix the cause and create a new commit. Do not push
   unless asked.
8. **Report** the hash and subject, with
   `git log -1 --format='%h %s'`.
9. **Update the issue**, if the commit has `Fixes #N` (see "Issue
   Comment"). The comment is posted only after the commit is pushed;
   if it is not pushed yet, tell the user that the comment is pending,
   and post it when the user asks for the push (or says that it was
   pushed).
10. **Ask whether to update the review documents** that list the issue
    or the finding it came from (see "Review Documents").

Do not start the next fix while this one is uncommitted.

## Message Format

### Subject

- With an issue: `#N: ` followed by a summary in the imperative mood,
  for example `#16: simplify xpm init messages`; without an issue, the
  summary alone (`website: re-generate commons`, `package.json update`,
  `dist update`). A change limited to one source file may start with
  its name (`build-configurations.ts: fix eslint`).
- Follow the existing history: the summary starts in lower case, has
  no full stop, and is at most 50 characters including the `#N: `
  prefix. Changes to the website start with `website: `.
- Describe the change, not the problem.
- Do not add type prefixes (`fix:`, `feat:`); this repository does not
  use Conventional Commits.

### Body

Optional for trivial changes; recommended for any fix. Separated from
the subject by a blank line, wrapped at 72 characters, in British
English, formal, with no contractions and with the Oxford comma.
Identifiers, files, and members are written plainly. Explain what and
why, not how: the previous behaviour and why it was a problem, then the
change, then how it was verified (the test added, or the probe).

### Trailers

After the body, separated by a blank line:

- `Fixes #N` — only on the commit that completes the issue.
- The attribution trailer required by the agent's environment, if any
  (for example `Co-Authored-By: ...`), copied exactly as given, as the
  last line.

### Release commits

Release commits are mechanical and are made by the maintainer during a
release (the procedure is in the maintainer pages of the website, under
`website/docs/maintainer/`): the `CHANGELOG.md` update, and the version
bump made by `npm version`, whose `postversion` script pushes the
branches and the tags. Do not create them, and do not run `npm
version`, unless the user is performing a release.

### Example

```text
#23: <summary of the change in the imperative>

<The previous behaviour, and why it was a problem.>

<The change made.> <How it was verified: the test added in
tests/tap/, or the probe.>

Fixes #23
```

(The example is a template; the issue number is a placeholder.)

## Issue Comment

After a commit with `Fixes #N`, add a comment to the issue, after the
commit is pushed (GitHub links a hash only then, and an amend changes
it):

```sh
gh issue comment <N> --repo xpack/xpm-lib-ts \
  --body-file <scratchpad>/issue-comment.md
```

- Start with `Fixed in <short hash>`, followed by a brief explanation
  of what was changed, what was deliberately not changed and why, and
  how it was verified.
- Write the hashes bare, without backticks, so that GitHub links them.
- If the proposal in the issue was not followed, say so and why.
- One line per paragraph, in Markdown, with backticks for identifiers;
  GitHub renders every newline in an issue comment as a line break,
  so the paragraphs are not wrapped.
- End with a separate line `Fixed on YYYY-MM-DD.`, from
  `git log -1 --format=%cs`.
- Do not close the issue; it is closed when the commit reaches the
  default branch.

Show the comment to the user before posting it, unless already
approved. Posting a comment is a public action.

## Review Documents

The findings that lead to issues are often recorded in the review
reports in `maintenance/docs/` (`DESIGN-REVIEW-<n>.md`,
`CODE-REVIEW-<n>.md`, and `CONSISTENCY-CHECK.md`). After the commit,
search them for the issue and the finding. When the finding came from
a known report (for example, the issue was created from
`DESIGN-REVIEW-2.md`), search that report first, by the words of the
issue title and by the item number; otherwise search all of them:

```sh
grep -n -i -E '<words from the issue title>|\(#<N>\)|issue #<N>' \
  maintenance/docs/*.md
```

Replace `<N>` with the number of the issue. In the reports, a `#K` at
the start of an item is the number of the finding within the report,
not a GitHub issue number; match the GitHub number where it is used
as such (in parentheses, or after "issue" or "fixed in"), and confirm
the item by its content.

When an issue is created from an item (see the `create-github-issue`
skill), its number is recorded as a line `Issue #N.` at the end of the
item, which the search above finds:

```markdown
- **#7 — <short title>.** [internal] **[confirmed]**
  ...
  Issue #61.
```

If an item refers to the issue or to the same finding, **ask the user**
whether to update it, and show the proposed text. Then add `(fixed)`
after the tags of the item (after the title, for the items that have
no tags, as in `CONSISTENCY-CHECK.md`), and a line at its end that
mentions both the short commit hash and the GitHub issue number:

```markdown
- **#7 — <short title>.** [internal] **[confirmed]** (fixed)
  ...
  Issue #61.
  Fixed in `a8733dc` (#61): <what was done>.
```

Do not change the `Date:` line of the report; it records when the
review was run, and decides which report is the most recent.

Summarise what was done, and state where the fix differs from the
recommendation of the report. For an intermediate commit of an issue
fixed in several commits, ask whether to record it as partial
(`Partly fixed in ... (#N): ...`). For a withdrawn finding, write
`Withdrawn (#N): <reason>.` instead, and add `(withdrawn)` after the
tags.

Write the hashes in backticks, since the reports are read as files in
the repository, unlike the issue comments. Do not stage the report in
the commit of the fix; the user commits it separately, when they ask.

## Compiled output

`dist/` (the `.js`, `.d.ts`, and `.map` files) is tracked by git, so
that the package can be used straight from the repository, although the
`*.d.ts` and `*.js.map` patterns are in `.gitignore`. It is committed
separately from the source changes, with the subject `dist update`,
after `npm run compile` has regenerated it. Offer to make that commit
after a source commit, check with `git status` that only `dist/` files
are staged (new `.d.ts` files need `git add -f`), and do not mix it with
anything else. Do not regenerate or stage `dist/` unless the user asks.

## CHANGELOG

`CHANGELOG.md` lists commits (`hash message`) under the date of the
commit, in reverse chronological order, and a line such as `v5.0.0
prepared` for a release; it is updated during release preparation, not
in each commit. Do not edit it as part of an ordinary commit.

## Branches

Work is committed on `development`. `master` receives merges at
release time only; never commit directly to it. The repository has
other branches (`develop`, `website`); do not commit to them unless the
user says so. Website changes are made in `website/` on `development`
(see the `website: ` subject prefix).
