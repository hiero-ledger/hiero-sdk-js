# Commit Signing Guidelines (DCO + GPG)

**Both DCO sign-off and GPG signature signed commits** are required for all pull requests to be merged successfully.

This guide makes it as easy as possible for you to set up your GPG key and DCO and GPG sign your commits.

---
## Table of Contents

- [Commit Signing Guidelines (DCO + GPG)](#commit-signing-guidelines-dco--gpg)
- [Definitions](#definitions)
- [Step-by-Step Setup](#step-by-step-setup)
  - [1. Generate a GPG Key](#1-generate-a-gpg-key)
  - [2. Add Your GPG Key to GitHub](#2-add-your-gpg-key-to-github)
  - [3. Configure Git to Use Your GPG Key](#3-configure-git-to-use-your-gpg-key)
  - [4. Make Signed Commits](#4-make-signed-commits)
  - [5. Verify Signed Status of Commits](#5-verify-signed-status-of-commits)
- [Final Checklist](#final-checklist)
- [Fixing Unsigned Commits](#fixing-unsigned-commits)
  - [1. Soft Reverting Commits (Recommended for New Contributors)](#1-soft-reverting-commits-recommended-for-new-contributors)
  - [2. Retroactively Signing Commits](#2-retroactively-signing-commits)
- [Rebasing and Signing](#rebasing-and-signing)
- [Still Need Help?](#still-need-help)


---

## Definitions

| Signature        | Flag | Purpose                                                         | GitHub Check     |
| :--------------- | :--- | :-------------------------------------------------------------- | :--------------- |
| **DCO Sign-off** | `-s` | Confirms legal right to contribute code (required by CI bot).   | DCO Check        |
| **GPG Signature**| `-S` | Proves you are the author of the commit (required by CI bot, requires GPG setup).   | Verified Badge   |

**CRITICAL WARNING:** To pass the DCO check and achieve the "Verified" status, **all commits** must be signed using **both** the `-S` and `-s` flags together.


---

## Step-by-Step Setup

### 1. Generate a GPG Key

If you don't already have a GPG key:

```bash
gpg --full-generate-key
```

Choose:
* Kind: ECC (sign and encrypt) *default*
* Elliptic curve: Curve 25519 *default*
* Expiration: 0 *default* (does not expire)
* Name, Email: Must match your GitHub email
* Passphrase: Set a strong passphrase that you'll need to remember

Learn more [GPG key set-up documentation on Github](https://docs.github.com/en/authentication/managing-commit-signature-verification/generating-a-new-gpg-key)

Once created, list your keys:

```bash
gpg --list-secret-keys --keyid-format LONG
```

Copy the key ID (looks like `34AA6DBC`).

---

### 2. Add Your GPG Key to GitHub

Export your GPG public key:

```bash
gpg --armor --export YOUR_KEY_ID
```

Paste the output into GitHub:
* [Add GPG key on Github](https://github.com/settings/gpg/new)

---

### 3. Configure Git to Use Your GPG Key

```bash
git config --global user.signingkey YOUR_KEY_ID
git config --global commit.gpgsign true
```

---

### 4. Make Signed Commits

**All commits must be signed using both DCO and GPG.**
Each time you create a commit, use -S and -s flags like this:

```bash
git commit -S -s -m "chore: your commit message"
```

* `-S` = GPG sign
* `-s` = DCO sign-off

> ⚠️ Ensure **every commit** in your branch follows this rule.

---

### 5. Verify Signed Status of Commits

To check that your commits are signed correctly:

```bash
git log --show-signature
```

* Ensure each commit shows both **GPG verified** and **DCO signed-off**.

For a quick check of recent n commits:
Note how many commits you have added, and make n equal to that.

```bash
git log -n --pretty=format:'%h %an %G? %s'
```
Legend:

- G = Good (valid signature - you want to see `G`)
- B = Bad (invalid signature)
- U = Unknown (not signed)
- E = Signed (but not verifiable locally)
---

## Final Checklist

* [ ] All commits signed with `-S`.
* [ ] DCO added with `-s`
* [ ] GPG key added to GitHub

---

## Fixing Unsigned Commits

If you accidentally forgot to sign commits, there are **two ways to fix them**:

### 1. Soft Reverting Commits (Recommended for New Contributors)

Soft revert the impacted commits while keeping changes locally:

```bash
git reset --soft HEAD~n
```

* `HEAD~n` = number of commits to go back
* Example: To fix the last 3 commits: `git reset --soft HEAD~3`

Then, recommit each commit with proper signing:

```bash
git commit -S -s -m "chore: your commit message"
```

---

### 2. Retroactively Signing Commits

Alternatively, you can **amend commits retroactively**:

```bash
git commit --amend -S -s
git rebase -i HEAD~n            # For multiple commits
git push --force-with-lease
```
This is difficult and you may run into problems, for example, if you have merged from main.

## Rebasing and Signing

Rebase operations will be required when your branch is behind the upstream main. We do not recommend merging from main, rebasing is strongly suggested. See [Rebasing Guide](./rebasing.md) for instructions on how to keep your main branch up to date and how to rebase.

When rebasing, you must use this command to ensure your commits remain DCO and GPG signed:

```bash
git rebase main -S
```

> **Note:** `git push --force-with-lease` safely updates the remote branch without overwriting others' changes.

---

## Still Need Help?

* Refer to [GitHub's GPG Docs](https://docs.github.com/en/authentication/managing-commit-signature-verification)
* Ask on the **Hiero [Discord](discord.md)** 