# Context: ECSAD Kiosk

Background and decisions for anyone (human or AI) working on this project. Read this before changing behavior.

## Purpose

ECSAD is serving food to the panelists at the defense of the neighboring section, DCSAD. This app takes panelists' meal orders and shows them to the kitchen team. It is used once, on the day of the event.

## Decisions (settled)

### Users and access
- Panelists use their own phones. They enter only their name. No account, no password.
- Kitchen staff use one shared Supabase Auth login on several phones, at `/kitchen`.
- The earlier idea of a hardcoded `root` / `password123` login was dropped. The site is deployed publicly, so use a real Supabase Auth user.
- The link or QR is shared only at the venue. No access code and no pre-registered name list. Anyone with the link could submit orders; this is accepted.

### Panelist identity
- Device-bound. After submitting, the order IDs are saved in the browser (localStorage or a cookie).
- Only the same phone can edit its orders. Re-entering a name does not give access.

### Ordering flow
1. Enter name.
2. Order breakfast.
3. Order lunch.
4. See live status.

### Selection rules
- Food (breakfast and lunch): one or more.
- Coffee, drink, fruit, rice: exactly one. "No Coffee" and "No Fruit" are valid picks.
- Every category except Food is required.

### Orders and statuses
- Breakfast and lunch are two separate orders, each with its own status.
- Statuses: `Reviewing` → `Preparing` → `Served`.
- A panelist can edit an order only while it is `Reviewing`.
- The kitchen advances an order with a tap and can move it back one step. An order moved back to `Reviewing` is editable again.
- No `Cancelled` state. No kitchen-to-panelist messaging.

### Kitchen view
- Three columns or tabs by status.
- Each card shows the panelist's name, the meal, and the picks.
- Live updates via Supabase realtime. Tap to advance.

### Panelist view
- Live status on the phone (Reviewing, Preparing, Served).
- The menu is fixed. No sold-out toggles.

## Menu (source of truth: `Kiosk Choices.md`)

**Breakfast**
- Food: Pandesal, Pancake, Scrambled Egg
- Coffee: Coffee Black, Coffee White, Coffee Mix, No Coffee
- Drink: Water, Orange Juice

**Lunch**
- Food: Shanghai, Siomai Steamed, Buchi, Chicken
- Fruit: No Fruit, Apples, Grape, Orange
- Rice: Plain Rice, Chaopan Rice
- Drink: Coke, Royal, Water

## Constraints for implementation

- **Row-level security is the main protection.** Panelists have no auth, so policies must:
  - allow inserting orders;
  - allow updating or reading a panelist's own order only while it is `Reviewing`, tied to the order ID held by that device;
  - restrict reading all orders and changing status to the authenticated kitchen user.
- Enforce the selection rules on the server side (or in database constraints), not only in the UI.
- Mobile-first UI. Panelists are on phones, and kitchen staff also use phones.
- Panelist status updates and the kitchen board both use realtime subscriptions.

## Known risks (accepted)

- Anyone with the link can submit or flood orders.
- Clearing browser data loses edit access and may create duplicate names. A duplicate-name warning on kitchen cards would help.
- If an item runs out, staff must walk over to the panelist.

## Not in scope

- Panelist accounts or passwords.
- Sold-out toggles.
- Cancelled state or messaging.
- Individual kitchen accounts.
- Event access codes or name allowlists.

## Suggested next step

Scaffold the Supabase schema (orders, order items, statuses), the RLS policies, and the Next.js pages for panelists and the kitchen.
