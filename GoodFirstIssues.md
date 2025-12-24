# Good First Issue Guidelines (JavaScript SDK)

This document defines what is considered a **Good First Issue (GFI)** for the Hiero JavaScript SDK.  
Its purpose is to help maintainers and contributors consistently label beginner-friendly issues and ensure new contributors have a positive onboarding experience.

---

## ✅ What We Consider a Good First Issue

Good First Issues should be **small, focused, and low-risk**, allowing contributors to become familiar with the codebase without requiring deep domain knowledge.

### 🧵 Small, Focused Source Changes
- Improving or simplifying small utility functions
- Clarifying edge cases in existing helpers
- Improving formatting or readability of existing logic

**Examples:**
- Improve formatting of a string output
- Make a helper function more robust or readable

---

### 🔄 Refactors of Existing Examples
- Refactoring examples for clarity or readability
- Renaming variables to be more descriptive
- Extracting repeated logic into small helper functions

**Allowed directions:**
- Split a large example into smaller, named functions
- Combine overly split examples for simplicity

> ❗ Applies only to **existing examples**, not creating new ones.

---

### 📚 Documentation Improvements
- Improving comments or documentation clarity
- Updating outdated explanations
- Adding missing explanations for non-obvious behavior

Includes:
- Module-level documentation
- Function or method comments
- Inline comments explaining intent

---

### 🖨️ Print and Output Clarity
- Improving clarity of printed output in examples
- Making logs or messages more descriptive and user-friendly
- Standardizing formatting for readability

**Examples:**
- Replace vague prints like `Done` with meaningful context
- Add explanatory text before printed values

---

### ⚙️ Functional Improvements to Examples
- Small functional changes that better illustrate existing behavior
- Adding missing steps that improve understanding
- Improving structure or ordering within an example

---

### 🧪 Test Improvements (Additive Only)
- Adding assertions to existing test files
- Covering small edge cases already implied by current tests
- Improving test readability or failure messages

> ❗ Tests should extend existing files, not introduce new test suites.

---

## 🚫 What We Do NOT Consider Good First Issues

The following changes are **out of scope** for Good First Issues due to complexity or risk:

### ❌ New Examples
- Creating entirely new example files
- Adding new workflows or use cases

These require deeper understanding of intended SDK usage.

---

### ❌ New Unit or Integration Tests
- Creating new test files
- Designing new test strategies or frameworks

Test creation often requires architectural context.

---

### ❌ Core DLT or Protocol Logic
- Changes to serialization or protocol mappings
- Modifying network or wire-level behavior
- Any changes to core SDK internals

These areas require strong domain expertise.

---

### ❌ Cross-Cutting or Architectural Changes
- Refactors spanning multiple modules
- Performance optimizations
- Concurrency or threading changes

Such work is better suited for experienced contributors.

---

## 🎯 Goal of These Guidelines

These guidelines aim to:
- Protect beginners from overly complex issues
- Help maintainers label issues consistently
- Improve contributor onboarding and retention
