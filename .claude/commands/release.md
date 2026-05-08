# Release Preparation

Prepare a new release of the hiero-sdk-js SDK. This command handles analysis, triage, version bumping, changelog generation, validation, and PR creation.

## Steps

### 1. Checkout main and pull latest

Run:
```
git checkout main
git pull origin main
```

### 2. Fetch the previous release tag

Run:
```
node scripts/release-helpers.mjs get-previous-tag
```
Store the returned tag for use in subsequent steps.

### 3. List merged PRs since the previous tag

Run:
```
node scripts/release-helpers.mjs list-prs-since <tag>
```
This returns a JSON array of merged PRs with their number, title, body, files, url, and labels.

### 4. Detect sub-package changes

Run:
```
node scripts/release-helpers.mjs detect-subpackage-changes <tag>
```
This returns JSON indicating whether `proto` and/or `cryptography` have source code changes requiring a release.

### 5. Triage PRs

Review the PR list and classify each PR. Use conventional commit prefixes in the PR title as the primary signal:

**Include** (user-facing changes):
- `feat:` - New features
- `fix:` - Bug fixes
- Breaking changes (any prefix)
- `chore(deps):` - Only if it bumps **production** dependencies (not dev-only)
- `refactor:` - Only if it changes public API behavior or output

**Exclude** (internal/developer changes):
- `chore(release):` - Release commits
- `chore(deps-dev):` - Dev dependency updates
- `chore(deps):` - Dev-only dependency updates (e.g., in /tck, test tooling)
- `ci:` - CI/CD changes
- `docs:` - Documentation typo fixes only
- `chore(ci):` - CI configuration
- PRs that only fix typing/type annotations without behavioral changes
- PRs that only update test infrastructure
- PRs whose changes are exclusively in the `tck/` directory

For borderline cases, use judgment: does this change affect the end user (consumer of the SDK)? If yes, include it.

**Structured PR bodies:** PRs created via the `/issue` command include `Release Category` and `Release Notes` fields in the body. When present, prefer these over manual classification — use the `Release Category` for changelog section placement and the `Release Notes` text for the changelog entry.

**Present the triaged list to the user for confirmation** using AskUserQuestion. Show two groups:
1. "Included PRs" - with PR number, title, and proposed changelog category (Added/Changed/Fixed/Removed/Documentation)
2. "Excluded PRs" - with PR number and title

Ask the user to confirm or adjust the triage.

### 6. Prompt for release type

Ask the user using AskUserQuestion: "Stable Release" or "Beta Release"

### 7. Compute next versions

Read the current version from the root `package.json`.

Run for the SDK:
```
node scripts/release-helpers.mjs compute-next-version <current-sdk-version> <stable|beta>
```

For each eligible sub-package (proto, cryptography), read its current version from its `package.json` and run:
```
node scripts/release-helpers.mjs compute-next-version <current-subpkg-version> <stable|beta>
```

The release type (stable/beta) is the same for the SDK and all sub-packages.

### 8. Create release branch

Create the release branch:
- Stable: `git checkout -b release-v<sdk-version>`
- Beta: `git checkout -b release-v<sdk-version>`

The branch name always matches the full version including beta suffix if applicable (e.g., `release-v2.83.0` or `release-v2.83.0-beta.1`).

### 9. Bump versions

Build the bump-versions command with the computed versions:
```
node scripts/release-helpers.mjs bump-versions <sdk-version> [--proto <proto-version>] [--cryptography <crypto-version>]
```

Only include `--proto` and `--cryptography` flags for sub-packages that are eligible for release (detected in step 3).

### 10. Generate changelog

The shape of the entry is the same for stable and beta — what differs is the **input set of PRs** and, for stable, that prior matching betas are rolled up into a single self-contained entry so end users see the full picture in one place.

#### 10a. Beta release

Using the triaged PR descriptions from step 5, write a changelog entry file at `/tmp/changelog-entry.md` in the format below. The PR set is exactly the triaged set from step 5 (PRs since the previous tag).

#### 10b. Stable release — roll up matching betas

A "matching beta" is any tag of the form `v<sdk-stable-version>-beta.<N>`, e.g. for stable `v2.84.0` the matching betas are `v2.84.0-beta.1`, `v2.84.0-beta.2`, …

1. List matching beta tags:
   ```
   node scripts/release-helpers.mjs list-matching-beta-tags <sdk-stable-version>
   ```
   (Tags are returned ascending by `N`. The highest is the most recent matching beta.)
2. Build the PR set as the **union** of:
   - every PR already documented in each matching beta's `CHANGELOG.md` entry (extract the `[#<number>](...)` references from each `# v<X.Y.Z>-beta.<N>` section), **and**
   - every PR merged since the highest matching beta tag, via `node scripts/release-helpers.mjs list-prs-since <highest-matching-beta-tag>`. Triage that "post-beta" subset with the user (same rules as step 5).
3. **Triage carry-over**: each PR already classified in a prior matching beta keeps the category it had there. Only re-prompt for the post-beta PRs. Show the merged final list to the user for confirmation via `AskUserQuestion`.
4. Compose `/tmp/changelog-entry.md` with the merged content, deduped by PR number.
5. **Do not delete** the prior `# v<X.Y.Z>-beta.<N>` entries from `CHANGELOG.md`. Leave them as historical record. The new `# v<X.Y.Z>` entry is inserted **above** them by `insert-changelog` (same call as for beta).

Rationale: a consumer reading the stable `# v<X.Y.Z>` section should see every change in this version line without having to chase the per-beta entries.

#### Entry format (both paths)

```
# v<sdk-version>

### Added
- Description of feature. [#<number>](<pr-url>)

### Changed
- Description of change. [#<number>](<pr-url>)

### Fixed
- Description of fix. [#<number>](<pr-url>)

### Removed
- Description of removal. [#<number>](<pr-url>)

### Documentation
- Description of doc change. [#<number>](<pr-url>)
```

**Rules:**
- Omit any section that has no entries
- Each entry should be a concise, user-facing description derived from the PR title and body
- Always include the PR link in the format `[#<number>](<url>)`
- For HIP-related changes, include the HIP link: `[HIP-<number>](https://hips.hedera.com/hip/hip-<number>)`
- For stable: every PR from any matching beta must appear in exactly one section, deduped by number

Then insert it into CHANGELOG.md:
```
node scripts/release-helpers.mjs insert-changelog <sdk-version> /tmp/changelog-entry.md
```

### 11. Run validation

Run each of these commands sequentially:
```
task lint
task update:addressbooks
task examples:build
```

If any command fails:
1. Read the error output carefully
2. Investigate the root cause
3. Fix the issue automatically (e.g., run `task format` for lint issues, fix code errors)
4. Re-run the failing command to confirm the fix
5. Continue with the remaining commands

### 12. Commit and create PR

Stage all changes and commit:
```
git add package.json packages/proto/package.json packages/cryptography/package.json CHANGELOG.md
git commit -s -S -m "chore(release): v<sdk-version>"
```

The `-s` flag adds a `Signed-off-by` trailer (DCO sign-off) and `-S` GPG-signs the commit. Both are required for release commits — do not omit either flag, and do not use `--no-verify`, `--no-gpg-sign`, or `-c commit.gpgsign=false`.

Also stage any files that were fixed during validation.

Push and create a PR:
```
git push origin <branch-name>
```

Create the PR with `gh pr create`. **The PR title must match the top-most release commit subject exactly** — i.e. `chore(release): v<sdk-version>` for both stable and beta. Do not use a different title style for the PR (no "Beta release: ..." or "Stable release: ..." titles).

The PR **body** is where the human-readable summary goes. Include:
- A heading line indicating release type, e.g. `## Beta release: v<sdk-version>` or `## Stable release: v<sdk-version>`
- Version summary (SDK version, and sub-package versions if bumped)
- The changelog entry content

### Done

Inform the user that the release PR has been created and that they should:
1. Review and approve the PR
2. Merge it to main
3. Run `/release-post-merge` to create the tag and publish
