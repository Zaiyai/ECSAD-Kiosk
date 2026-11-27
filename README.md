# ECSAD Kiosk - Event Meal Ordering

<div align="center">
  <!-- Replace the src below with your app logo or event badge -->
  <img src="logo/ECSAD_LOGO.png" alt="ECSAD Kiosk Logo" style="border-radius: 50%; width: 150px; height: 150px;"></br>
</div><br>

> **Warning:** ECSAD Kiosk is an internal one-day event app for the DCSAD defense. Do not share the deployment link or QR code publicly outside the venue.

ECSAD Kiosk makes ordering breakfast and lunch for defense panelists fast and effortless. Built for mobile browsers with Next.js and Supabase, it lets panelists order directly from their phones while giving the ECSAD kitchen team a live board to prepare and serve meals. Simplicity and Speed are our two main drivers: zero sign-ups, zero passwords, and real-time order tracking.

* **Zero Friction for Panelists**
  We believe panelists shouldn't have to create an account just to get breakfast or lunch. Open the link or scan the venue QR code, enter your name, and submit your picks in seconds.

* **Device-Bound Privacy**
  Your active orders stay tied to your phone's browser automatically—no passwords or personal emails required. Edit your order anytime while it is still being reviewed.

* **Live Kitchen Board**
  Real-time updates via server-sent events let kitchen staff move orders across *Reviewing*, *Preparing*, and *Served* with a single tap.

| Panelist Entry | Breakfast Menu | Lunch Menu | Live Status | Kitchen Board |
| :---: | :---: | :---: | :---: | :---: |
| ![1](docs/screenshots/screenshot1.png) | ![2](docs/screenshots/screenshot2.png) | ![3](docs/screenshots/screenshot3.png) | ![4](docs/screenshots/screenshot4.png) | ![5](docs/screenshots/screenshot5.png) |

## How It Works

ECSAD Kiosk runs on any modern mobile or desktop web browser with no installation required.

### Panelist Flow

1. Open the event link or scan the QR code on your phone.
2. Enter your name.
3. Select your breakfast and lunch items.
4. Track your live order status (`Reviewing` → `Preparing` → `Served`) directly on your screen.

### Kitchen Staff (`/kitchen`)

Kitchen staff share a single staff login at `/kitchen` across kitchen phones.

* Orders appear in three columns: **Reviewing**, **Preparing**, and **Served**.
* Tap any order card to advance its status, or step it back if needed.
* Moving an order back to **Reviewing** allows the panelist to edit their picks again.

<div align="center">
  <img alt="Stack: Next.js" src="https://img.shields.io/badge/Frontend-Next.js-black">
  <img alt="Database: Supabase" src="https://img.shields.io/badge/Backend-Supabase%20Postgres-3ECF8E">
</div>

## Menu & Order Rules

Breakfast and lunch are submitted as two separate orders, each tracked with its own status. The menu is fixed for the event.

### Breakfast

| Category | Options | Rule |
| :--- | :--- | :--- |
| **Food** | Pandesal, Pancake, Scrambled Egg | One or more |
| **Coffee** | Coffee Black, Coffee White, Coffee Mix, No Coffee | Exactly one |
| **Drink** | Water, Orange Juice | Exactly one |

### Lunch

| Category | Options | Rule |
| :--- | :--- | :--- |
| **Food** | Shanghai, Siomai Steamed, Buchi, Chicken | One or more |
| **Fruit** | Apples, Grapes, Oranges, Bananas | 0 or more |
| **Rice** | Plain Rice, Chaopan Rice | Exactly one |
| **Drink** | Coke, Royal, Water | Exactly one |

## Deployment & Setup

> **Important:** All Supabase database access runs server-side through Next.js route handlers. Never prefix your Supabase service-role key with `NEXT_PUBLIC_` or expose it to the client.

### Local Installation

1. Create a Supabase project and set up the `orders` and `order_items` tables.
2. Run `supabase/migrations/20261128000000_orders_storage.sql` in the Supabase SQL Editor to add order columns and atomic write functions.
3. Copy `.env.example` to `.env.local` and configure your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   KITCHEN_AUTH_SECRET=
   KITCHEN_STAFF_EMAIL=
   KITCHEN_STAFF_PASSCODE=
   ```
4. Install dependencies and start the development server:
   ```bash
   npm install
   npm run dev
   ```[cite: 2]

*(Note: Legacy `.data/orders.json` files are kept strictly as local archives and are not imported into Supabase.)*

## Security & Venue Integrity

ECSAD Kiosk prioritizes speed and ease of access during a live event. To prevent unauthorized or duplicate orders during the defense, keep these operational guidelines in mind:

- **Keep the URL Local:** Anyone with the link can submit orders—display the QR code only inside the venue.
- **Avoid Clearing Browser Data:** Panelist edit access relies on local browser storage/cookies; clearing site data removes edit permissions for submitted orders.
- **No In-App Messaging or Cancellations:** There is no `Cancelled` status or chat feature; if an item runs out, kitchen staff will coordinate directly with the panelist.

For architecture rules, settled design decisions, and implementation constraints, see [`CONTEXT.md`](CONTEXT.md).
