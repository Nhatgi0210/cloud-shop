# Project Brief — Cloud Shoe Shop

Current scope: a Vietnamese shoe e-commerce demo using Next.js App Router, the original NestJS backend, and Convex. Authentication now uses email/password and Nest-issued JWTs; Clerk has been removed.

Customers browse shoes, select a color/style variant and an available EU size, manage their cart, place COD orders, and track or cancel pending orders. Administrators manage products, variants, stock by size, categories, and order fulfillment.

The UI and same-origin API proxy live in `frontend/`. NestJS and the single active Convex schema/functions live in `backend/`. See `README.md` for setup, implemented features, and remaining scope; see `docs/ui-guide.md` for visual conventions.

Priority after local verification: configure Nest authentication keys and the backend Convex deployment, test the complete customer/admin flow, add owned product photography, then deploy on Vercel. Bank transfer, online payments, uploads, and additional merchandising features follow the working COD flow.
