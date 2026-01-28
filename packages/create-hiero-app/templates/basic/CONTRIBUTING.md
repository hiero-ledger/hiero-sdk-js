# Contributing to Your Hiero App

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Development Setup

1. **Install dependencies:**

```bash
npm install
```

2. **Configure environment:**

```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Start development:**

```bash
npm run dev
```

## Code Style

This project uses:

- **ESLint** for linting
- **Prettier** for formatting
- **TypeScript** for type safety

Run these commands before committing:

```bash
npm run lint          # Check for linting errors
npm run format        # Format code
npm run type-check    # Check TypeScript types
```

## Project Structure

- `src/config/` - Configuration and setup
- `src/examples/` - Node.js example scripts
- `src/utils/` - Utility functions and helpers
- `src/main.ts` - Browser entry point
- `src/index.ts` - Node.js entry point

## Adding New Features

### Adding a New Example Script

1. Create a new file in `src/examples/`
2. Follow the existing pattern:
   - Import necessary SDK components
   - Add error handling
   - Include logging
   - Document with JSDoc comments

3. Add a script to `package.json`:

```json
{
  "scripts": {
    "your-example": "tsx src/examples/your-example.ts"
  }
}
```

### Adding Browser Features

1. Update `src/main.ts` with your new functionality
2. Add UI elements to `index.html` if needed
3. Use the existing patterns for:
   - Error handling
   - Status updates
   - Loading states

## Testing

Before submitting changes:

1. Test in development mode: `npm run dev`
2. Test the production build: `npm run build && npm run preview`
3. Test Node.js scripts: `npm run <script-name>`
4. Verify TypeScript types: `npm run type-check`

## Commit Guidelines

- Use clear, descriptive commit messages
- Follow conventional commits format:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation
  - `style:` for formatting
  - `refactor:` for code restructuring
  - `test:` for tests
  - `chore:` for maintenance

Example:
```
feat: add token transfer example
fix: handle missing operator credentials
docs: update README with new examples
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting
5. Commit your changes
6. Push to your fork
7. Open a Pull Request

## Questions?

- Check the [README](./README.md)
- Visit [Hiero Documentation](https://docs.hedera.com/)
- Join the [Discord Community](https://discord.gg/hedera)

## License

By contributing, you agree that your contributions will be licensed under the Apache-2.0 License.
