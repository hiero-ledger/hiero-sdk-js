# Good First Issue Guidelines — Hiero JS SDK

## How to Use This Document

This guide is here to support maintainers and issue creators who use the **Good First Issue** label.

It offers shared language, examples, and guidance to help:

**Issue creators:**

-   Feel confident when proposing a Good First Issue
-   Understand what makes a task a good starting point
-   Decide when another issue category might be a better fit

**Maintainers:**

-   Apply the Good First Issue label consistently
-   Keep issue difficulty labels clear and helpful

This isn’t a rulebook, and it’s not meant to limit what kinds of contributions are welcome.  
All contributions — big or small — are valuable to the Hiero project.

The Good First Issue label simply highlights tasks that are especially friendly for first-time contributors.

---

## Purpose

Good First Issues (GFIs) are designed to offer a **welcoming, confidence-building first contribution** for new community members.

They help contributors:

-   Get set up
-   Navigate the repository
-   Open their first pull request

The goal is to make the process approachable, so new developers can start and succeed with confidence.

For many contributors, this is their first time working in the Hiero SDK codebase.  
Good First Issues help make that experience smoother by offering:

-   Clear, well-scoped tasks
-   **Step-by-step implementation instructions**
-   Predictable, easy-to-verify outcomes

The focus is on learning the workflow — not on researching, guessing, or filling in missing pieces.

---

## What to Expect

Good First Issues are meant to be accessible to contributors who:

-   Have basic JavaScript knowledge
-   Are familiar with Git/GitHub
-   Are new to Hiero and the SDK
-   Don’t yet understand the project’s architecture

Ideally, everything needed to complete the task is included directly in the issue description.

If a task involves a lot of investigation, discovery, or interpretation, it may simply be a better fit for a different issue label — and that’s okay.

---

## What Makes a Good First Issue

A Good First Issue works best when it is:

-   Clearly defined
-   **Fully scripted with step-by-step implementation**
-   Small in scope (often a single file)
-   Easy to review

The solution path should feel clear and direct, so contributors can focus on learning the contribution process rather than figuring out what to do.

**Helpful rule of thumb:**  
If the issue invites discussion about _what_ should change or _how_ something should work, it may be better suited for another issue category.

---

## Typical Scope & Time

Good First Issues are intentionally small and focused:

-   ⏱ **Estimated time:** ~1–4 hours (setup included)
-   📄 **Scope:** One file or a clearly defined area
-   🧠 **Type:** Straightforward, mechanical changes

Most of the time should be spent getting comfortable with the workflow — not solving complex technical problems.

---

## Common Good First Issue Examples

These are great fits for Good First Issues when the solution is clearly described:

### Content & Comment Fixes

-   Spelling or grammar corrections
-   Fixing typos in comments or docs
-   Replacing text with a provided version

### Simple Code Changes

-   Renaming variables or methods when exact names are given
-   Updating error messages
-   Formatting changes enforced by tooling
-   Small type-annotation improvements (like narrowing generics or replacing any/\* with concrete types)
-   Fix specific lint warning

### Tests & Configuration

-   Small test fixes with expected behavior specified
-   Updating configuration values when the new value is provided

In all cases, the exact change should be easy to understand and follow.

---

## Less Ideal for Good First Issues

Some tasks are better suited for contributors who already have more context about the codebase, such as:

-   Designing APIs
-   Investigating bugs
-   Refactoring for style or clarity
-   Performance improvements
-   Architectural changes

These contributions are still valuable — they just fit better under a different issue label.

---

## Writing a Good First Issue

A strong Good First Issue includes:

-   A clear description of the task
-   Exact files and locations to edit
-   **Step-by-step instructions for the change**
-   Simple acceptance criteria

The goal is to make the path from “open the issue” to “open a PR” feel smooth and stress-free.

### Example

**Title:** Fix typo in README (“mantainer” → “maintainer”)

**Description:**  
In `README.md` at line 96, there is a spelling mistake.

Current text:  
`mantainer guide`

Should be:  
`maintainer guide`

This is a direct text replacement only.

**Files to Change**

-   `README.md`

**Acceptance Criteria**

-   [ ] The text is corrected
-   [ ] No other changes are made

---

## Support & Mentorship

Maintainers and the **Good First Issue support team** are here to help with:

-   Navigating the repository
-   Understanding the contribution process
-   Verifying acceptance criteria

Support is focused on making the contribution experience smooth and welcoming.

---

## Maintainer Guidance

Sometimes a task feels “easy” because:

-   You already know the codebase
-   You understand the architecture
-   You’ve worked on similar problems before

For new contributors, even small gaps in context can make an issue feel much harder than expected.

If an issue would benefit from a bit more detail or clarity, labeling it as:

**Good First Issue — Candidate**

can help make sure it’s truly ready for first-time contributors.

---

Good First Issues are about creating a smooth, supportive entry point into the project.  
All contributions are welcome — this label simply highlights the best place to start.
