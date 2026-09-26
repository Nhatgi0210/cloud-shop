# PROJECT CONTEXT — Cloud E-Commerce Application

## 1. Project Overview

This project is a cloud-based e-commerce application demonstrating a modern fullstack web architecture and cloud deployment workflow.

The current project scope is based on the team's 4-person task assignment.

Core technologies:
- **Frontend**: Next.js (React, SSR/SSG)
- **Backend**: NestJS (Node.js REST API, business logic, authorization)
- **Cloud database**: Convex (queries, mutations, real-time DB)
- **Deployment**: Vercel (frontend), Railway / Render (NestJS backend)
- **Source control**: GitHub

Architecture:

```
Next.js (Frontend)
    │ HTTP / REST
    ▼
NestJS (Backend API + Auth Guards)
    │ Convex Client
    ▼
Convex (Queries / Mutations)
    │
    ▼
Convex DB (users, products, orders)

GitHub → Vercel (Frontend)
       → NestJS Host (Backend)
```

NestJS is the central API layer between the Next.js frontend and the Convex database. It handles:
- Authentication (JWT)
- Authorization (RBAC guards)
- Business logic for orders, products, and users
- Data validation before writing to Convex

## 2. Project Goals

The application should demonstrate:
1. A functional product browsing experience.
2. Product search and optional category filtering.
3. Shopping cart functionality.
4. Order creation via NestJS API.
5. Cloud database usage with Convex.
6. Basic product administration (protected by RBAC).
7. Authentication and role-based authorization (JWT + NestJS Guards).
8. Deployment to Vercel (frontend) and a cloud host (NestJS backend).
9. Connection between Next.js → NestJS → Convex in production.
10. A clear step-by-step deployment guide for the project.

## 3. Current Team Responsibilities

### Person 1 — Authentication + Authorization *(Lead: phân quyền)*

Responsibilities:
- Login / Register UI (Next.js pages: `/login`, `/register`)
- JWT-based authentication (NestJS `AuthModule`, `JwtModule`)
- Password hashing (bcrypt)
- `users` Convex collection (create, find by email)
- Role-based access control: `admin` / `user`
- NestJS `Guards` (`JwtAuthGuard`, `RolesGuard`) protecting:
  - `/admin/**` routes (admin only)
  - Sensitive API endpoints (e.g., POST /orders, DELETE /products)
- Auth token strategy (HTTP-only cookie or Authorization header)
- Middleware/interceptor to attach user identity to requests

Expected demo:
1. Register a new user.
2. Log in and receive JWT.
3. Access `/admin` as admin — succeeds.
4. Access `/admin` as regular user — blocked (403 Forbidden).

### Person 2 — Convex Database + Admin UI

Responsibilities:
- Create/configure Convex project.
- Design database schema (`users`, `products`, `orders`).
- Implement Convex queries (list, getById).
- Implement Convex mutations (create, update, delete).
- Connect NestJS backend to Convex client.
- Build the `/admin` dashboard UI (Next.js, protected by Person 1's auth).
- Implement product CRUD UI in admin.

Expected admin UI concept:

```
/admin

Products
- T-Shirt   [Edit] [Delete]
- Shoes     [Edit] [Delete]
- Backpack  [Edit] [Delete]
[+ Add Product]
```

Expected demo:
- Open Convex Dashboard.
- Show products table.
- Add a product via the admin UI.
- Demonstrate that the Convex DB updates in real time.

### Person 3 — Shopping Cart + Order

Responsibilities:
- "Add to Cart" button on product cards.
- Cart page (`/cart`).
- Increase/decrease quantity.
- Remove product from cart.
- Calculate total price.
- Simple order form (customer name, address, etc.).
- POST order to NestJS Order API.
- NestJS saves order to Convex `orders` collection.
- Show success notification after order is placed.

Expected flow:

```
Product
  ↓
Add to Cart
  ↓
/cart (Cart Page)
  ↓
Adjust Quantity / Remove
  ↓
Total Price
  ↓
Place Order (POST /api/orders)
  ↓
Order stored in Convex
  ↓
Success notification
```

### Person 4 — Vercel + Cloud Deployment

Responsibilities:
- Configure GitHub repository (branching, `.gitignore`, secrets).
- Deploy Next.js frontend to Vercel.
- Deploy NestJS backend to Railway / Render (or equivalent).
- Configure environment variables for all services:
  - `CONVEX_URL`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL`, etc.
- Verify deployed website end-to-end.
- Verify Next.js ↔ NestJS ↔ Convex connection in production.
- Write deployment documentation (README / guide).

## 4. Current Data Model

The following core Convex collections are required:

### users

| Field | Type | Notes |
|---|---|---|
| `_id` | Convex ID | Auto-generated |
| `email` | string | Unique |
| `passwordHash` | string | bcrypt |
| `role` | `"admin"` \| `"user"` | RBAC |
| `createdAt` | number | Unix timestamp |

### products

| Field | Type | Notes |
|---|---|---|
| `_id` | Convex ID | Auto-generated |
| `name` | string | |
| `price` | number | |
| `description` | string | |
| `imageUrl` | string | Optional |
| `category` | string | Optional |

### orders

| Field | Type | Notes |
|---|---|---|
| `_id` | Convex ID | Auto-generated |
| `userId` | string | Reference to user (optional for guest) |
| `items` | array | `[{ productId, name, price, quantity }]` |
| `totalPrice` | number | |
| `status` | string | e.g., `"pending"` |
| `createdAt` | number | Unix timestamp |

Full schemas may be refined during development; confirm changes with the team before modifying.

## 5. Current MVP Functionality

### Auth (Person 1)
- [x] Login page
- [x] Register page
- [x] JWT issue + verify (NestJS)
- [x] RBAC guard for admin routes
- [ ] Password reset — not specified
- [ ] OAuth / social login — not specified

### Product (Person 1 UI / Person 2 DB)
- [x] Home page
- [x] Product list
- [x] Product card
- [x] Product search
- [ ] Category filtering — optional
- [ ] Product detail page — not specified
- [ ] Stock management — not specified

### Cart (Person 3)
- [x] Add to cart
- [x] Cart page
- [x] Change quantity
- [x] Remove product
- [x] Calculate total

### Order (Person 3)
- [x] Simple order form
- [x] POST to NestJS `/api/orders`
- [x] Save order to Convex
- [x] Success notification

### Admin (Person 2 + protected by Person 1)
- [x] `/admin` dashboard
- [x] Product CRUD UI
- [x] Protected by `RolesGuard` (admin only)
- [ ] Order management — not specified
- [ ] User management — not specified

### Cloud (Person 4)
- [x] GitHub repository
- [x] Vercel deployment (frontend)
- [x] NestJS deployment (backend host)
- [x] Environment variables
- [x] Verify end-to-end in production
- [x] Deployment documentation

## 6. Decisions Already Made

### Frontend/backend architecture

**Chosen direction: Next.js + NestJS + Convex + Vercel**

Reason:
- **Next.js** provides a modern React frontend with SSR/SSG and file-based routing.
- **NestJS** provides a structured, scalable Node.js backend for API logic, authentication, and authorization (JWT guards, RBAC).
- **Convex** handles the cloud database and real-time data operations without managing a traditional SQL/NoSQL server.
- **Vercel** is the standard deployment target for Next.js applications.

A plain Next.js-only setup (no NestJS) was considered but does not satisfy the backend/API separation and role-based authorization requirements.

### Authorization approach

**JWT + NestJS Guards + RBAC (Roles: `admin` / `user`)**

Reason: NestJS provides built-in support for Passport.js, JWT strategy, and custom guards, making role-based access control straightforward to implement and maintain.

## 7. Unresolved / TBD Items

The following items are NOT finalized:

1. Complete `products` schema (image hosting, stock).
2. Complete `orders` schema (guest vs. logged-in user).
3. Guest checkout (order without login).
4. Product categories and filtering UI.
5. Stock/inventory management.
6. Admin order management dashboard.
7. Payment integration.
8. Product detail page.
9. Email notifications (order confirmation, etc.).
10. File upload / image CDN.
11. OAuth / social login.
12. Password reset flow.
13. Exact validation and error-handling requirements.
14. Overall testing strategy.
15. NestJS deployment host (Railway vs. Render vs. other).

Do not silently assume these features are required. Mark as TBD until the team confirms them.

## 8. Development Principles

- Keep the MVP small and demonstrable.
- Prefer the simplest architecture that satisfies the assignment.
- **NestJS** is the API and authorization layer — do not bypass it for sensitive operations.
- **Convex** is for database queries and mutations — accessed via NestJS (not directly from the browser for write operations).
- Keep Next.js frontend components modular and focused on UI.
- Avoid introducing unnecessary infrastructure.
- Do not add payment, inventory, or other major features unless explicitly confirmed.
- Ensure the deployed system works end-to-end: Vercel → NestJS → Convex.
- Keep documentation synchronized with the actual implementation.

## 9. Expected Repository Structure

```
/
├── frontend/              ← Next.js application
│   ├── app/
│   │   ├── page.*         ← Home
│   │   ├── login/
│   │   ├── register/
│   │   ├── products/
│   │   ├── cart/
│   │   └── admin/         ← Protected (client-side redirect)
│   ├── components/
│   ├── public/
│   ├── package.json
│   └── next.config.*
│
├── backend/               ← NestJS application
│   ├── src/
│   │   ├── auth/          ← JWT, Guards, RBAC (Person 1)
│   │   ├── users/
│   │   ├── products/
│   │   ├── orders/
│   │   └── convex/        ← Convex client service
│   ├── convex/            ← Convex schema + functions
│   ├── package.json
│   └── nest-cli.json
│
└── README.md
```

The exact structure may evolve; confirm significant changes with the team.

## 10. AI Coding-Agent Guidance

When modifying this project:
1. Read this context before making architectural decisions.
2. **Do not bypass NestJS** for authentication or authorization — all protected routes must go through NestJS guards.
3. Use **Next.js** as the frontend framework (pages / app router).
4. Use **NestJS** for all backend API routes, auth, and business logic.
5. Use **Convex** for database queries and mutations (called from NestJS service layer).
6. Respect team boundaries: Auth/RBAC = Person 1, DB/Admin = Person 2, Cart/Order = Person 3, Cloud = Person 4.
7. Do not implement TBD features without explicit team confirmation.
8. Prefer small, testable changes.
9. Preserve existing working functionality when adding features.
10. Explain any required schema changes before making them.

