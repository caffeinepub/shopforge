# Frostify

## Current State
- Full store builder platform with dashboard (Products, Orders, Analytics, AI Assistant, Settings tabs)
- Staff panel at /staff with PIN 141206
- Membership/subscription system with manual monthly payments
- Currency switching (USD/GBP)
- Blob storage and authorization components already selected
- AI assistant uses `aiAssist` backend function (currently stub)
- Products table shows name/category/price/stock but no images/videos
- No "Memberships" product type for store owners to sell
- No user payment info section (where users set their own PayPal/bank/Stripe payout details)

## Requested Changes (Diff)

### Add
- **Store Memberships tab** in dashboard: users can create and manage membership tiers for their own store (name, price, duration, description, perks) displayed as purchasable plans on their storefront
- **Product/Membership media uploads**: image and video upload support on product add/edit forms using blob-storage
- **Frost AI identity**: rename AI Assistant to "Frost" throughout with branding as the best AI for website building, include website-building focused quick prompts
- **Payment Settings section** in dashboard Settings tab: users enter their own payout/payment info (PayPal email/username, bank transfer details, Stripe account ID) so payments from their store customers go to them. Clearly labeled as "where you receive payments"
- Auto-accept payment methods: PayPal, bank transfer, Stripe shown as toggleable channels

### Modify
- Dashboard nav: add "Memberships" tab between Products and Orders
- AI Assistant tab: rename to "Frost AI", update branding (name Frost, tagline "The smartest AI for website building"), update quick action prompts to include website-building tips
- Settings tab: add new "Payment Payouts" section below store settings

### Remove
- Nothing removed

## Implementation Plan
1. Update backend to add store membership types (StoreMembership: id, storeId, name, description, price, duration in days, perks, isActive) with CRUD functions
2. Add `saveStorePaymentInfo` / `getStorePaymentInfo` backend functions (paypal email, bank name, account number, sort code, stripe account id, enabled channels)
3. Update `addProduct` / `updateProduct` backend to accept optional mediaIds (images/videos via blob storage)
4. Frontend: Add StoreMembershipsTab component in DashboardPage
5. Frontend: Update product form to support image/video uploads
6. Frontend: Rename AI tab to "Frost AI" with new branding and prompts
7. Frontend: Add Payment Payouts section to Settings tab
8. Frontend: Add memberships display section on StorefrontPage
9. Update hooks/useQueries.ts for new backend calls
