# Frostify

## Current State
ShopForge is a Shopify-style platform where users create stores, manage products/orders, and get AI assistance. It has membership tiers, currency switching (USD/GBP), and role-based access control (admin/user/guest). No payment configuration, subscription management, or PayPal verification exists.

## Requested Changes (Diff)

### Add
- Rename all "ShopForge" branding to "Frostify" throughout the frontend
- Staff payment configuration panel: accessible only with PIN 141206, where staff can configure accepted payment methods (PayPal, bank transfer, crypto addresses, etc.) and their details/addresses
- On the signup/membership purchase flow: display configured payment addresses so users can copy them to send payment, plus a field for the user to enter their PayPal username for payment verification
- Subscription management: staff (with PIN) can view all user subscriptions and cancel any subscription if payment was not received
- Backend: store payment config (methods, addresses), store user PayPal usernames, manage subscriptions (active/cancelled status), staff cancel subscription endpoint

### Modify
- MembershipPage: after selecting a plan, show payment instructions with copyable payment addresses before completing signup
- UserProfile: add `paypalUsername` and `subscriptionStatus` fields
- DashboardPage: show subscription status to users; if cancelled, show a notice

### Remove
- Nothing removed

## Implementation Plan
1. Update backend (main.mo):
   - Add `PaymentMethod` type (name, address/details)
   - Add `PaymentConfig` storing list of payment methods
   - Add `setPaymentConfig` / `getPaymentConfig` (admin only for set, public for get)
   - Add `paypalUsername` and `subscriptionStatus` fields to UserProfile
   - Add `cancelUserSubscription(user: Principal)` admin-only endpoint
   - Add `listAllUserProfiles` admin-only endpoint (for staff to see subscriptions)
2. Update frontend:
   - Global: replace all "ShopForge" text with "Frostify"
   - New StaffPaymentPanel component: PIN-gated (141206), tabs for configuring payment methods (add/edit/remove), view all subscriptions, cancel subscriptions
   - MembershipPage: after plan selection, show payment step with copyable addresses + PayPal username input field, save paypalUsername to profile on submit
   - DashboardPage: show subscription status badge; if cancelled show warning banner
   - Navigation/header: add Staff link that opens PIN modal then StaffPaymentPanel
