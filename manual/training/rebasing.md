# Rebasing

## Keeping Your Fork and Branch Up to Date with Main

Rebases keep your branch in-sync with the upstream main, meaning you are working on the latest version of the codebase. This means the methods you are using are up-to-date and you avoid merge-conflicts.


### Step by Step Guide to Rebase

#### 1. Add the original repo as a remote called "upstream"
Only do this once per repository clone.

If not already done:
```bash
git remote add upstream https://github.com/hiero-ledger/hiero-sdk-js.git
```

#### 2. Sync your main on your fork
Each time you want to sync:
- Sync your fork's main with the upstream main changes:
 
```bash
  git checkout main
  git fetch upstream
  git pull upstream main
  git push origin main
```

You can also do this by visiting your repository `"https://github.com/YOUR_GITHUB_NAME/hiero-sdk-js"` and clicking the sync fork button which is a few lines from the top near the right. Then pull these changes locally in Github Desktop.

#### 2. Sync your working branch

Your fork’s `main` branch is now up to date, but **your working branch is not**.

To bring your branch in sync with the latest changes, apply a **rebase**.  
This keeps history clean and ensures your commits remain eligible for review.

To rebase:

```bash
git checkout mybranch
git rebase main -S
```

> ⚠️ **Always include the -S flag**  
> ⚠️ **Do NOT merge `main` into your branch**  

### 3. Verify Sign Status
Verify after the rebase operation, your n commits are still signed correctly:

```bash
git log -n --pretty=format:'%h %an %G? %s'
```
You should see `G` (valid signature). If you experience signing issues, read [Signing Guide](signing.md)

## Handling Conflicts:
If conflicts occur during rebase, See [Merge Conflict Guide](merge-conflicts.md) for detailed guidance.

> ⚠️ **Regularly** rebase your branch to avoid merge conflicts

### Helpful Resources
- [Signing Guide](signing.md)
- [Rebasing Guide](rebasing.md)
- [Discord](discord.md)