import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  BreakfastSelection,
  KitchenMetrics,
  LunchSelection,
  MealType,
  OrderRecord,
  OrderStatus,
} from './types';

type OrdersSubscriber = (orders: OrderRecord[]) => void;

interface GlobalStoreState {
  orders: OrderRecord[] | null;
  subscribers: Set<OrdersSubscriber>;
}

const globalForStore = globalThis as unknown as {
  __ecsadOrdersStore?: GlobalStoreState;
};

const storeState: GlobalStoreState =
  globalForStore.__ecsadOrdersStore ?? {
    orders: null,
    subscribers: new Set<OrdersSubscriber>(),
  };

globalForStore.__ecsadOrdersStore = storeState;

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'orders.json');

function createInitialSeedOrders(): OrderRecord[] {
  const now = Date.now();
  return [
    {
      id: 'ord-santos-bf-1',
      panelistName: 'Dr. Maria Santos',
      deviceToken: '4b2a',
      meal: 'breakfast',
      status: 'preparing',
      food: ['Pandesal', 'Scrambled Egg'],
      coffee: 'Coffee Black',
      drink: 'Water',
      createdAt: new Date(now - 8 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 4 * 60 * 1000).toISOString(),
    },
    {
      id: 'ord-santos-bf-2',
      panelistName: 'Dr. Maria Santos',
      deviceToken: '9c1f',
      meal: 'breakfast',
      status: 'reviewing',
      food: ['Pancake'],
      coffee: 'Coffee White',
      drink: 'Orange Juice',
      createdAt: new Date(now - 5 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 'ord-reyes-bf-1',
      panelistName: 'Prof. Alan Reyes',
      deviceToken: '7e3d',
      meal: 'breakfast',
      status: 'reviewing',
      food: ['Pancake'],
      coffee: 'Coffee White',
      drink: 'Orange Juice',
      createdAt: new Date(now - 2 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 2 * 60 * 1000).toISOString(),
    },
    {
      id: 'ord-cruz-ln-1',
      panelistName: 'Dean Angela Cruz',
      deviceToken: '2a8c',
      meal: 'lunch',
      status: 'reviewing',
      food: ['Shanghai', 'Buchi', 'Chicken'],
      fruit: ['Apples'],
      rice: 'Chaopan Rice',
      drink: 'Coke',
      createdAt: new Date(now - 35 * 1000).toISOString(),
      updatedAt: new Date(now - 35 * 1000).toISOString(),
    },
    {
      id: 'ord-diaz-ln-1',
      panelistName: 'Engr. Roberto Diaz',
      deviceToken: '5f1b',
      meal: 'lunch',
      status: 'preparing',
      food: ['Siomai Steamed', 'Chicken'],
      fruit: ['Orange'],
      rice: 'Plain Rice',
      drink: 'Royal',
      note: 'Hot Prep',
      createdAt: new Date(now - 14 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 6 * 60 * 1000).toISOString(),
    },
    {
      id: 'ord-diaz-bf-1',
      panelistName: 'Engr. Roberto Diaz',
      deviceToken: '5f1b',
      meal: 'breakfast',
      status: 'served',
      food: ['Pandesal'],
      coffee: 'Coffee Mix',
      drink: 'Water',
      note: 'Table 2',
      createdAt: new Date(now - 38 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 18 * 60 * 1000).toISOString(),
    },
  ];
}

function persistOrders(orders: OrderRecord[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2), 'utf8');
  } catch {
    // Fallback gracefully to in-memory store if filesystem is read-only
  }
}

function loadOrders(): OrderRecord[] {
  if (storeState.orders) {
    return storeState.orders;
  }

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw) as OrderRecord[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        storeState.orders = parsed;
        return storeState.orders;
      }
    }
  } catch {
    // Ignore parse errors and re-seed
  }

  const seeded = createInitialSeedOrders();
  storeState.orders = seeded;
  persistOrders(seeded);
  return storeState.orders;
}

function broadcastUpdate() {
  const current = getAllOrders();
  for (const subscriber of storeState.subscribers) {
    try {
      subscriber(current);
    } catch {
      storeState.subscribers.delete(subscriber);
    }
  }
}

export function subscribeToOrders(subscriber: OrdersSubscriber): () => void {
  storeState.subscribers.add(subscriber);
  return () => {
    storeState.subscribers.delete(subscriber);
  };
}

export function getAllOrders(): OrderRecord[] {
  const orders = loadOrders();
  return [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getOrdersForPanelist(
  deviceToken?: string | null,
  panelistName?: string | null
): OrderRecord[] {
  const all = getAllOrders();
  if (deviceToken) {
    const byToken = all.filter((o) => o.deviceToken === deviceToken);
    if (byToken.length > 0) return byToken;
  }
  if (panelistName) {
    const normalized = panelistName.trim().toLowerCase();
    return all.filter(
      (o) => o.panelistName.trim().toLowerCase() === normalized
    );
  }
  return [];
}

export function computeMetrics(orders: OrderRecord[]): KitchenMetrics {
  let reviewing = 0;
  let preparing = 0;
  let served = 0;
  let breakfastCount = 0;
  let lunchCount = 0;

  for (const order of orders) {
    if (order.status === 'reviewing') reviewing++;
    else if (order.status === 'preparing') preparing++;
    else if (order.status === 'served') served++;

    if (order.meal === 'breakfast') breakfastCount++;
    else if (order.meal === 'lunch') lunchCount++;
  }

  return {
    totalActive: reviewing + preparing,
    reviewing,
    preparing,
    served,
    allMeals: orders.length,
    breakfastCount,
    lunchCount,
  };
}

export function createPanelistOrders(params: {
  panelistName: string;
  deviceToken: string;
  breakfast?: BreakfastSelection;
  lunch?: LunchSelection;
}): OrderRecord[] {
  const orders = loadOrders();
  const nowIso = new Date().toISOString();
  const cleanName = params.panelistName.trim();
  const cleanToken = params.deviceToken.trim() || crypto.randomBytes(2).toString('hex');

  const created: OrderRecord[] = [];

  if (params.breakfast) {
    const bfOrder: OrderRecord = {
      id: `ord-${crypto.randomUUID().slice(0, 8)}`,
      panelistName: cleanName,
      deviceToken: cleanToken,
      meal: 'breakfast',
      status: 'reviewing',
      food: params.breakfast.food,
      coffee: params.breakfast.coffee,
      drink: params.breakfast.drink,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    orders.unshift(bfOrder);
    created.push(bfOrder);
  }

  if (params.lunch) {
    const lunchOrder: OrderRecord = {
      id: `ord-${crypto.randomUUID().slice(0, 8)}`,
      panelistName: cleanName,
      deviceToken: cleanToken,
      meal: 'lunch',
      status: 'reviewing',
      food: params.lunch.food,
      fruit: params.lunch.fruit,
      rice: params.lunch.rice,
      drink: params.lunch.drink,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    orders.unshift(lunchOrder);
    created.push(lunchOrder);
  }

  storeState.orders = orders;
  persistOrders(orders);
  broadcastUpdate();

  return created;
}

export function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): OrderRecord | null {
  const orders = loadOrders();
  const index = orders.findIndex((o) => o.id === orderId);
  if (index === -1) return null;

  const updated: OrderRecord = {
    ...orders[index],
    status,
    updatedAt: new Date().toISOString(),
  };
  orders[index] = updated;
  storeState.orders = orders;
  persistOrders(orders);
  broadcastUpdate();
  return updated;
}

export function updatePanelistOrderSelections(params: {
  orderId: string;
  deviceToken: string;
  meal: MealType;
  food: string[];
  coffee?: string;
  fruit?: string[];
  rice?: string;
  drink: string;
}): { order?: OrderRecord; error?: string; statusCode?: number } {
  const orders = loadOrders();
  const index = orders.findIndex((o) => o.id === params.orderId);
  if (index === -1) {
    return { error: 'Order not found.', statusCode: 404 };
  }

  const existing = orders[index];
  if (existing.deviceToken !== params.deviceToken) {
    return { error: 'You do not have permission to edit this order.', statusCode: 403 };
  }

  if (existing.status !== 'reviewing') {
    return {
      error: 'Kitchen has started — editing is locked for this order.',
      statusCode: 409,
    };
  }

  const updated: OrderRecord = {
    ...existing,
    food: params.food,
    coffee: params.meal === 'breakfast' ? params.coffee : existing.coffee,
    fruit: params.meal === 'lunch' ? params.fruit : existing.fruit,
    rice: params.meal === 'lunch' ? params.rice : existing.rice,
    drink: params.drink,
    updatedAt: new Date().toISOString(),
  };

  orders[index] = updated;
  storeState.orders = orders;
  persistOrders(orders);
  broadcastUpdate();

  return { order: updated };
}
