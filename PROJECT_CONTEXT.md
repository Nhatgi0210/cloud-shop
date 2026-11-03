# Project Context — Cloud Shoe Shop

## Architecture

Next.js in `frontend/` calls its same-origin `/api` proxy, which forwards requests to NestJS in `backend/`. Nest handles email/password authentication, signs RS256 JWTs in HttpOnly cookies, and forwards each user token to Convex. All Convex functions and schemas live in `backend/convex/`; Convex verifies JWTs and enforces ownership/admin permissions.

## Data model

- `users`: Nest JWT token identifier, display name, email, scrypt password hash, session version and customer/admin role. Public user responses exclude password hashes.
- `categories`: name and unique slug enforced by mutations.
- `products`: shared shoe name, brand, description, category, visibility and featured flags.
- `productVariants`: color/style name, image URL, VND price, size/stock array, sold count and visibility.
- `cartItems`: owner, variant, EU size and quantity.
- `orders`: owner, delivery details, COD payment state, fulfillment state and total.
- `orderItems`: product/variant references plus immutable purchase-time names, size, price and quantity.

## Rules

Prices are derived from variants; product cards show each active variant and its own price. Checkout reads the current database price and stock, decrements stock, creates order snapshots and clears the cart in one transaction. Cancellation is permitted once while pending and restores stock. Only administrators can manage inventory or advance fulfillment. Completed COD orders are marked paid.

New accounts always receive the customer role. An operator grants admin through the internal `users:setAdmin` function. No browser-supplied user ID determines ownership.

## Development

Run Next.js from `frontend/`; run NestJS and the Convex CLI from `backend/`. Use `npm run auth:setup` in backend to configure development authentication keys. Keep personal development deployments separate and preserve schema validation when migrating databases. Tests use an isolated in-memory Convex runtime. Setup, deployment instructions and known limitations are in `README.md`.
