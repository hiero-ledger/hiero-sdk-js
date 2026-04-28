## 🧩 Intermediate Friendly

This issue is a good fit for contributors who are already familiar with
the Hiero JS SDK and feel comfortable navigating the codebase. We
strongly recommend completing two Beginner Issues before tackling an
Intermediate Issue.

Intermediate Issues often involve:

-   Exploring existing implementations\
-   Understanding how different components work together\
-   Making thoughtful changes that follow established patterns

The goal is to support deeper problem-solving while keeping the task
clear, focused, and enjoyable to work on.

------------------------------------------------------------------------

## 🐞 Problem Description

The Codecov pipeline is currently unreliable because Vitest coverage
configuration is inconsistent across test suites.

Specifically:

-   Coverage provider settings are mixed and rely on `istanbul` in
    multiple Vitest configs.
-   This can cause inconsistent or incomplete LCOV output consumed by
    Codecov.
-   Browser coverage configuration is missing an explicit `jsdom`
    environment in one config, which can lead to unstable reporting.
-   As a result, Codecov status can be misleading or fail to reflect
    actual test coverage.

This creates CI noise and reduces confidence in coverage metrics.

------------------------------------------------------------------------

## 💡 Expected Outcome

Standardize coverage generation so Codecov receives consistent LCOV
artifacts from all test suites.

### 1. Unified Coverage Provider

-   Use the same Vitest coverage provider across all project test
    configs.
-   Ensure provider selection is compatible with the current Vitest
    version and CI environment.

### 2. Stable Browser Coverage Setup

-   Configure browser test environment explicitly where required
    (e.g., `jsdom`) to avoid environment-dependent coverage behavior.

### 3. Reliable Codecov Upload Inputs

-   Ensure LCOV files are generated for unit/integration/dual-mode
    suites.
-   Ensure paths expected by the GitHub Actions Codecov upload step are
    present and valid.

### 4. Clear and Maintainable Configuration

-   Keep coverage settings consistent and easy to reason about.
-   Avoid suite-specific drift unless strictly required.

------------------------------------------------------------------------

## 🧠 Implementation Notes

Suggested approach:

-   Update all relevant Vitest configs in `test/` to use a single
    coverage provider (`v8`).
-   Add explicit browser test environment configuration where missing.
-   Validate `task test:unit:codecov`,
    `task test:integration:codecov`, and
    `task test:integration:dual-mode:codecov` locally/CI as applicable.
-   Confirm generated LCOV files match paths consumed in
    `.github/workflows/build.yml`.
-   Keep changes minimal and focused on coverage/reporting reliability.

------------------------------------------------------------------------

## ✅ Acceptance Criteria

To help get this change merged smoothly:

-   [ ] All SDK Vitest configs use the same coverage provider\
-   [ ] Browser coverage config includes explicit environment where needed\
-   [ ] LCOV artifacts are generated for all expected suites\
-   [ ] Codecov upload step receives valid files without missing-path issues\
-   [ ] Coverage results are stable across repeated CI runs\
-   [ ] Follow existing project conventions\
-   [ ] Avoid breaking public APIs\
-   [ ] Pass all CI checks

------------------------------------------------------------------------

## 📚 Additional Context

This work is intentionally scoped to coverage/reporting correctness and
CI reliability. It is not a test refactor effort.

If you have questions, the community is happy to help:

https://discord.com/channels/905194001349627914/1337424656138899537
