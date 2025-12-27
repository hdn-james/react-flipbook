# Contributing to React 3D Flipbook

Thank you for your interest in contributing to React 3D Flipbook! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

## Code of Conduct

Please be respectful and considerate in all interactions. We are committed to providing a welcoming and inclusive environment for everyone.

## Getting Started

1. **Fork the repository** on GitHub

2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/react-3d-flipbook.git
   cd react-3d-flipbook
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Create a branch** for your changes:
   ```bash
   git checkout -b feat/your-feature-name
   ```

## Development Workflow

### Running the Development Environment

```bash
# Start Storybook for component development
npm run storybook

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Run type checking
npm run typecheck

# Build the package
npm run build
```

### Project Structure

```
src/
├── components/       # React components
│   ├── Flipbook.tsx
│   └── WebGLPageFlip.tsx
├── utils/           # Utility functions
│   └── pdfUtils.ts
├── types/           # TypeScript type definitions
│   └── index.ts
├── stories/         # Storybook stories
└── index.ts         # Main entry point
```

## Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This enables automatic changelog generation and semantic versioning.

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | Description                                                |
| ---------- | ---------------------------------------------------------- |
| `feat`     | A new feature                                              |
| `fix`      | A bug fix                                                  |
| `docs`     | Documentation only changes                                 |
| `style`    | Code style changes (formatting, semicolons, etc.)          |
| `refactor` | Code changes that neither fix bugs nor add features        |
| `perf`     | Performance improvements                                   |
| `test`     | Adding or updating tests                                   |
| `build`    | Changes to build system or dependencies                    |
| `ci`       | Changes to CI configuration                                |
| `chore`    | Other changes that don't modify src or test files          |
| `revert`   | Reverts a previous commit                                  |

### Scope (Optional)

The scope provides additional context about what part of the codebase is affected:

- `flipbook` - Main Flipbook component
- `webgl` - WebGL/Three.js rendering
- `pdf` - PDF utilities
- `types` - TypeScript types
- `docs` - Documentation
- `deps` - Dependencies

### Examples

```bash
# Feature
git commit -m "feat(pdf): add lazy loading support for large PDFs"

# Bug fix
git commit -m "fix(webgl): resolve texture memory leak on page change"

# Documentation
git commit -m "docs: update README with PDF usage examples"

# Breaking change
git commit -m "feat(flipbook)!: change default page mode to single

BREAKING CHANGE: The default pageMode is now 'single' instead of 'double'"

# Multiple lines
git commit -m "fix(webgl): improve camera framing calculation

- Account for horizontal FOV in addition to vertical
- Fix aspect ratio handling for portrait pages
- Add padding option for better visual margins

Closes #42"
```

## Pull Request Process

1. **Ensure your code passes all checks**:
   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```

2. **Update documentation** if you're adding or changing features

3. **Add tests** for new functionality

4. **Create a Pull Request** with:
   - A clear title following the commit convention
   - A description of what changes you made and why
   - Reference to any related issues

5. **Wait for review** - maintainers will review your PR and may request changes

### PR Title Examples

- `feat(pdf): add support for password-protected PDFs`
- `fix(flipbook): correct page alignment in single-page mode`
- `docs: add Storybook examples for custom styling`

## Reporting Bugs

When reporting bugs, please include:

1. **A clear title** describing the issue
2. **Steps to reproduce** the bug
3. **Expected behavior** - what you expected to happen
4. **Actual behavior** - what actually happened
5. **Environment details**:
   - Browser and version
   - React version
   - Three.js version
   - Package version
6. **Code samples** or a minimal reproduction (CodeSandbox, StackBlitz, etc.)

## Requesting Features

When requesting features, please include:

1. **A clear description** of the feature
2. **Use case** - why you need this feature
3. **Proposed API** (if applicable) - how you envision using it
4. **Alternatives considered** - other approaches you've thought about

## Labels

We use labels to categorize issues and PRs:

| Label              | Description                                    |
| ------------------ | ---------------------------------------------- |
| `bug`              | Something isn't working                        |
| `feature`          | New feature request                            |
| `enhancement`      | Improvement to existing functionality          |
| `documentation`    | Documentation improvements                     |
| `good first issue` | Good for newcomers                             |
| `help wanted`      | Extra attention is needed                      |
| `breaking-change`  | Introduces breaking changes                    |
| `performance`      | Performance improvements                       |
| `security`         | Security-related issues                        |

## Questions?

If you have questions, feel free to:

- Open a [GitHub Discussion](https://github.com/hdn-james/react-3d-flipbook/discussions)
- Open an issue with the `question` label

Thank you for contributing! 🎉