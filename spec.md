# ShopForge - Multi-Tenant E-Commerce Platform

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Multi-tenant store creation: each user can create and manage their own store with a unique store slug/URL path
- Store management dashboard: add/edit/delete products, manage orders, configure store settings
- Product catalog: products with name, description, price, images (blob), category, stock count
- Storefront pages: each store has a public-facing page at `/store/:storeSlug` showing its products
- Shopping cart: customers can add products to cart and place orders
- Order management: store owners can view and update order status (pending, fulfilled, cancelled)
- AI Assistant: integrated chat assistant on both the store admin dashboard and the storefront, to help store owners write product descriptions, answer customer questions, suggest pricing, and generate store content
- User authentication: login/signup with Internet Identity, role-based (platform admin, store owner, customer)
- Store analytics: basic stats (total orders, revenue, top products)

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan
1. Backend (Motoko):
   - User registry: store principal -> profile (name, email, role)
   - Store registry: storeId, ownerId, name, slug, description, banner image, isActive
   - Product CRUD: productId, storeId, name, description, price, stock, category, imageId
   - Order management: orderId, storeId, buyerPrincipal, items[], status, total, createdAt
   - AI assistant endpoint: accepts a prompt + context (store info, products) and returns AI-generated suggestions
   - Store analytics: aggregate orders per store for revenue and order counts

2. Frontend:
   - Landing page: platform homepage with hero, feature highlights, "Create your store" CTA
   - Auth flow: Internet Identity login/signup
   - Store creation wizard: pick store name, slug, description
   - Admin dashboard: sidebar nav with Products, Orders, Analytics, AI Assistant, Settings
   - Product manager: list, add, edit, delete products with image upload
   - Order manager: list orders with status updates
   - Analytics panel: revenue chart, order count, top products
   - AI Assistant panel: chat interface for store owners (product description generator, SEO suggestions, pricing advice)
   - Public storefront: `/store/:slug` with product grid, store header, cart sidebar
   - Cart + checkout: add to cart, enter name/email, place order
   - AI chat widget: floating chat bubble on storefronts for customer Q&A
