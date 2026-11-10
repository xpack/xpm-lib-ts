---
name: create-github-issue
description: 'Draft and open GitHub issues for bugs and enhancements in the xPack xpm core library repository (xpack/xpm-lib-ts), following the project''s title, body, and label conventions. Use when the user asks to "add an issue", "open an issue", "file a bug", "create an enhancement", or to turn the findings of a design review, a code review, or a consistency check into issues.'
argument-hint: 'Short description of the problem or improvement, or a list of findings; optionally the kind (bug or enhancement)'
---

# Create Issue — xPack xpm Core Library

## When to Use

- The user asks to add, open, create, or file a GitHub issue for a bug
  or an enhancement.
- The user asks to turn the findings of a report in
  `maintenance/docs/` (`DESIGN-REVIEW-<n>.md`, `CODE-REVIEW-<n>.md`,
  or `CONSISTENCY-CHECK.md`) into issues, one per finding.

Issues are opened in `xpack/xpm-lib-ts` with the `gh` CLI, run from the
repository root.

## Procedure

1. **Establish the facts.** Read the code the issue refers to, at the
   current `HEAD`, and record the files and the class, method, or
   property names; line numbers are only a secondary pointer. Do not
   cite lines from memory. If the cited files have uncommitted changes,
   cite the committed version or say so.
2. **Reproduce, if it is a bug.** When practical, confirm the
   behaviour with a probe program (see "Confirming Findings with
   Probes" in `.github/skills/review-common.md`), and keep the evidence
   to show the user. State what was observed and what was inferred.
   Record the library version, the Node.js version, the module system
   and the operating system when they matter (the library is ES module
   only).
3. **Check for duplicates:**

   ```sh
   gh issue list --repo xpack/xpm-lib-ts \
     --state all --limit 30 --search "<keywords>"
   ```

   If an issue already covers the problem, report it instead of
   creating a new one, and offer to comment on it.
4. **Choose the labels** (see "Labels").
5. **Draft the title and the body** (see "Title" and "Body"), and write
   the body to a file in the scratchpad folder.
6. **Show the draft** — title, labels, milestone, and full body — and
   wait for explicit approval. Opening an issue is a public action. For
   several issues, present all drafts together.
7. **Create the issue:**

   ```sh
   gh issue create --repo xpack/xpm-lib-ts \
     --title "<title>" \
     --label <label> [--label <label>] \
     --assignee @me \
     [--milestone <version>] \
     --body-file <scratchpad>/issue-body.md
   ```

   List the milestones with
   `gh api 'repos/xpack/xpm-lib-ts/milestones?state=all'`. A milestone
   is named after the release version (for example `5.0.1`); propose
   the one of the upcoming release in the draft. If none matches, ask
   which version to use, or whether to leave the issue without a
   milestone; do not create a milestone without approval. Do not assume
   that a milestone that exists is current (the repository has
   milestones of earlier versions, such as `1.1.0`).
8. **Report** the number and URL; for several issues, a table (number,
   title, labels).

## Labels

Use only the existing repository labels:

- `bug` — the library behaves incorrectly: a wrong expansion, a wrong
  substitution, an inheritance or matrix defect, an unexpected
  exception or error class, a platform-specific failure, a packaging
  defect that breaks the import, or behaviour that contradicts the
  documentation.
- `enhancement` — the library works, but can be improved: new members,
  properties, or filters, performance, refactoring, and TSDoc wording.
- `documentation` — only the website pages or the READMEs are wrong or
  incomplete.
- Other labels (`question`, `help wanted`, `good first issue`,
  `duplicate`, `invalid`, and `wontfix`) are applied by the maintainer;
  do not add them. Run `gh label list --repo xpack/xpm-lib-ts` if in
  doubt.

If the kind is uncertain, say so and ask.

## Title

- State the current problem, not the fix, in the present tense, as a
  full sentence: `A matrix entry with an empty
  array silently produces no configuration`.
- Capitalise the first word (unless it is an identifier in backticks);
  no full stop; under 70 characters.
- Do not prefix the kind (`Bug:`) or a number; the labels carry the
  kind.

## Body

Plain Markdown prose, short, in British English, formal, with no
contractions, and with the Oxford comma. Write each paragraph as one
line, not wrapped: GitHub renders every newline in an issue as a line
break. Use backticks for files, identifiers, and commands. Write commit
hashes bare, without backticks, so that GitHub links them. Do not use
headings or templates; give connected sentences, in this order, only
the parts the issue needs:

1. **Location.** The file and the class or member, for example
   `` `src/classes/build-configurations.ts`, `BuildConfigurations.initialise()`: ``.
2. **Observation.** What happens, precisely: the steps or the probe,
   the observed result, the expected result, the environment when
   relevant, and the cause if known. Mark estimates.
3. **Scope.** Only if it changes the decision: the Node.js versions,
   the operating systems, or the `xpack` properties affected.
4. **Proposed change.** In the imperative; when several solutions are
   possible, list them with the trade-offs.
5. **References**, if any: `Found while fixing #17.`

### Length

At most two paragraphs plus a reference line, normally no more than
about 150 words. State the evidence in a clause; give full logs only
when needed. A probe program and its output are quoted, in a code
block after the paragraphs, only when they are short (about ten lines)
or when the problem cannot be understood without them. A simple
finding is a single paragraph of two or three sentences. Do not
describe work already done on the fix.

## Issues from Review Findings

- One issue per numbered finding; each issue is self-contained and does
  not cite the finding number (it would be confused with a GitHub
  number).
- Check the location, evidence, and proposal against the current
  `HEAD`, because the review may be older than the code.
- Check for duplicates for each finding.
- A **[breaking]** finding is labelled `enhancement` or `bug` as its
  kind says, and its body states that the change needs a major
  version.
- After creation, ask the user before recording the issue number in the
  report; record it as a line `Issue #N.` at the end of the item, in
  the format described under "Review Documents" in
  `.github/skills/github-commit/SKILL.md`, so that the commit that fixes
  it finds the item.

## Example

Title: `The <member> <does the wrong thing> when <condition>`

Labels: `bug`

```markdown
`src/classes/<file>.ts`, `<Class>.<member>`: <what happens, with the probe that shows it and its observed output, against the expected result>. <The proposed change, in the imperative.>

Found while fixing #17.
```

(The example is a template; it states no real defect. Every statement
in an issue must come from a probe or from reading the code at `HEAD`.)

## After the Issue Is Fixed

The fix is committed with the `github-commit` skill, which also adds
the closing comment to the issue; the issue is not closed by hand.
