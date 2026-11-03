# Repository Guidelines

## Project Structure & Module Organization

Cloud Shop is a Vietnamese shoe storefront built with Next.js App Router, a NestJS REST API, and Convex. The frontend calls the same-origin Next.js API proxy; Nest owns email/password authentication and forwards signed user JWTs to Convex. Clerk is no longer used. Read the root `README.md` for setup and `docs/ui-guide.md` for interface conventions.

- `frontend/app/`: root layout, storefront entry, and global theme.
- `frontend/components/`: shared providers, catalog/detail UI, cart, checkout, orders, and admin panels.
- `backend/convex/`: schema, authentication, server queries/mutations, seed data, and tests.
- `backend/convex/_generated/`: Convex-generated bindings; regenerate with the CLI rather than editing manually.
- `frontend/public/`: static assets.

## Build, Test, and Development Commands

Frontend commands run from `frontend/`; backend and Convex commands run from `backend/`:

- `npm ci`: install locked dependencies.
- `npm run dev`: serve Next.js locally on port 3000.
- `npm run convex:dev`: synchronize backend Convex functions/schema; keep this terminal running separately.
- `npm run auth:setup`: generate persistent Nest authentication keys and sync public JWKS/backend secret to the development Convex deployment.
- `npm run start:dev`: serve Nest on port 3001.
- `npm run convex:seed`: initialize an empty development database with sample shoes.
- `npm run build`: validate TypeScript and build production output.
- `npm run lint`: run Next.js ESLint rules.
- `npm test`: run isolated Convex tests using Vitest and convex-test.

## Coding Style & Naming Conventions

Use TypeScript, two-space indentation, double quotes, and semicolons. Components use PascalCase, functions and variables camelCase, and component files kebab-case. Follow `frontend/AGENTS.md` and consult installed Next.js documentation before frontend changes. Keep theme values in global CSS and reuse existing components.

## Testing Guidelines

Name Convex tests `*.test.ts` and place them in `backend/convex/`. Verify authorization, stock limits, server-calculated prices, transactional checkout, and cancellation restoring stock only once. Tests must not contact cloud deployments. No coverage percentage is configured. Run tests, lint, and build before submitting changes.

## Commit & Pull Request Guidelines

Existing history mixes plain messages with `feat:` prefixes. Prefer concise imperative messages such as `feat: add shoe variants`. PRs should describe behavior, link issues, report checks, and include screenshots for UI changes. Document schema changes and migration requirements.

## Security & Configuration

Never commit `.env.local` or keys; use `frontend/.env.example`. Derive identity from Nest-signed JWTs inside Convex and enforce admin/ownership checks server-side. Read prices and inventory from the database during checkout. Use separate development deployments; coordinate schema migrations before sharing a database.
