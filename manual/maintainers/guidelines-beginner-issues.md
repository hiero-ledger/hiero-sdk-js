# Beginner Issue Guidelines — Hiero JS SDK

## How to Use This Document

This guide is here to support maintainers and issue creators who use the **Beginner** label.

It offers shared language, examples, and guidance to help:

**Issue creators:**
- Feel confident when proposing a Beginner Issue  
- Understand what kinds of tasks usually fit this label  
- Decide when another issue category might be a better fit  

**Maintainers:**
- Apply the Beginner label consistently  
- Keep issue difficulty labels clear and helpful  

This isn’t a rulebook, and it’s not meant to limit what kinds of contributions are welcome.  
All contributions — simple or complex — are valuable to the Hiero project.

The Beginner label simply highlights tasks that are a great next step after a Good First Issue.

---

## Purpose

Beginner Issues are a natural next step after  
[Good First Issues](./guidelines-good-first-issues.md).

They’re designed for contributors who are starting to feel more comfortable with the basic contribution workflow and are ready to:

- Read existing code  
- Understand local context  
- Make small, safe improvements  

These issues stay low risk and well-scoped, while offering a bit more independence than fully scripted Good First Issues.

---

## What to Expect

Beginner Issues are designed for contributors who:

- Can build the SDK locally  
- Understand the basic repository structure  
- Are comfortable reading JavaScript code  
- Have completed (or could complete) a Good First Issue  

They don’t require deep knowledge of the SDK’s architecture, system design, or performance internals — just curiosity and a willingness to learn.

---

## How Beginner Issues Usually Feel

Beginner Issues often:

- Involve reading existing code for context  
- Leave room for small, thoughtful decisions  
- Focus on a specific area of the codebase  
- Stay low to moderate in risk  

**Helpful rule of thumb:**  
If the task involves deciding *how* to make a change (but not redefining what the system does), it’s probably a good fit for a Beginner Issue.

---

## Common Types of Beginner Work

Here are some examples of changes that often work well as Beginner Issues:

### Good Fits
- Small bug fixes with clear reproduction steps  
- Adding or adjusting unit tests based on existing examples  
- Improving error messages or documentation wording  
- Small feature tweaks with clearly described behavior  
- Cleaning up minor inconsistencies in a localized area 
- Small code refactors in a localized area 

### Less Ideal Fits
Some tasks are better suited for more experienced contributors, such as:

- API redesigns or breaking changes  
- Large refactors across multiple systems  
- Performance tuning  
- Architecture or design-heavy work  

These contributions are still valuable — they just fit better under different issue labels.

---

## Typical Scope & Time

Beginner Issues are usually:

- ⏱ **Estimated time:** 4–8 hours  
- 📄 **Scope:** 1–3 related files  
- 🧠 **Challenge level:** Understanding immediate code context — no architectural decisions or cross-file dependencies

If an issue seems likely to involve exploring many parts of the codebase or take significantly longer, it may be a better fit for a different category.

---

## Example: A Well-Formed Beginner Issue

**Title:** Improve documentation clarity for `FileUpdateTransaction` setters

**Description:**  
Some of the documentation for setter methods in  
`FileUpdateTransaction.js` could be clearer and more consistent with other transaction modules.

Take a look at:
- `setContents`  
- `setKeys`  
- `setFileMemo`  

Update the comments for clarity and consistency, without changing method behavior or signatures.

**Scope**
- `src/transaction/FileUpdateTransaction.js`

**Acceptance Criteria**
- Comments match the style used in similar transaction modules  
- No functional or API changes  
- No new dependencies  

### Why this is a Beginner Issue

This task involves:

- Reading existing code and similar modules for reference  
- Making small, thoughtful documentation improvements  
- Preserving existing behavior  

It doesn’t require architectural knowledge or cross-module changes.

---

## Support & Collaboration

Beginner Issues are supported through:

- Community discussion in issues and PRs  
- Maintainer guidance when clarification is helpful  

Support is focused on:

- Clarifying intent  
- Confirming understanding of existing behavior  
- Reviewing proposed changes  

The goal is to help contributors grow confidence while staying aligned with the project.

---

## Maintainer Guidance

An issue is often a good fit for the **Beginner** label when it:

- Builds naturally on Good First Issues  
- Encourages reading existing code for context  
- Allows small, low-risk decisions  
- Has clear intent and well-defined boundaries  

---

Beginner Issues are all about helping contributors take the next step —  
with just a little more independence, and plenty of support along the way.
