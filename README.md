# ECSAD Kiosk

A Next.js web app that lets panelists at the DCSAD defense order breakfast and lunch from their own phones. ECSAD students are the kitchen team that prepares and serves the food.

Built for a one-day event, with Supabase as the backend.

## How it works

**Panelists** (no account, no password)
1. Open the link or scan the QR code on their phone.
2. Enter their name.
3. Order breakfast, then lunch.
4. Watch live order status on their phone.

**Kitchen staff** (one shared staff login)
1. Log in at `/kitchen` on a kitchen phone.
2. See orders in three columns: Reviewing, Preparing, Served.
3. Tap a card to advance it, or move it back one step.

## Order statuses

Breakfast and lunch are separate orders, each with its own status.

| Status | Meaning | Panelist can edit? |
| --- | --- | --- |
| Reviewing | Submitted, not started | Yes |
| Preparing | Kitchen has started | No |
| Served | Done | No |

The kitchen can move an order back one step. An order moved back to Reviewing becomes editable again.

## Menu

**Breakfast**

| Category | Options | Rule |
| --- | --- | --- |
| Food | Pandesal, Pancake, Scrambled Egg | One or more |
| Coffee | Coffee Black, Coffee White, Coffee Mix, No Coffee | Exactly one |
| Drink | Water, Orange Juice | Exactly one |

**Lunch**

| Category | Options | Rule |
| --- | --- | --- |
| Food | Shanghai, Siomai Steamed, Buchi, Chicken | One or more |
| Fruit | No Fruit, Apples, Grape, Orange | Exactly one |
| Rice | Plain Rice, Chaopan Rice | Exactly one |
| Drink | Coke, Royal, Water | Exactly one |

The menu is fixed. There are no sold-out toggles.

## Tech stack

- Next.js
- Supabase Postgres (server-side service-role access)

## Setup

1. Create a Supabase project.
2. Create the `orders` and `order_items` tables shown in your schema.
3. Apply `supabase/migrations/20261128000000_orders_storage.sql` in the Supabase SQL Editor. It adds the app-specific order columns and atomic order-write functions.
4. Copy `.env.example` to `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   KITCHEN_AUTH_SECRET=
   KITCHEN_STAFF_EMAIL=
   KITCHEN_STAFF_PASSCODE=
   ```
   The service-role key is server-only. Never prefix it with `NEXT_PUBLIC_` or expose it in browser code.
5. Install and run:
   ```
   npm install
   npm run dev
   ```

The app reads and writes orders directly in Supabase. Existing `.data/orders.json` data is retained as an archive and is not imported.

## Known limitations

- Anyone with the link can submit orders. Share the link or QR only at the venue.
- Edit access is tied to the panelist's browser. Clearing browser data loses it, and the kitchen may then see duplicate names.
- The kitchen cannot message panelists, and there is no Cancelled state.

## Docs

See `CONTEXT.md` for design decisions and constraints.
