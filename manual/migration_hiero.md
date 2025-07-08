# Migration Guide: @hashgraph/sdk to @hiero/sdk

## Overview

This document provides a comprehensive guide for migrating from the `@hashgraph/sdk` package to the new `@hiero/sdk` package. The package has been transferred from the Hashgraph organization to the Hiero organization, and this migration reflects the updated namespace.

## What's Changing

The package name is being updated from `@hashgraph/sdk` to `@hiero/sdk` to reflect the new organization ownership. The functionality, API, features and codebase remain exactly the same - only the package name and import statements need to be updated.

## Migration Steps

### 1. Update Package Installation

**Before:**
```bash
# NPM
npm install --save @hashgraph/sdk

# Yarn
yarn add @hashgraph/sdk

# PNPM
pnpm add @hashgraph/sdk
```

**After:**
```bash
# NPM
npm install --save @hiero/sdk

# Yarn
yarn add @hiero/sdk

# PNPM
pnpm add @hiero/sdk
```

### 2. Update Import Statements

**Before:**
```javascript
import {
    Client,
    AccountId,
    PrivateKey,
    AccountBalanceQuery
} from "@hashgraph/sdk";
```

**After:**
```javascript
import {
    Client,
    AccountId,
    PrivateKey,
    AccountBalanceQuery
} from "@hiero/sdk";
```

### 3. Update CommonJS Require Statements

**Before:**
```javascript
const { Client, AccountBalanceQuery } = require("@hashgraph/sdk");
```

**After:**
```javascript
const { Client, AccountBalanceQuery } = require("@hiero/sdk");
```

### 4. Update Browser CDN References

**Before:**
```html
<script src="https://unpkg.com/@hashgraph/sdk@2.62.0-beta.3/dist/umd.js"></script>
```

**After:**
```html
<script src="https://unpkg.com/@hiero/sdk@2.67.0/dist/umd.js"></script>
```

### 5. Update Package.json Dependencies

**Before:**
```json
{
  "dependencies": {
    "@hashgraph/sdk": "^2.67.0"
  }
}
```

**After:**
```json
{
  "dependencies": {
    "@hiero/sdk": "^2.67.0"
  }
}
```

### 6. Update TypeScript Type References

**Before:**
```typescript
import type { TokenInfo } from "@hashgraph/sdk";
```

**After:**
```typescript
import type { TokenInfo } from "@hiero/sdk";
```

## Files That Need Updates

### 1. Package Configuration Files
- `package.json` files in your project and any subdirectories
- `pnpm-lock.yaml` files (will be regenerated)
- `yarn.lock` files (will be regenerated)

### 2. Source Code Files
- All JavaScript/TypeScript files with import statements
- Files using CommonJS require statements
- TypeScript type definition files

### 3. Documentation Files
- README files
- Documentation examples
- Code comments referencing the old package name

### 4. Configuration Files
- Build configuration files (webpack, rollup, etc.)
- CI/CD pipeline files
- Docker files

### 5. HTML Files
- Any HTML files using CDN references
- Demo files

## Automated Migration Script

You can use the following commands to automatically update most references:

### For Unix-like systems (Linux, macOS):
```bash
# Update import statements in JavaScript/TypeScript files
find . -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | xargs sed -i 's/@hashgraph\/sdk/@hiero\/sdk/g'

# Update package.json files
find . -name "package.json" | xargs sed -i 's/"@hashgraph\/sdk"/"@hiero\/sdk"/g'

# Update HTML files
find . -name "*.html" | xargs sed -i 's/@hashgraph\/sdk/@hiero\/sdk/g'

# Update markdown files
find . -name "*.md" | xargs sed -i 's/@hashgraph\/sdk/@hiero\/sdk/g'
```

### For Windows (PowerShell):
```powershell
# Update import statements in JavaScript/TypeScript files
Get-ChildItem -Recurse -Include "*.js","*.ts","*.jsx","*.tsx" | ForEach-Object { (Get-Content $_.FullName) -replace '@hashgraph/sdk', '@hiero/sdk' | Set-Content $_.FullName }

# Update package.json files
Get-ChildItem -Recurse -Include "package.json" | ForEach-Object { (Get-Content $_.FullName) -replace '"@hashgraph/sdk"', '"@hiero/sdk"' | Set-Content $_.FullName }

# Update HTML files
Get-ChildItem -Recurse -Include "*.html" | ForEach-Object { (Get-Content $_.FullName) -replace '@hashgraph/sdk', '@hiero/sdk' | Set-Content $_.FullName }

# Update markdown files
Get-ChildItem -Recurse -Include "*.md" | ForEach-Object { (Get-Content $_.FullName) -replace '@hashgraph/sdk', '@hiero/sdk' | Set-Content $_.FullName }
```

### 3. Test Your Application
After making the changes:
1. Run your test suite
2. Test all functionality that uses the SDK
3. Verify that imports are working correctly
4. Check that your build process completes successfully

### 4. Update CI/CD Pipelines
If you have CI/CD pipelines that reference the old package name, update them accordingly.

## Breaking Changes

**There are no breaking changes in this migration.** The package name change is purely cosmetic and does not affect:
- API functionality
- Method signatures
- Class structures
- Return types
- Error handling

## Version Compatibility

The new `@hiero/sdk` package maintains full compatibility with the previous `@hashgraph/sdk` versions. You can directly replace the package name without any code changes beyond the import statements.

## Support

If you encounter any issues during the migration:
1. Check that all import statements have been updated
2. Verify that your package.json dependencies are correct
3. Ensure your lock files have been regenerated
4. Test your application thoroughly

For additional support, create an issue in the [Hiero SDK repository](https://github.com/hiero-ledger/hiero-sdk-js/issues).

## Timeline

- **Effective Date**: The new `@hiero/sdk` package is available immediately
- **Deprecation**: The `@hashgraph/sdk` package will continue to work but will eventually be deprecated
- **Recommendation**: Migrate as soon as possible to ensure you're using the officially supported package

---

**Note**: This migration is part of the broader transition from the Hashgraph organization to the Hiero organization. The SDK functionality remains unchanged, and this is purely a namespace update to reflect the new organizational structure. 