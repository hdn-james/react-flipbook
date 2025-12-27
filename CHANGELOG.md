# Changelog

## v1.1.5 (2025-12-27)

### 🐛 Bug Fixes
- fix(ci): resolve publishser (0fc1c44)


## v1.1.4 (2025-12-27)


## v1.1.3 (2025-12-27)


## v1.1.2 (2025-12-27)

### 🐛 Bug Fixes
- fix(ci): npm (2d7e5f8)


## v1.1.1 (2025-12-27)

### ✨ Features
- feat(ci): add GitHub Actions for auto npm publishing and release automation (f73ebcc)
- feat: add dynamic PDF page sizing and expose camera controls (2234ac2)
- feat: upgrade storybook (34783cc)

### 🐛 Bug Fixes
- fix: remove MDX file causing Storybook build issues (ecdb7ee)
- fix: update Storybook MDX import for v10 compatibility (57c9e57)
- fix: relax ESLint rules for existing code (c966417)
- fix: add ESLint configuration file (0e80c1d)
- fix: regenerate package-lock.json (080e4dc)
- fix(ci): update ci/cd config (ca5486f)

### 🔧 Maintenance
- chore: gitignore (6593a3e)

### 📦 Other Changes
- init (c878ed8)


All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-12-27

### ✨ Features

- Added PDF support with PDF.js integration (`pdfToFlipbookPages`, `pdfToFlipbookPagesLazy`)
- Added automatic page sizing utilities (`calculateFlipbookSize`, `calculateFlipbookSizeFromPages`)
- Added per-page geometry support for mixed portrait/landscape PDFs
- Added lazy loading mode for memory-efficient PDF rendering
- Added configurable camera controls (`cameraZoom`, `pageScale`, `cameraPositionY`, `cameraLookAtY`, `cameraFov`)
- Added support for JPEG texture format with configurable quality

### 🐛 Bug Fixes

- Fixed single-page mode displaying spreads incorrectly
- Fixed stale texture caching issues
- Fixed page overlap during flip animations
- Fixed camera framing calculation for different aspect ratios
- Fixed memory leaks by properly disposing textures and cleaning up canvas elements

### ⚡ Performance Improvements

- Reduced memory consumption with JPEG textures and lower default render scale
- Added progressive page loading for large PDFs
- Improved texture management with proper cleanup

### 📚 Documentation

- Expanded README with comprehensive usage examples
- Added PDF loading documentation
- Added performance tips and troubleshooting guide
- Added Storybook examples for all features

## [1.0.0] - 2025-12-01

### ✨ Features

- Initial release
- 3D flipbook component with realistic page-turning animations
- WebGL rendering powered by Three.js
- Single-page and two-page spread modes
- Customizable page curl effects
- Touch and mouse navigation support
- TypeScript support with full type definitions
- React 17+ and 18+ compatibility