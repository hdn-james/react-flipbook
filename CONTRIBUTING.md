# Contributing to React 3D Flipbook

Thank you for your interest in contributing to React 3D Flipbook! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Process](#pull-request-process)
- [GitHub Actions & CI/CD](#github-actions--cicd)
- [Release Process](#release-process)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

## Code of Conduct

Please be respectful and considerate in all interactions. We are committed to providing a welcoming and inclusive environment for everyone.

## Getting Started

1. **Fork the repository** on GitHub

2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/react-flipbook.git
   cd react-flipbook
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

## GitHub Actions & CI/CD

This project uses GitHub Actions for continuous integration and automated releases.

### Workflows

| Workflow | Trigger | Description |
|----------|---------|-------------|
| **CI** (`ci.yml`) | Push/PR to `main` | Runs linting, type checking, tests, and build |
| **Release** (`release.yml`) | Manual dispatch | Creates a release PR with version bump |
| **Deploy Storybook** (`deploy-storybook.yml`) | Manual dispatch | Deploys Storybook to GitHub Pages |

### CI Checks

Every pull request must pass the following checks before merging:

```bash
npm run lint        # ESLint code quality
npm run typecheck   # TypeScript type checking
npm test           # Jest unit tests
npm run build      # Production build
```

### Branch Protection

The `main` branch is protected with the following rules:
- Require pull request reviews before merging
- Require status checks to pass (CI workflow)
- Require signed commits (GPG)
- No direct pushes to `main`

## Release Process

Releases are automated via GitHub Actions. Here's how it works:

### 1. Trigger a Release

1. Go to **Actions** → **Release** workflow
2. Click **"Run workflow"**
3. Select the version bump type:
   - `patch` (1.0.0 → 1.0.1) - Bug fixes
   - `minor` (1.0.0 → 1.1.0) - New features
   - `major` (1.0.0 → 2.0.0) - Breaking changes
   - `prerelease` - Alpha/beta versions
4. Click **"Run workflow"**

### 2. Review the Release PR

The workflow creates a release PR with:
- Version bump in `package.json`
- Updated `CHANGELOG.md` with conventional commit messages
- Branch named `release/vX.Y.Z`

Review and merge the PR when ready.

### 3. Automated Release

After merging, the workflow automatically:
1. Creates a GPG-signed git tag
2. Creates a GitHub Release with changelog
3. Publishes the package to npm with provenance
4. Deploys Storybook to GitHub Pages

### Manual Storybook Deployment

If you need to deploy Storybook manually:

1. Go to **Actions** → **Deploy Storybook**
2. Click **"Run workflow"**
3. Enter the git ref (tag, branch, or SHA) to deploy
4. Click **"Run workflow"**

The Storybook will be available at: https://hdn-james.github.io/react-flipbook/

### Required Secrets

For maintainers setting up the repository:

| Secret | Description |
|--------|-------------|
| `GH_PAT` | Personal Access Token with `repo` scope for triggering workflows |
| `GPG_PRIVATE_KEY` | Base64-encoded GPG private key for commit signing |
| `GPG_PASSPHRASE` | Passphrase for the GPG key |
| `NPM_TOKEN` | npm access token (or use npm Trusted Publishers) |

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

- Open a [GitHub Discussion](https://github.com/hdn-james/react-flipbook/discussions)
- Open an issue with the `question` label

## Resources

- 📚 [Live Demo (Storybook)](https://hdn-james.github.io/react-flipbook/)
- 📦 [npm Package](https://www.npmjs.com/package/react-3d-flipbook)
- 🐛 [Issue Tracker](https://github.com/hdn-james/react-flipbook/issues)
- 📖 [Changelog](./CHANGELOG.md)

Thank you for contributing! 🎉