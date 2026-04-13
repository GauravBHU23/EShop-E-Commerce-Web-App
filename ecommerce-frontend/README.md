# EShop Frontend — Next.js 14 + TypeScript

Enterprise e-commerce frontend built with Next.js App Router, TypeScript, and Tailwind CSS.

---

## Tech Stack

| Purpose | Library |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Zustand (auth + cart) |
| Server State | TanStack React Query |
| API Client | Axios (with JWT interceptors) |
| Forms | React Hook Form + Zod |
| Notifications | Sonner |
| Icons | Lucide React |
| Theme | next-themes (dark mode) |

---

## Project Structure

```
src/
├── app/
│   ├── (store)/              ← Main store pages (with Navbar + Footer)
│   │   ├── page.tsx          ← Home
│   │   ├── products/         ← Product listing + search
│   │   │   └── [slug]/       ← Product detail + reviews
│   │   ├── cart/             ← Shopping cart
│   │   ├── checkout/         ← Checkout + address + payment
│   │   ├── orders/           ← Order history
│   │   │   └── [id]/         ← Order detail + tracker
│   │   └── profile/          ← User profile + addresses + password
│   ├── auth/
│   │   ├── login/            ← Login
│   │   ├── register/         ← Register
│   │   ├── forgot-password/  ← Forgot password
│   │   └── reset-password/   ← Reset password
│   ├── admin/                ← Admin panel (sidebar layout)
│   │   ├── dashboard/        ← Stats + top products
│   │   ├── products/         ← CRUD + image upload
│   │   ├── orders/           ← View + update status
│   │   └── users/            ← View + enable/disable
│   ├── layout.tsx            ← Root layout (Providers + Sonner)
│   └── not-found.tsx         ← 404 page
│
├── components/
│   ├── layout/               ← Navbar, Footer, Providers
│   ├── product/              ← ProductCard, CategoryCard
│   ├── common/               ← LoadingSpinner, EmptyState, Pagination, StarRating, Badge
│   └── admin/                ← ProductFormModal
│
├── hooks/
│   └── useApi.ts             ← All React Query hooks (useProducts, useCart, useOrders...)
│
├── lib/
│   ├── api.ts                ← All API service functions
│   ├── axios.ts              ← Axios instance with JWT interceptors
│   └── utils.ts              ← cn(), formatPrice(), formatDate(), getProductImage()...
│
├── store/
│   ├── authStore.ts          ← Zustand auth store (token, user, isAdmin)
│   └── cartStore.ts          ← Zustand cart store (item count)
│
├── types/
│   └── index.ts              ← All TypeScript types mirroring Spring Boot DTOs
│
└── styles/
    └── globals.css           ← Tailwind + CSS variables (shadcn/ui tokens)
```

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8080
```

If you skip this step, the frontend now falls back to `http://localhost:8080` automatically for API calls and uploaded image URLs.

### 3. Start Spring Boot backend without Docker

From the sibling `E-Commerce SpringBoot-Backend` folder:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

The `dev` profile now uses PostgreSQL by default, so make sure a local PostgreSQL instance is available or start the backend stack with Docker Compose.

### 4. Run the frontend

```bash
npm run dev
```

Open: `http://localhost:3000`

---

## Pages Overview

| Route | Description | Auth |
|---|---|---|
| `/` | Home with hero, categories, latest products | Public |
| `/products` | Product listing with search + filter + sort | Public |
| `/products/[slug]` | Product detail with images, reviews, add to cart | Public |
| `/cart` | Shopping cart with quantity controls | Login |
| `/checkout` | Address selection, payment, place order | Login |
| `/orders` | Order history list | Login |
| `/orders/[id]` | Order detail with status tracker | Login |
| `/profile` | Edit profile, manage addresses, change password | Login |
| `/auth/login` | Login with demo credentials shown | Public |
| `/auth/register` | Register new account | Public |
| `/auth/forgot-password` | Request password reset email | Public |
| `/auth/reset-password` | Reset with token from email | Public |
| `/admin/dashboard` | Stats, revenue, top products | Admin |
| `/admin/products` | Full product CRUD + image upload | Admin |
| `/admin/orders` | View all orders + update status | Admin |
| `/admin/users` | View users + enable/disable | Admin |

---

## Key Features

- JWT stored in Zustand + Cookie (persisted across refreshes)
- Axios interceptor auto-attaches `Bearer` token to every request
- Auto-redirect to `/auth/login` on 401 responses
- React Query caches products (5 min), categories (10 min)
- Cart item count shows in Navbar in real-time via Zustand
- Order status tracker with animated progress bar
- Image upload preview before submitting
- Dark mode via `next-themes`
- Responsive design — mobile first

---

## Demo Credentials

```
Admin:  admin@eshop.com / Admin@123
User:   Register a new account
```

---

## Build for Production

```bash
npm run build
npm run start
```

## Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
# Set NEXT_PUBLIC_API_URL to your deployed Spring Boot URL
```
