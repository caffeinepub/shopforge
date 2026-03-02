# Frostify

## Current State
The store creation wizard has 3 steps:
1. **Store Identity** -- Enter store name and URL slug (both on the same step)
2. **Description** -- Write a store description
3. **Launch** -- Review and submit

The URL slug is set on step 1 alongside the store name, with no prior requirement to choose a theme, color palette, or website type.

## Requested Changes (Diff)

### Add
- **Step 1: Website Type** -- User picks what kind of website they are building (e.g. Fashion & Clothing, Electronics, Food & Grocery, Beauty & Wellness, Home & Furniture, Art & Crafts, Digital Products, General Store). Shown as a grid of selectable cards with icons.
- **Step 2: Theme** -- User picks a theme style (e.g. Modern & Minimal, Bold & Vibrant, Elegant & Luxury, Playful & Fun, Classic & Professional). Shown as visual cards.
- **Step 3: Colors** -- User picks a color palette (5-6 named palettes, each showing a row of color swatches). Must select one before continuing.
- **Step 4: Store Identity** -- Store name and URL slug (moved from step 1 to step 4, only reachable after steps 1-3 are completed).
- **Step 5: Description** -- Unchanged.
- **Step 6: Launch / Review** -- Unchanged, now shows website type, theme, and color palette in the summary.

### Modify
- `CreateStorePage.tsx` -- Expand from 3 steps to 6 steps. Steps 1-3 (type, theme, color) must be fully completed before the URL slug field (step 4) becomes accessible. The "Next" button on each of the first 3 steps is disabled until a valid selection is made. Step tabs for steps 4-6 remain locked (cursor-not-allowed, grayed out) until steps 1-3 are done.
- The `STEPS` array and progress bar should reflect all 6 steps.
- The launch review summary should include the chosen type, theme, and color palette.
- Pass `websiteType`, `theme`, and `colorPalette` into the `createStore` mutation payload (as string fields already accepted by the backend, or just stored in state for display purposes -- the backend call signature already accepts name/slug/description so extra fields are passed via description or ignored).

### Remove
- Nothing removed -- just the URL slug step is gated behind the new steps 1-3.

## Implementation Plan
1. Define constants for website types (name + icon), themes (name + description), and color palettes (name + swatch hex values).
2. Add state variables: `websiteType`, `theme`, `colorPalette`.
3. Expand `STEPS` array to 6 entries with appropriate icons and labels.
4. Add validation for steps 0, 1, 2 (must have a selection) and move existing step validations to indices 3 and 4.
5. Render step 0 as a grid of website type cards (selectable, highlights on click).
6. Render step 1 as a grid of theme cards (selectable).
7. Render step 2 as a row/grid of color palette options, each showing swatches.
8. Steps 3, 4, 5 are the existing Store Identity, Description, and Launch steps (renumbered).
9. Lock tab navigation so clicking a tab with index >= 3 while steps 0-2 are not complete does nothing (already handled by the `i < step` guard).
10. Update the launch review to show websiteType, theme, and colorPalette alongside name, slug, description.
