# Contribution Workflow

This guide explains the recommended workflow for contributing to **Hiero**.  
It covers tooling, repository setup, branching, commit standards, testing, and submitting pull requests.

---

## 1. Setting Up Supporting Infrastructure

For the best development experience and smoother support, we strongly recommend installing:

### Recommended Tools

- [ ] GitHub Desktop  
- [ ] Visual Studio Code  

> These tools are recommendations, not requirements. You are free to use alternatives that fit your workflow.

---

#### GitHub Desktop

GitHub Desktop is a free, user-friendly application that provides a visual interface for Git and GitHub. Instead of running Git commands in a terminal, GitHub Desktop lets you perform common tasks through an intuitive UI.

GitHub Desktop allows you to:
- Clone, fork, and manage repositories without using the command line
- Easily create and switch branches
- Visualize commit history and branches in a clear, interactive timeline
- Stage and push local changes with a click
- Resolve merge conflicts with guided prompts

Overall, GitHub Desktop makes Git simpler, safer, and more visual, which is ideal for maintaining clean pull requests.

---

#### Visual Studio Code

Visual Studio Code (VS Code) a visual code editor.

It provides:
- Easy project navigation
- Clear file organisation
- Access to a large ecosystem of extensions

---
## 2. Fork the Repository

Get a copy of the repository to be able to work on it.

Forking creates a personal, editable version of the SDK under your own GitHub account, where you can safely experiment and prepare pull requests. Once your pull request is ready to review, and once merged, your contribution will be added to the repository.

### Steps to Fork

1. Navigate to the [JavaScript Repository](https://github.com/hiero-ledger/hiero-sdk-js) to fork. Make sure you are logged in to Github.

2. Create Your Fork

Click the top-right button inside the repository `Fork`

GitHub will prompt you to confirm:
- The destination account (your profile)
- The name you want to give your fork (you can keep the default)

Click Create fork.

Your new fork will appear at:
`https://github.com/<your-username>/hiero-sdk-js`

This is your copy of the repository. You can work on this safely without fear of impacting the original repository. 


3. Clone Your Fork Locally

You now have an **online** copy of the repository but you also need a local copy to work on the code.

Using GitHub Desktop (recommended):
1. Open GitHub Desktop.
2. Go to File → Clone Repository
3. Select the fork you just created under the “Your Repositories” tab.
4. Choose a folder location on your machine and click Clone.

## 3. Get Assigned to an Issue

We recommend starting with Good First Issues.

Claim the issue by commenting: /assign and wait for assignment.

Key steps:
1. Find an available `Good First Issue` that interests you and is not yet assigned.

- [See Unassigned Good First Issues at the JavaScript SDK](https://github.com/hiero-ledger/hiero-sdk-js/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22Good%20First%20Issue%22%20no%3Aassignee)

2. Comment replying to the issue with: `/assign`
3. Wait for assignment by a maintainer.

Once assigned, you are ready to work.
Congratulations!


## 4. Create a Branch

Work on a branch to help keep the repository history clean and avoid major issues.

Before you create a branch, remember to pull in all recent changes from main.

One-time only:
```bash
git remote add upstream https://github.com/hiero-ledger/hiero-sdk-js.git
```

Verify it is correctly set:
```bash
git remote -v
```

You should now see:
origin → your fork
upstream → the official repository

Once correctly set, pull any changes from upstream:
```bash
git checkout main
git fetch upstream
git pull upstream main
git push origin
```

Lastly, create a branch:
```bash
git checkout -b my-new-branch-name
```

Eventually, you'll need to regularly rebase to keep your branch in sync with the upstream repository [Rebase Guide](rebasing.md)

## 5. Commit Your Changes
Solve the issue and commit your changes.

Make sure to:
- ✅ Read the Issue Description Carefully
- ✅ Ensure you are meeting all requirements

As you commit, make sure the commits are:
- ✅ Conventionally Named
- ✅ Signed correctly

### Achieving Conventionally Named Commits
A conventionally named commit is one that summarises in words what was just commited with a suitable pre-fix.

This is correct:

```bash
git commit -S -s -m "fix: fixed receipt status error catching in get_name"
```

This is incorrect:

```bash
git commit -S -s -m "looks like its mostly working now"
```

Read about conventional commit messages here: [Conventional Commmits](https://www.conventionalcommits.org/en/v1.0.0/#summary)

## DCO and GPG Signing Commits
**Each** commit in a pull request needs to be:
- `DCO` signed with an `-s` flag
- `GPG` key signed with an `-S` flag and a GPG key set up

For example:
```bash
git commit -S -s -m "chore: changelog entry for Token Create Transaction"
```

Follow our [Signing Guide](signing.md) with step-by-step instructions.

**WARNING**: using the default commit button on Github desktop or VS Studio will result in un-signed commits.

**WARNING** any merge or rebase operations will cause a loss of signing status unless you preserve signing: `git rebase main -S`

## 6. Ensure Code is Formatted
Code should be formatted properly using the project's linting and formatting tools (ESLint and Prettier).

## 7. Test and Document any new functionality
In the case that you have added new functionality (beyond documentation) to the SDK, you will need to write test cases and write examples.

Quite often `Good First Issues` and `Beginner` Issues will not need testing.

Where relevant:
- [ ] Include unit and integration tests to exercise the new behaviour
- [ ] Ensure code is documented, especially public and user-facing constructs

### Running Tests

Run unit and integration tests by following [README - Tests](../../README.md)

## Breaking Changes

Breaking changes are generally not acceptable. This is because they can:
- Stop existing code from working
- Force users to spend time and resources updating their applications
- Remove functionality that users may rely on, with no equivalent replacement

Breaking changes damage functionality and trust with our users and should be avoided whenever possible.

### Identifying Whether Your Pull Request Introduces a Breaking Change

Even if an issue does not mention breaking changes, a pull request may still introduce one.

Common examples include:
- Removing or renaming an existing function or class
- Changing the return type or structure of a function or method
- Modifying the parameters a function accepts (adding, removing, or changing types)
- Refactoring a function or class in a way that changes its behaviour, even subtly
- Changing default values or altering side effects

When preparing a pull request, always evaluate whether any existing user code would stop working as a result of your changes even if its 'better'.

Before:
```javascript
function transferTokens(accountId, amount) {
    // ...
}
```

This function accepts an account identifier string and an amount.

After (breaking):
```javascript
function transferTokens(accountId, amount, memo) {
    // ...
}
```

Why this is a breaking change:
- The new `memo` parameter is required, breaking all existing function calls
- Existing user code calling `transferTokens(accountId, amount)` will fail

Implications:
- Users must update all call sites to include the new parameter
- User code without the memo argument will throw errors or behave unexpectedly.


### What to Do If a Breaking Change Is Unavoidable

Breaking changes should be avoided, but in rare cases they are necessary.

Examples include:
- Correcting significant errors or faulty behaviour
- Implementing new standards or APIs (such as HIPS)
- Replacing deprecated functionality that cannot be maintained

If a breaking change must occur: seek immediate maintainer approval.

## 8. Submitting a Pull Request

Once you have completed your work on a dedicated branch and followed all contribution requirements, you are ready to submit a pull request (PR)!

This guide walks you through each step of the PR process.

1. Push Your Changes
If you haven’t already pushed your changes to your fork:

```bash
git push origin <your-branch-name>
```

2. Open a Pull Request to the Repository

Navigate the repository pull request section:
- [JavaScript repository on GitHub](https://github.com/hiero-ledger/hiero-sdk-js/pulls)

You will see a banner showing your branch with a “Compare & pull request” button. Click it.

3. Write a Good Title and Description
Conventionally Name your Pull Request Title [Guide](https://www.conventionalcommits.org/en/v1.0.0/#summary)

For example:
`chore: Unit Tests for Token Create Transaction`

Add a brief description and any important notes.

Link your pull request to the issue it is solving. You can do this by adding Fixes, a hashtag, and then the issue number.
For example:
`Fixes #1029`

Set it to draft or 'ready to review' status and submit!

4. Wait for Checks
We have several security and quality checks.

Please review them and check they all pass.

If they are failing and you require help, you can:
- Contact us on [discord](discord.md)
- Attend Community calls [LFDT Calendar](https://zoom-lfx.platform.linuxfoundation.org/meetings/hiero?view=week)
- Ask for help on the pull request

5. Request a Review
Once all tests pass and the issue requirements are met, request a review by clicking 'Ready for Review' or asking in a new comment.

All Pull Requests must be approved by at least one member of the SDK team before it can be merged in. The members only
have limited bandwidth to review Pull Requests so it's not unusual for a Pull Request to go unreviewed for a few days,
especially if it's a large or complex one. After a couple of weeks, if you haven't received any feedback regarding your
Pull Request from the SDK team, feel free to contact us on [Discord](https://discord.gg/hyperledger) to ask for a review.

That's it! Wait for feedback.

6. Once approved
Once your pull request passes checks and is approved, it will shortly be merged to main.
Congratulations!