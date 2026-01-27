# Contributing to create-hiero-app

Thank you for your interest in contributing to the Hiero SDK starter templates! 🎉

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher
- pnpm package manager
- Git

### Setup Development Environment

1. Clone the repository:
```bash
git clone https://github.com/hiero-ledger/hiero-sdk-js.git
cd hiero-sdk-js/packages/create-hiero-app
```

2. Install dependencies:
```bash
pnpm install
```

3. Build the CLI:
```bash
pnpm run build
```

4. Link for local testing:
```bash
pnpm link --global
```

Now you can test with:
```bash
create-hiero-app test-app
```

## 📝 Development Workflow

### Making Changes

1. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes in `src/` or `templates/`

3. Build and test:
```bash
pnpm run build
create-hiero-app test-app --skip-install
```

4. Verify the generated project works:
```bash
cd test-app
pnpm install
pnpm run dev
```

### Code Style

- Use TypeScript for all source files
- Follow existing code formatting
- Run `pnpm run format` before committing
- Ensure TypeScript compiles without errors

## 🎨 Adding New Templates

### Template Structure

Each template should follow this structure:

```
templates/
└── your-template-name/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    ├── README.md
    ├── USAGE.md
    ├── gitignore.template
    ├── env-template.txt
    ├── .eslintrc.json
    ├── .prettierrc
    ├── public/
    │   └── (static assets)
    └── src/
        └── (source files)
```

### Template Requirements

A good template should include:

1. **Clear Documentation**
   - Comprehensive README.md
   - Step-by-step USAGE.md
   - Inline code comments

2. **Best Practices**
   - Type safety with TypeScript
   - Error handling
   - Security considerations
   - Environment variable management

3. **Developer Experience**
   - Hot reload in development
   - Clear error messages
   - Helpful console logs
   - Formatted code

4. **Examples**
   - Working code examples
   - Common use cases covered
   - Clear demonstration of SDK features

### Adding Your Template

1. Create template directory:
```bash
mkdir -p templates/your-template-name
```

2. Add all required files

3. Register in `src/index.ts`:
```typescript
const templates: Record<string, TemplateConfig> = {
    basic: { /* ... */ },
    'your-template': {
        name: 'Your Template',
        description: 'Description of what your template does',
        directory: 'your-template-name'
    }
};
```

4. Test thoroughly:
```bash
pnpm run build
create-hiero-app test-app -t your-template
```

## 🧪 Testing

### Manual Testing

Before submitting a PR, test:

1. **CLI Creation**:
```bash
create-hiero-app test-basic -t basic
create-hiero-app test-your-template -t your-template
```

2. **Package Manager Support**:
```bash
create-hiero-app test-npm --pm npm
create-hiero-app test-yarn --pm yarn
create-hiero-app test-pnpm --pm pnpm
```

3. **Generated Project**:
```bash
cd test-basic
pnpm install
pnpm run type-check
pnpm run build
pnpm run dev
```

4. **Functionality**:
- Test all UI buttons
- Verify error handling
- Check console for errors
- Test with real testnet credentials

### Automated Testing

(Coming soon - we're working on automated tests!)

## 📖 Documentation

### Code Comments

- Add JSDoc comments for functions
- Explain complex logic
- Document assumptions
- Note any gotchas

### README Updates

If your changes affect usage:
- Update relevant README.md files
- Add examples
- Update troubleshooting section

## 🐛 Bug Reports

### Creating Issues

When reporting bugs, include:

1. **Environment**:
   - OS and version
   - Node.js version
   - Package manager and version

2. **Steps to Reproduce**:
   - Command run
   - Template used
   - Any modifications made

3. **Expected vs Actual**:
   - What should happen
   - What actually happens
   - Error messages

4. **Additional Context**:
   - Screenshots
   - Error logs
   - Relevant code snippets

## 💡 Feature Requests

We welcome feature requests! Please:

1. Check existing issues first
2. Describe the use case
3. Explain expected behavior
4. Provide examples if possible
5. Consider submitting a PR!

## 🔍 Pull Request Process

### Before Submitting

- [ ] Code builds without errors
- [ ] Templates generate correctly
- [ ] Generated projects run successfully
- [ ] Documentation updated
- [ ] Code formatted
- [ ] No console errors in generated apps

### PR Description

Include:
- **What**: What changes were made
- **Why**: Why these changes are needed
- **How**: How to test the changes
- **Screenshots**: If UI changes (before/after)

### Review Process

1. Maintainers will review your PR
2. Address any feedback
3. Once approved, it will be merged
4. Your contribution will be in the next release! 🎉

## 🎯 Priority Areas

We're especially interested in:

1. **New Templates**:
   - DeFi applications
   - NFT marketplaces
   - Smart contract interactions
   - Backend API integration
   - Wallet integration examples

2. **Improvements**:
   - Better error messages
   - More examples
   - Performance optimizations
   - Testing infrastructure

3. **Documentation**:
   - Tutorial videos
   - Blog posts
   - Translation to other languages

## 📜 Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the community
- Show empathy

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Public or private harassment
- Publishing others' private information
- Unprofessional conduct

## 📞 Getting Help

Need help with your contribution?

- **Discord**: [Join our community](https://discord.gg/hedera)
- **GitHub Discussions**: [Ask questions](https://github.com/hiero-ledger/hiero-sdk-js/discussions)
- **Email**: Tag maintainers in your PR

## 🙏 Recognition

All contributors will be:
- Listed in CHANGELOG.md
- Mentioned in release notes
- Added to contributors list
- Part of the Hiero community! 

## 📄 License

By contributing, you agree that your contributions will be licensed under the Apache-2.0 License.

---

**Thank you for contributing to Hiero! 🚀**

Your efforts help make blockchain development more accessible to everyone.
