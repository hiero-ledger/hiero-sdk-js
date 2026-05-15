# Post-Merge Release Finalization

Finalize a release after the release PR has been approved and merged to main. This command handles tagging, pushing, and formatting GitHub release notes.

## Steps

### 1. Checkout main and pull latest

```
git checkout main
git pull origin main
```

### 2. Determine the release version

Read the version from the root `package.json`. Determine if it's a stable or beta release by checking for `-beta.` in the version string.

### 3. Create annotated tag

- Stable: `git tag -a v<version> -m "Stable tag v<version>"`
- Beta: `git tag -a v<version> -m "Beta tag v<version>"`

### 4. Push the tag

```
git push origin v<version>
```

This triggers the `publish_release.yaml` workflow automatically.

### 5. Monitor release workflow

Check the workflow status:
```
gh run list --workflow=publish_release.yaml --limit 5
```

Wait for the workflow triggered by the tag push to complete. Poll periodically (every 30 seconds) using:
```
gh run list --workflow=publish_release.yaml --limit 1 --json status,conclusion,headBranch
```

If the workflow fails, report the failure to the user with a link to the run.

### 6. Format GitHub release notes

The shape of the notes is the same for stable and beta — what differs is the input set, and for stable that prior matching betas are rolled up so end users see the full picture in one place.

#### 6a. Beta release

Fetch the merged PRs that were part of this release. You can get them from the `CHANGELOG.md` entry for this version, or re-run:
```
node scripts/release-helpers.mjs get-previous-tag
```
to get the tag before this one, then:
```
node scripts/release-helpers.mjs list-prs-since <previous-tag>
```

#### 6b. Stable release — roll up matching betas

The release notes for a stable `v<X.Y.Z>` must duplicate (not link to) every bullet from each matching `v<X.Y.Z>-beta.<N>` GitHub release, plus any post-last-beta PRs.

1. List matching beta tags:
   ```
   node scripts/release-helpers.mjs list-matching-beta-tags <sdk-stable-version>
   ```
2. For each matching beta tag, fetch its existing GitHub release body and extract the section bullets (`### Enhancements`, `### Bug Fixes`, `### Dependency Changes`, `### Documentation`, `### Breaking Changes`):
   ```
   gh release view v<X.Y.Z>-beta.<N> --json body -q .body
   ```
3. Add any PRs merged after the highest matching beta tag — `node scripts/release-helpers.mjs list-prs-since <highest-matching-beta-tag>` — into the appropriate sections.
4. Dedupe by PR number across the union.
5. Write a fresh **summary paragraph** at the top that recaps the cumulative theme of the release (e.g., "This release ships HIP-1137 (Registered Node Address Book) plus …"), then the merged sections.
6. Do **not** insert "see vX.Y.Z-beta.N notes for details" links — duplicate the actual content into the stable notes.
7. After posting, mark the release as **not** a prerelease:
   ```
   gh release edit v<X.Y.Z> --notes-file /tmp/release-notes.md --prerelease=false
   ```
   (For beta, use `--prerelease` instead.)

#### Notes file format (both paths)

Write a release notes file (e.g., `/tmp/release-notes.md`) in this exact format:

```
## [Unreleased]

<One or two paragraph summary of the key changes in this release. Mention any HIP support, breaking changes, or major features prominently.>

### Breaking Changes
- Description of breaking change. [#<number>](<pr-url>)

### Upgrading
For migration details, please refer to the [Migration Guide](/manual/).

### Enhancements
- `ClassName.methodName`: Description of enhancement. [#<number>](<pr-url>)

  **Usage Example:**

  ```js
  // code example if applicable
  ```

### Bug Fixes
- **Component:** Description of fix. [#<number>](<pr-url>)

### Dependency Changes
- Upgraded `package-name` from version X to Y. [#<number>](<pr-url>)

### Documentation
- Description of doc improvement. [#<number>](<pr-url>)
```

**Rules:**
- Omit any section that has no entries
- The summary paragraph should highlight the most important changes
- For enhancements, prefix with the relevant class/method name in backticks when applicable
- For bug fixes, prefix with the affected component in bold when applicable
- Include code examples for significant new APIs or changes
- Include HIP links where relevant: `[HIP-<number>](https://hips.hedera.com/hip/hip-<number>)`
- Production dependency upgrades go in "Dependency Changes", not "Enhancements"

Then update the GitHub release:
```
gh release edit v<version> --notes-file /tmp/release-notes.md
```

If no release exists yet (the workflow creates it), wait for it or create it:
```
gh release create v<version> --title "v<version>" --notes-file /tmp/release-notes.md
```

### Done

Inform the user that:
1. Tag `v<version>` has been pushed
2. The release workflow has completed (or link to it if still running)
3. GitHub release notes have been formatted
4. The release is now live on npm
