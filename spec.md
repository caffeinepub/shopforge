# Frostify

## Current State
- `MembershipPage.tsx` has hardcoded plan prices: Starter $9, Pro $29, Enterprise $99.
- The membership page currently only offers the standard 3 monthly plans with no option to choose 1 or 2 months duration.
- The dashboard Settings tab has an Account section with "Purchase Another Month" and "Decline & Cancel" buttons.
- "Decline & Cancel" currently sets status to "cancelled" in localStorage, calls `clear()`, and navigates to `/`.
- `StaffPaymentPanel.tsx` has a Payments tab (add/edit/delete payment methods) and a Subscriptions tab (cancel/reactivate).
- Plan prices are hardcoded in `MembershipPage.tsx` as static strings (`$9`, `$29`, `$99`).
- There is no staff feature to edit membership prices.
- `expiresAt` is stored on subscriptions (30 days from joinedAt).

## Requested Changes (Diff)

### Add
- **Duration selection on MembershipPage**: after selecting a plan, let users choose 1 month or 2 months. The total price shown updates accordingly (e.g. Pro $29/mo × 2 = $58). The `expiresAt` stored in localStorage should reflect the chosen duration (30 or 60 days from now).
- **Staff: Membership Pricing tab** in `StaffPaymentPanel.tsx`: a new "Pricing" tab where staff can edit the price of each plan (Starter, Pro, Enterprise). Prices saved to `localStorage` under key `frostify_plan_prices`. `MembershipPage.tsx` reads prices from localStorage (falling back to defaults if not set).
- **Decline behaviour fix**: when the user clicks "Decline & Cancel" in the dashboard Account section, it should:
  1. Set subscription status to "cancelled" in localStorage.
  2. Call `clear()` to log out.
  3. Navigate to `/` (home).
  This is already partially done, but make sure it works cleanly and shows a toast: "Your subscription has been cancelled."

### Modify
- `MembershipPage.tsx`:
  - Read plan prices from `localStorage` key `frostify_plan_prices` (object `{ starter: number, pro: number, enterprise: number }`), falling back to defaults `{ starter: 9, pro: 29, enterprise: 99 }`.
  - After the user selects a plan (step 1), add a **duration selector** before the "Continue to Payment" button: two toggle options — "1 Month" and "2 Months". Default to 1 month. Show the total price for the selected duration.
  - On step 2 (payment), show the plan name, duration, and total price clearly.
  - In `handleCompletePayment`, set `expiresAt` based on duration (30 days for 1 month, 60 days for 2 months).
- `StaffPaymentPanel.tsx`:
  - Add a third tab "Pricing" (icon: `Tag` or `DollarSign`).
  - The Pricing tab shows the three plans (Starter, Pro, Enterprise) with their current prices.
  - Staff can click edit on any plan to change the monthly price (number input, min $1).
  - Prices are saved to `localStorage` under `frostify_plan_prices`.
  - Show a note: "These prices are shown to users on the membership page."

### Remove
- Nothing removed.

## Implementation Plan
1. Create `frostify_plan_prices` localStorage helpers in `StaffPaymentPanel.tsx`: `loadPlanPrices()` / `savePlanPrices()`.
2. Add Pricing tab to `StaffPaymentPanel.tsx` with inline price editing for each plan.
3. Update `MembershipPage.tsx` to read prices from `frostify_plan_prices` localStorage.
4. Add duration selector (1 month / 2 months) to step 1 of `MembershipPage.tsx`; update price display and `expiresAt` calculation in `handleCompletePayment`.
5. Ensure "Decline & Cancel" in dashboard Account section logs out, cancels subscription, toasts, and navigates home.
6. Run `npm run build` to verify no errors.
