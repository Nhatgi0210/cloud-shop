# PROJECT BRIEF — Cloud E-Commerce Application

## 1. Project Summary

Build a cloud-based e-commerce web application using:

- **Next.js** — frontend framework (React-based, SSR/SSG)
- **NestJS** — backend API framework (Node.js, REST)
- **Convex** — cloud database + real-time queries/mutations
- **Vercel** — cloud deployment (frontend)
- **GitHub** — source control

Architecture follows a **fullstack separation**: Next.js handles UI and routing; NestJS handles business logic, API endpoints, and authorization; Convex handles the cloud database layer.

## 2. Main User Flow

```text
Home
  ↓
Browse Products
  ↓
Search / Filter Product
  ↓
Add to Cart
  ↓
Cart
  ↓
Adjust Quantity
  ↓
Place Order
  ↓
Order Created
```

## 3. Admin Flow

```text
Login (/login)
  ↓
/admin  (protected — admin role only)
  ↓
View Products
  ├── Add Product
  ├── Edit Product
  └── Delete Product
```

Authorization for `/admin` is **role-based** and enforced by **NestJS Guards + JWT**. Only users with the `admin` role may access admin routes. This is handled by **Person 1**.

## 4. Core Features

### Product
- Home page
- Product list
- Product cards
- Search
- Optional category filter
- Responsive UI

### Cart
- Add product
- View cart
- Increase/decrease quantity
- Remove product
- Calculate total

### Order
- Simple order form
- Place order
- Save order via NestJS API → Convex
- Show success message

### Admin
- Product CRUD
- Simple `/admin` dashboard
- Protected by role-based authorization (admin role only)

### Authentication & Authorization *(Person 1)*
- Login / Register UI (Next.js pages)
- JWT-based authentication (NestJS AuthModule)
- Role-based access control (RBAC): `admin` / `user`
- NestJS Guards protecting `/admin` and sensitive API routes
- Auth token stored securely (HTTP-only cookie or localStorage)

### Cloud
- GitHub repository
- Vercel deployment (Next.js frontend)
- NestJS backend deployment (e.g., Railway / Render)
- Environment variables
- Vercel ↔ NestJS ↔ Convex connection
- Deployment documentation

## 5. Data

Required core collections (managed via Convex):

```text
users
products
orders
```

Core fields (working set):

**users**
```text
id, email, passwordHash, role (admin | user), createdAt
```

**products**
```text
id, name, price, description, imageUrl, category
```

**orders**
```text
id, userId, items[], totalPrice, status, createdAt
```

Full schemas may be refined during development.

## 6. Team Assignment

| Person | Main Responsibility |
|---|---|
| 1 | Authentication + Authorization (Login/Register UI, JWT, RBAC, NestJS Guards) |
| 2 | Convex Database + Admin UI (Schema, Queries/Mutations, `/admin` CRUD) |
| 3 | Cart + Order (Cart UI, Order form, NestJS Order API) |
| 4 | Vercel + Cloud Deployment (GitHub, Vercel, NestJS hosting, env vars, docs) |

## 7. Current Architecture

```text
          ┌─────────────────┐
          │    Next.js      │   (Vercel)
          │    Frontend     │
          └────────┬────────┘
                   │ HTTP / REST
                   ▼
          ┌─────────────────┐
          │    NestJS       │   (Railway / Render)
          │  Backend API    │
          │  + Auth Guards  │
          └────────┬────────┘
                   │ Convex Client
                   ▼
          ┌─────────────────┐
          │     Convex      │
          │  Queries /      │
          │  Mutations      │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │   Convex DB     │
          │  users          │
          │  products       │
          │  orders         │
          └─────────────────┘

GitHub ──────────► Vercel (Frontend)
              └──► NestJS Host (Backend)
```

## 8. Important Scope Boundary

Do NOT automatically add unless explicitly confirmed:
- Payment gateway
- Inventory management
- Admin order management
- Product detail page
- Email notifications
- File upload / CDN for images

These are currently unspecified/TBD.

## 9. Definition of a Successful MVP

The MVP is successful when a user can:

1. Open the deployed website.
2. Register / log in.
3. Browse products.
4. Search for a product.
5. Add a product to the cart.
6. Change quantity.
7. See the total.
8. Submit an order.
9. Have the order stored in Convex via NestJS API.
10. Receive a success notification.

An admin should also be able to:

1. Log in with an admin account.
2. Access the protected `/admin` dashboard.
3. View, add, edit, and delete products.
4. Have unauthorized users blocked from `/admin`.

The application must be deployed successfully on Vercel (frontend) and a suitable cloud host (NestJS backend), both connected to Convex.
