# Intermediate Issue Guidelines — Hiero JS SDK

## How to Use This Document

This guide is here to support maintainers and issue creators who use the **Intermediate** label.

It offers shared language, examples, and guidance to help:

**Issue creators:**
- Understand what kinds of tasks usually fit this level  
- Describe goals clearly while leaving room for implementation choices  
- Set contributors up for success with the right amount of context  

**Maintainers:**
- Apply the Intermediate label consistently  
- Keep issue difficulty labels clear and helpful  

This isn’t a rulebook, and it’s not meant to limit what kinds of contributions are welcome.  
All contributions — simple or complex — are valuable to the Hiero project.

The Intermediate label highlights tasks that encourage deeper problem-solving and technical ownership.

---

## Purpose

Intermediate Issues are a great fit for contributors who are ready to **own a solution end-to-end**.

These issues often involve:

- Investigating existing behavior  
- Reasoning about trade-offs  
- Choosing between multiple valid implementation approaches  

At this level, contributors begin to take ownership of technical decisions — not just follow step-by-step instructions.

---

## What to Expect

Intermediate Issues are designed for contributors who:

- Have solid JavaScript experience  
- Understand the Hiero SDK architecture at a high level  
- Can navigate and update multiple related modules  
- Feel comfortable explaining their implementation choices in a pull request  
- Are open to feedback and discussion during review  

They don’t require authority over system-wide design or deep protocol expertise — just thoughtful problem-solving within clearly defined goals.

---

## How Intermediate Issues Usually Feel

Intermediate Issues often:

- Aren’t fully scripted  
- Involve investigation and understanding of existing behavior  
- Span multiple related files or components  
- Leave room for contributor judgment  
- Encourage discussion about approach, not just correctness  
- Have more than one reasonable solution  

**Helpful rule of thumb:**  
If the task involves exploring the codebase, weighing trade-offs, and choosing an approach, it’s probably a good fit for an Intermediate Issue.

---

## Common Types of Intermediate Work

Here are some examples of tasks that often work well at this level:

### Good Fits
- Implementing new SDK features with clearly defined goals  
- Refactoring code for maintainability or clarity  
- Localized performance improvements with a stated intent  
- Adding new transaction or query types using existing patterns  
- Improving async or concurrency behavior with guidance  

### Less Ideal Fits
Some tasks are better suited for broader or more exploratory efforts, such as:

- Large-scale or cross-SDK redesigns  
- Introducing entirely new subsystems or frameworks  
- Open-ended work without defined goals  

These contributions are still valuable — they just fit better under different labels.

---

## Typical Scope & Time

Intermediate Issues are usually:

- ⏱ **Estimated time:** 1–3 days  
- 📄 **Scope:** Multiple related files or modules  
- 🧠 **Challenge level:** Investigation, trade-offs, and solution ownership  

If an issue seems likely to grow into a large redesign or extended design discussion, it may be a better fit for a different category.

---

## Example: A Well-Formed Intermediate Issue

### Consolidate string handling in selected SDK APIs

Some transaction setter methods in the Hiero JS SDK accept  
string parameters that are immediately copied.

In these cases, more efficient string handling can improve API consistency and reduce unnecessary copies.

This issue focuses on **updating a small, specific set of setters** to improve API consistency and reduce unnecessary string copies.

**Suggested approach:**

1. Start with these transaction classes:
   - `FileUpdateTransaction`  
   - `AccountUpdateTransaction`  

2. Look for setter methods that:
   - Accept string parameters  
   - Don’t store the string by reference  
   - Copy the value into an internal field  

3. Update those setters to accept:
   - more efficient string handling patterns instead  

4. Adjust the corresponding `.js` implementations as needed.

5. Make sure all existing behavior remains unchanged.

---

## Why This Is an Intermediate Issue

This task involves:

- Exploring existing patterns across multiple files  
- Reasoning about string handling and validation  
- Weighing API consistency and safety  
- Choosing an implementation approach and explaining it in review  

It doesn’t require architectural redesign or protocol-level changes — just thoughtful, well-scoped technical decisions.

---

## Support & Collaboration

Intermediate Issues are supported through:

- Community discussion in issues and PRs  
- Maintainer feedback during review  

Support is focused on:

- Clarifying goals  
- Discussing trade-offs  
- Reviewing implementation choices  

The aim is to help contributors grow their confidence and technical ownership.

---

## Maintainer Guidance

An issue is often a good fit for the **Intermediate** label when it:

- Encourages investigation and reasoning  
- Has multiple reasonable implementation paths  
- Involves ownership of design decisions within defined goals  
- Can be reviewed in a single pull request  
- Doesn’t introduce new subsystems or major architectural changes  

---

Intermediate Issues are about taking the next step —  
building confidence through deeper problem-solving, with support along the way.
