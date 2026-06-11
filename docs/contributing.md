# Contributing to Athelix

## Getting Started

1. Fork the repository
2. Clone your fork
3. Run `npm install`
4. Copy `.env.example` to `.env` and fill in credentials
5. Run `npx expo start` to start the dev server

## Development Workflow

1. Create a branch: `git checkout -b feature/my-feature` or `fix/my-bugfix`
2. Make your changes
3. Run quality checks:
   ```bash
   npx tsc --noEmit     # Type checking
   npx jest --ci        # Unit tests
   npx eslint .         # Linting
   ```
4. Commit your changes: `git commit -m "Concise description of changes"`
5. Push and create a PR

## Code Conventions

See `AI_RULES.md` for strict coding rules. Key points:
- Always type navigation props (never use `any`)
- Import COLORS from `../theme/colors` — no local color constants
- Use named exports for screens
- All mutations go in `src/api/queries.ts` or `src/api/mutations.ts`
- Query keys must use the `queryKeys` factory
- Analytics events must use the `Events` constant

## Pull Request Process

1. Ensure all CI checks pass (typecheck, lint, unit tests)
2. Update tests if adding new functionality
3. Update documentation if changing behavior
4. Request review from maintainers

## Project Structure

```
src/
  api/            — API client, endpoints, queries
  analytics/      — PostHog integration
  auth/           — Clerk auth config
  components/     — Reusable UI components
  navigation/     — Navigator definitions
  screens/        — Screen components
  theme/          — Colors and styles
  types/          — Shared TypeScript types
  utils/          — Pure utility functions
  test/           — Test infrastructure
  __tests__/      — Test files
```

## Need Help?

- Check `docs/` for architecture and setup guides
- Open an issue for bugs or feature requests
- Ask in the project's communication channels
