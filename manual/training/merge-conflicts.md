## Handling Conflicts

Merge conflicts are caused by working on outdated versions of the codebase, or another developer merging a change involving similar parts of the codebase to you.

> ⚠️ **Avoid Merge Conflicts** by syncing your branch regularly [Sync Guide](rebasing.md)
## Table of Contents

- [Handling Conflicts](#handling-conflicts)
- [Step by Step Guide to Resolve Merge Conflicts](#step-by-step-guide-to-resolve-merge-conflicts)
  - [1. See which files are conflicted](#1-see-which-files-are-conflicted)
  - [2. Understand what conflicts](#2-understand-what-conflicts)
  - [3. Decide what the final code should be](#3-decide-what-the-final-code-should-be)
  - [4. Resolve conflicts in VS Code (recommended)](#4-resolve-conflicts-in-vs-code-recommended)
    - [Steps to resolve in VS Code](#steps-to-resolve-in-vs-code)
      - [1. Open the conflicted file in VS Code](#1-open-the-conflicted-file-in-vs-code)
      - [2. Look at both the Incoming Change and Current Change panels](#2-look-at-both-the-incoming-change-left-and-current-change-right-panels)
      - [3. Edit the Result pane](#3-in-the-result-lower-pane-edit-the-file-so-it-contains-the-correct-final-version)
      - [4. Save the resolved file](#4-save-the-lower-pane-file-once-there-are-no-more-merge-conflicts-to-resolve-in-this-file)
      - [5. Stage the resolved files](#5-click-the-add-button-next-to-the-file-to-resolve-conflicts-or)
      - [6. Continue the rebase](#6-continue-the-rebase)
      - [7. Resolve remaining conflicts](#7-if-there-are-more-conflicts-in-other-files-vs-code-will-automatically-move-you-to-the-next-one-repeat-until-no-conflicts-remain)
      - [8. Push changes](#8-push-changes)
  - [Common issues](#common-issues)
  - [If you need to stop](#if-you-need-to-stop)
  - [What NOT to do](#what-not-to-do)
- [Recovery Tips](#recovery-tips)
  - [If you are completely stuck](#if-you-are-completely-stuck)
- [Helpful Resources](#helpful-resources)


## Step by Step Guide to Resolve Merge Conflicts

### 1. See which files are conflicted
```bash
git checkout mybranch
git status
```

### 2. Understand what conflicts
You will see sections like:

```text
<<<<<<< HEAD
code from main
======= 
your branch’s code
>>>>>>> mybranch     
```

### 3. Decide what the final code should be

Have a vision of what you'd like the final code to look like, given what is currently on main and what you'd like to propose.

- > ⚠️ **WARNING: Do not blindly accept both changes**
- > ⚠️ **WARNING: Do not blindly accept incoming**
- > ⚠️ **WARNING: Do not blindly accept existing**

Merge conflicts require: ✅ Human interpretation

Sometimes you'll be:
- Accepting both incoming and current
- Accepting only incoming
- Accepting only current
- Accepting **parts** of both incoming and current

Generally, you want to keep all changes that were merged to main, but additionally, layer on your changes.

### 4. Resolve conflicts in VS Code (recommended):
Once you understand you have a merge conflict and have a vision of the the final document, we recommend using VS code.


VS Code makes solving merge-conflicts more easier with a 3-pane interface for resolving conflicts:

-> Incoming Change → code from main (left/top)

-> Current Change → code from your branch (right/top)

-> Result → the lower/third pane, where you create the final merged file.

You want to accept or reject content from the top left and top right panes, and edit the final pane in the bottom so the final code submission reasonably resolves the issue while respecting the work of others.

#### Steps to resolve in VS Code:

##### 1. Open the conflicted file in VS Code.

##### 2. Look at both the Incoming Change (left) and Current Change (right) panels.

##### 3. In the Result (lower pane), edit the file so it contains the correct final version.

-> Sometimes keep Incoming (main)

-> Sometimes keep Current (your branch)

-> Often, combine both parts and edit the code manually.
If the conflict is resolved correctly, VS Code will mark it as fixed.

##### 4. Save the lower pane file once there are no more merge conflicts to resolve in this file.

##### 5. Click the add button next to the file to resolve conflicts or:
```bash
git add .
```

##### 6. Continue the rebase
```bash
git rebase --continue
```

##### 7. If there are more conflicts in other files, VS Code will automatically move you to the next one. Repeat until no conflicts remain.

⚠️ Do NOT just click “Accept All Incoming” or “Accept All Current” — that usually **deletes** or **corrupts** important code.

Once the rebase operation completes, your commits will be layered on top of main. It means your commit history will look “different” and you may even see changes to commits from other authors — this is expected, since rebase rewrites history. 

##### 8. Push changes
If you already have an open Pull Request, you will need to update it with a **force push**, before pushing, double-check that your commits are both DCO signed and GPG verified:

```bash
git log -n --pretty=format:'%h %an %G? %s'
```
Ensure you see:
`G` = Good (valid signature)

then:
```bash
git push --force-with-lease
```

**Tip**: To be safe, create a backup branch before force pushing:
```bash
git checkout -b mybranch-backup
```

### Common Issues

#### 1. Message: *“No changes – did you forget to use git add?”*  
- **What it means:** You resolved the conflicts but forgot to stage the files.  
- **Solution:** Run `git add .` and try again.

#### 2. Message: *“Are you sure you want to continue with conflicts?”*  
- **What it means:** Some conflicts are still unresolved or the files were not saved properly.  
- **Solution:** Double-check your files in VS Code, make sure they are saved, and resolve any remaining conflict markers:  



### If you need to stop
```bash
git rebase --abort
```

**Tip**: At each conflict: resolve → save → stage → continue. Repeat until all conflicts are gone.

### What NOT to do
1. ❌ Do not run git merge main
→ This creates messy merge commits. Always rebase instead.

2. ❌ Do not merge into your local main
→ Keep main as a clean mirror of upstream/main.

3. ❌ Do not open PRs from your fork’s main
→ Always create a feature branch for your changes.

At each conflict instance, you'll have to repeat: fix the conflict, stage the files and continue rebasing.

## Recovery Tips:

- Undo the last rebase commit, but keep changes staged (while still in rebase):
If you are in the middle of a rebase and realize the last step went wrong, you can undo it while keeping changes staged:
```bash
git reset --soft HEAD~i
```

Note: The number after HEAD~ refers to how many commits you want to go back.

For example:
- HEAD~1 → go back 1 commit
- HEAD~3 → go back 3 commits
- HEAD~5 → go back 5 commits

### If you are completely stuck
Sometimes a rebase can get too messy to fix conflict by conflict. In that case, it’s often easier to start fresh:

1. Abort the rebase to stop where you are:
```bash
git rebase --abort
```

2. Reset your fork's main to the upstream main and layer your commits on top of that:
``` bash
git checkout main
git reset --hard upstream/main
git push origin main --force-with-lease
git checkout mybranch
git rebase upstream/main -S
```

⚠️ Use git stash only if you really want to save some local changes that aren’t yet committed. In most cases, if the rebase is failing, it’s safer to abort or reset rather than reapplying a stash of broken work.

### Helpful Resources
- [Signing Guide](signing.md)
- [Rebasing Guide](rebasing.md)
- [Discord](discord.md)