# Advanced Issue Guidelines — Hiero JS SDK

## How to Use This Document

This guide is here to support maintainers and issue creators who use the **Advanced** label.

It offers shared language and examples to help:

**Issue creators:**
- Describe larger, more complex tasks clearly  
- Set expectations around scope, impact, and collaboration  
- Provide the right level of context for experienced contributors  

**Maintainers:**
- Apply the Advanced label consistently  
- Keep issue difficulty labels clear and helpful  

This isn’t a rulebook, and it’s not meant to limit what kinds of contributions are welcome.  
All contributions — from small fixes to major improvements — are valuable to the Hiero project.

The Advanced label simply highlights work that involves deeper design, broader impact, and long-term ownership.

---

## Purpose

Advanced Issues represent **high-impact, high-responsibility work**.

They’re a great fit for contributors who:

- Have deep familiarity with the SDK  
- Enjoy designing solutions and evaluating trade-offs  
- Are comfortable thinking about long-term impact  

These issues often involve shaping how the SDK evolves over time.

---

## What to Expect

Advanced Issues are designed for contributors who:

- Have strong SDK and domain knowledge  
- Understand performance, concurrency, and ABI considerations  
- Feel comfortable proposing and discussing designs  
- Are open to conversations about breaking changes and long-term direction  

These issues usually involve more discussion, iteration, and collaboration than earlier issue levels.

---

## How Advanced Issues Usually Feel

Advanced Issues often:

- Are design-heavy  
- Affect multiple parts of the SDK  
- Have long-term maintenance impact  
- Involve discussion, iteration, and review  

They’re a great fit for contributors who enjoy tackling complex problems and shaping the future of the project.

---

## Common Types of Advanced Work

Here are some examples of tasks that often fit well at this level:

- Major architectural refactors  
- New subsystems or abstractions  
- Significant performance improvements  
- API changes with migration plans  
- Protocol-level or cross-SDK alignment work  

These efforts usually involve broader coordination and long-term thinking.

---

## Typical Scope & Time

Advanced Issues are usually:

- ⏱ **Estimated time:** 3+ days  
- 📄 **Scope:** Multiple modules or repository-wide  
- 🧠 **Challenge level:** Design, iteration, and long-term ownership  

These issues often evolve through discussion and may require multiple review cycles.

---

## Example: A Well-Formed Advanced Issue

### Implement HIP-1261 fee estimate query support in the JS SDK

The Hiero JS SDK doesn’t currently support fee estimate queries as defined in  
HIP-1261. This makes it harder for developers to programmatically estimate
transaction fees before execution.

This issue focuses on **designing and implementing full SDK support** for HIP-1261, including:

- Public APIs  
- Internal request/response handling  
- Tests and examples  

The implementation should align with the HIP specification and stay consistent with patterns used across other SDKs.

**Reference design document:**  
https://github.com/hiero-ledger/sdk-collaboration-hub/blob/main/proposals/hips/hip-1261.md

### Suggested Steps

1. Review HIP-1261 to understand the intended behavior and constraints  
2. Design the JS SDK API surface for fee estimate queries  
3. Implement the feature across the SDK, including:
   - Public-facing query or transaction classes  
   - Internal request/response handling  
   - Validation and error handling  
4. Add unit and integration tests  
5. Provide at least one usage example  

---

## Support & Collaboration

Advanced Issues are supported through:

- Design discussions in issues and PRs  
- Maintainer and community feedback  
- Iterative review cycles  

Support focuses on:

- Exploring design options  
- Evaluating trade-offs  
- Ensuring long-term maintainability  

The goal is to build strong, well-considered solutions together.

---

## Maintainer Guidance

An issue is often a good fit for the **Advanced** label when it:

- Involves system-level thinking  
- Has long-term impact on the SDK  
- Benefits from experienced review and iteration  

---

Advanced Issues are about shaping the future of the project —  
through thoughtful design, collaboration, and long-term vision.
