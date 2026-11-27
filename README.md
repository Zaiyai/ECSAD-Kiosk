# ECSAD Kiosk - Event Meal Ordering[cite: 2, 3]

<div align="center">
  <!-- Replace the src below with your app logo or event badge -->
  <img src="public/logo.png" alt="ECSAD Kiosk Logo" style="border-radius: 50%; width: 150px; height: 150px;"></br>
</div><br>

> **Warning:** ECSAD Kiosk is an internal one-day event app for the DCSAD defense. Do not share the deployment link or QR code publicly outside the venue[cite: 2, 3].

ECSAD Kiosk makes ordering breakfast and lunch for defense panelists fast and effortless[cite: 2, 3]. Built for mobile browsers with Next.js and Supabase, it lets panelists order directly from their phones while giving the ECSAD kitchen team a live board to prepare and serve meals[cite: 2, 3]. Simplicity and Speed are our two main drivers: zero sign-ups, zero passwords, and real-time order tracking[cite: 1, 2, 3].

* **Zero Friction for Panelists**
  We believe panelists shouldn't have to create an account just to get breakfast or lunch[cite: 2, 3]. Open the link or scan the venue QR code, enter your name, and submit your picks in seconds[cite: 2, 3].

* **Device-Bound Privacy**
  Your active orders stay tied to your phone's browser automatically—no passwords or personal emails required[cite: 2, 3]. Edit your order anytime while it is still being reviewed[cite: 2, 3].

* **Live Kitchen Board**
  Real-time updates via server-sent events let kitchen staff move orders across *Reviewing*, *Preparing*, and *Served* with a single tap[cite: 2, 3].

| Panelist Entry | Breakfast Menu | Lunch Menu | Live Status | Kitchen Board |
| :---: | :---: | :---: | :---: | :---: |
| ![1](docs/screenshots/screenshot1.png) | ![2](docs/screenshots/screenshot2.png) | ![3](docs/screenshots/screenshot3.png) | ![4](docs/screenshots/screenshot4.png) | ![5](docs/screenshots/screenshot5.png) |

## How It Works

ECSAD Kiosk runs on any modern mobile or desktop web browser with no installation required[cite: 2, 3].

### Panelist Flow

1. Open the event link or scan the QR code on your phone[cite: 2].
2. Enter your name[cite: 2].
3. Select your breakfast and lunch items[cite: 2].
4. Track your live order status (`Reviewing` → `Preparing` → `Served`) directly on your screen[cite: 2, 3].

### Kitchen Staff (`/kitchen`)

Kitchen staff share a single staff login at `/kitchen` across kitchen phones[cite: 2, 3].

* Orders appear in three columns: **Reviewing**, **Preparing**, and **Served**[cite: 2].
* Tap any order card to advance its status, or step it back if needed[cite: 2, 3].
* Moving an order back to **Reviewing** allows the panelist to edit their picks again[cite: 2, 3].

<div align="center">
  <img alt="Stack: Next.js" src="https://img.shields.io/badge/Frontend-Next.js-black">
  <img alt="Database: Supabase" src="https://img.shields.io/badge/Backend-Supabase%20Postgres-3ECF8E">
</div>

## Menu & Order Rules

Breakfast and lunch are submitted as two separate orders, each tracked with its own status[cite: 2, 3]. The menu is fixed for the event[cite: 2].

### Breakfast

| Category | Options | Rule |
| :--- | :--- | :--- |
| **Food** | Pandesal, Pancake, Scrambled Egg | One or more[cite: 2] |
| **Coffee** | Coffee Black, Coffee White, Coffee Mix, No Coffee | Exactly one[cite: 2] |
| **Drink** | Water, Orange Juice | Exactly one[cite: 2] |

### Lunch

| Category | Options | Rule |
| :--- | :--- | :--- |
| **Food** | Shanghai, Siomai Steamed, Buchi, Chicken | One or more[cite: 2] |
| **Fruit** | No Fruit, Apples, Grape, Orange | Exactly one[cite: 2] |
| **Rice** | Plain Rice, Chaopan Rice | Exactly one[cite: 2] |
| **Drink** | Coke, Royal, Water | Exactly one[cite: 2] |

## Deployment & Setup

> **Important:** All Supabase database access runs server-side through Next.js route handlers[cite: 3]. Never prefix your Supabase service-role key with `NEXT_PUBLIC_` or expose it to the client[cite: 2].

### Local Installation

1. Create a Supabase project and set up the `orders` and `order_items` tables[cite: 2].
2. Run `supabase/migrations/20261128000000_orders_storage.sql` in the Supabase SQL Editor to add order columns and atomic write functions[cite: 2].
3. Copy `.env.example` to `.env.local` and configure your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   KITCHEN_AUTH_SECRET=
   KITCHEN_STAFF_EMAIL=
   KITCHEN_STAFF_PASSCODE=
   ```[cite: 2, 3]
4. Install dependencies and start the development server:
   ```bash
   npm install
   npm run dev
   ```[cite: 2]

*(Note: Legacy `.data/orders.json` files are kept strictly as local archives and are not imported into Supabase[cite: 2].)*

## Security & Venue Integrity

ECSAD Kiosk prioritizes speed and ease of access during a live event[cite: 2, 3]. To prevent unauthorized or duplicate orders during the defense, keep these operational guidelines in mind[cite: 2, 3]:

- **Keep the URL Local:** Anyone with the link can submit orders—display the QR code only inside the venue[cite: 2].
- **Avoid Clearing Browser Data:** Panelist edit access relies on local browser storage/cookies; clearing site data removes edit permissions for submitted orders[cite: 2, 3].
- **No In-App Messaging or Cancellations:** There is no `Cancelled` status or chat feature; if an item runs out, kitchen staff will coordinate directly with the panelist[cite: 2, 3].

For architecture rules, settled design decisions, and implementation constraints, see [`CONTEXT.md`](CONTEXT.md)[cite: 2, 3].