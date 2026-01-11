# Good First Issue Guidelines for the JavaScript SDK

## Purpose
This document defines what is considered a good first issue for the JavaScript SDK.
The goal is to help maintainers label issues consistently and help new contributors
pick tasks that are approachable and low-risk.

## What Is a Good First Issue
A good first issue should:
- Be small and focused
- Be understandable without deep knowledge of the SDK
- Be solvable in one or two sittings
- Have minimal risk of breaking core functionality

These issues should not require understanding of network behavior,
serialization formats, or internal SDK architecture.


## What Is Considered a Good First Issue

### Small, Focused Source Changes
- Minor improvements to existing utility functions
- Improving readability or robustness of simple helpers

### Documentation Improvements
- Clarifying existing documentation or comments
- Improving explanations in examples or source files

### Refactors of Existing Examples
- Improving readability of existing examples
- Renaming variables for clarity
- Extracting repeated logic into helper functions

### Test Improvements (Additive Only)
- Adding assertions to existing tests
- Improving test names or failure messages

## What Is NOT Considered a Good First Issue
- Adding new examples
- Creating new test suites or test files
- Changes to core SDK or protocol logic
- Large refactors spanning multiple modules
- Performance or concurrency-related changes

## Rationale
These boundaries help ensure good first issues remain accessible to new contributors
while keeping the SDK stable and maintainable.


