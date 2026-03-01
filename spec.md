# ShopForge

## Current State

ShopForge is a full-stack Shopify-style platform where authenticated users can create their own stores with unique URLs, manage products, view orders and analytics, and use an AI assistant. The app has:

- `LandingPage` at `/` -- hero, features, featured stores, CTA
- `LoginPage` at `/login` -- Internet Identity authentication
- `CreateStorePage` at `/create-store` -- 3-step store creation wizard
- `DashboardPage` at `/dashboard` -- store management with sidebar tabs (overview, products, orders, analytics, AI, settings)
- `StorefrontPage` at `/store/$slug` -- public-facing storefront with product grid and cart
- `StoresPage` at `/stores` -- directory of all stores
- `NoStorePage` at `/dashboard/no-store`

The `useActor` hook initializes an anonymous actor on page load and an authenticated one after login. Queries (via React Query) wait for `actor` to be ready before fetching. The `RouterProvider` is rendered twice -- once inside the root route component, and once in the `App` export -- which causes a React Router tree mismatch that breaks routing and loading.

## Requested Changes (Diff)

### Add
- **`WelcomePage`** at `/` (new, replaces LandingPage as the root route): A landing page with:
  - Header with logo and nav (About, Pricing, Stores, Log In)
  - Hero section with tagline, brief description, and two CTAs: "Get Started" (→ /membership) and "Browse Stores" (→ /stores)
  - "About Us" section explaining ShopForge, its mission, and how it works (3-step how-it-works)
  - Features section (reuse existing FEATURES data)
  - Membership/Pricing section with three tiers (Starter $9/mo, Pro $29/mo, Enterprise $99/mo) each with a "Choose Plan" button that routes to `/membership`
  - Footer
- **`MembershipPage`** at `/membership`: A page where users can view and select a membership plan before accessing the platform. Shows plan cards (Starter, Pro, Enterprise), a "Continue" button that stores chosen plan in localStorage and redirects to `/login`, and a notice that membership is required to create a store.
- Route for `/membership` in `App.tsx`

### Modify
- **`App.tsx`**: Fix the double `RouterProvider` bug -- the root route component renders `<RouterProvider router={router} />` creating infinite recursion; it should render `<Outlet />` from `@tanstack/react-router` instead. Also wire up the new `/membership` route.
- **`LandingPage.tsx`**: Rename/repurpose as `WelcomePage.tsx` -- replace root `/` route with the new welcome+about+membership page. The existing LandingPage can be retired or kept as a component.
- **`useAllStores`** hook: Currently only enabled when `actor && !isFetching`. The public stores listing should work for anonymous (non-logged-in) users -- this is already the case since `listAllStores` is a public query, but the actor initialization needs to complete first. No backend changes needed.

### Remove
- Nothing removed; existing LandingPage content is absorbed into the new WelcomePage.

## Implementation Plan

1. Fix `App.tsx`: Replace the root route's `component` from rendering `<RouterProvider router={router}>` to `<Outlet />` (imported from `@tanstack/react-router`). This fixes the recursive RouterProvider bug that causes nothing to load.
2. Create `src/frontend/src/pages/MembershipPage.tsx`: Three plan cards (Starter/Pro/Enterprise with features list), plan selection state, "Continue to Login" button that saves plan to localStorage and navigates to `/login`.
3. Create `src/frontend/src/pages/WelcomePage.tsx`: Full marketing landing page with About Us section, How It Works steps, Features grid, Pricing/Membership section, and footer. Root `/` route points here.
4. Update `App.tsx` routes: Change `indexRoute` component to `WelcomePage`, add `membershipRoute` at `/membership` pointing to `MembershipPage`.
5. Validate (typecheck + build).
