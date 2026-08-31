# Contributing to LeadFinder

Thank you for your interest in contributing! This guide will get you set up quickly.

## Getting Started

1. **Fork** the repo and clone your fork
2. Set up the project following the [Quick Start guide](README.md#quick-start) in the README
3. Create a feature branch: `git checkout -b feature/your-feature-name`

## Development Workflow

```bash
# Backend
cd backend && npm run dev     # nodemon, hot-reload on :5005

# Frontend (separate terminal)
cd client && npm run dev      # Vite, hot-reload on :5173

# Lint before committing
npm run lint                  # run in both backend/ and client/
```

## Pull Request Guidelines

- **One concern per PR** — keep changes focused
- **Describe what and why** in the PR description, not just what changed
- Reference any related issue: `Fixes #123`
- Ensure `npm run lint` passes in both packages before opening the PR

## Reporting Bugs

Open a GitHub Issue and include:
- Steps to reproduce
- Expected vs. actual behavior
- Node.js version, OS
- Any relevant logs (redact API keys!)

## Suggesting Features

Open a GitHub Issue with the label `enhancement`. Describe the use case, not just the implementation.

## Code Style

- Backend: CommonJS modules (`require`/`module.exports`)
- Frontend: ES Modules (`import`/`export`), React functional components
- Formatting: follow the existing patterns; ESLint config is in `client/eslint.config.js`

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
