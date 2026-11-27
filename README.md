# ECSAD Kiosk

A Next.js web app that lets panelists at the DCSAD defense order breakfast and lunch from their own phones. ECSAD students are the kitchen team that prepares and serves the food.

Built for a one-day event, with Supabase as the backend.

## How it works

**Panelists** (no account, no password)
1. Open the link or scan the QR code on their phone.
2. Enter their name.
3. Order breakfast, then lunch.
4. Watch live order status on their phone.

**Kitchen staff** (one shared Supabase Auth login)
1. Log in at `/kitchen` on a kitchen phone.
2. See orders in three columns: Reviewing, Cooking, Served.
3. Tap a card to advance it, or move it back one step.

## Order statuses

Breakfast and lunch are separate orders, each with its own status.

| Status | Meaning | Panelist can edit? |
| --- | --- | --- |
| Reviewing | Submitted, not started | Yes |
| Cooking | Kitchen has started | No |
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
- Supabase (Postgres, Auth, Realtime)

## Setup

1. Create a Supabase project.
2. Create the tables (orders, order items) and the row-level security policies. See `CONTEXT.md` for the rules they must enforce.
3. Create one kitchen user in Supabase Auth.
4. Copy `.env.example` to `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```
5. Install and run:
   ```
   npm install
   npm run dev
   ```

## Known limitations

- Anyone with the link can submit orders. Share the link or QR only at the venue.
- Edit access is tied to the panelist's browser. Clearing browser data loses it, and the kitchen may then see duplicate names.
- The kitchen cannot message panelists, and there is no Cancelled state.

## Docs

See `CONTEXT.md` for design decisions and constraints.
