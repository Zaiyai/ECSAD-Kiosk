import crypto from 'node:crypto';
import type {
  BreakfastSelection,
  KitchenMetrics,
  LunchSelection,
  MealType,
  OrderRecord,
  OrderStatus,
} from './types';
import { getSupabaseAdminClient } from './supabase-admin';

type OrderItemRow = {
  category: string;
  item_name: string;
};

type OrderRow = {
  id: string;
  panelist_name: string;
  device_token: string | null;
  meal: string;
  status: string;
  note: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItemRow[] | null;
};

type OrderItemInput = {
  category: string;
  item_name: string;
};

const ORDER_SELECT =
  'id,panelist_name,device_token,meal,status,note,created_at,updated_at,order_items(category,item_name)';

function parseOrderStatus(value: string): OrderStatus {
  switch (value.toLowerCase()) {
    case 'reviewing':
      return 'reviewing';
    case 'preparing':
      return 'preparing';
    case 'served':
      return 'served';
    case 'voided':
      return 'voided';
    default:
      throw new Error(`Unsupported order status "${value}".`);
  }
}

function mapOrderRow(row: OrderRow): OrderRecord {
  const meal = row.meal.toLowerCase();
  if (meal !== 'breakfast' && meal !== 'lunch') {
    throw new Error(`Unsupported meal value "${row.meal}" on order ${row.id}.`);
  }
  const status = parseOrderStatus(row.status);

  const items = row.order_items ?? [];
  const categoryItems = (category: string) =>
    items
      .filter((item) => item.category.toLowerCase() === category)
      .map((item) => item.item_name);
  const firstItem = (category: string) => categoryItems(category)[0];

  return {
    id: row.id,
    panelistName: row.panelist_name,
    deviceToken: row.device_token ?? '',
    meal,
    status,
    food: categoryItems('food'),
    coffee: firstItem('coffee'),
    fruit: categoryItems('fruit'),
    rice: firstItem('rice'),
    drink: firstItem('drink') ?? '',
    note: row.note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function orderItemsForSelection(
  selection: BreakfastSelection | LunchSelection
): OrderItemInput[] {
  const items: OrderItemInput[] = selection.food.map((item_name) => ({
    category: 'food',
    item_name,
  }));
  if ('coffee' in selection) {
    items.push({ category: 'coffee', item_name: selection.coffee });
    items.push({ category: 'drink', item_name: selection.drink });
  } else {
    items.push(
      ...selection.fruit.map((item_name) => ({ category: 'fruit', item_name }))
    );
    items.push({ category: 'rice', item_name: selection.rice });
    items.push({ category: 'drink', item_name: selection.drink });
  }
  return items;
}

function orderItemsForUpdate(params: {
  meal: MealType;
  food: string[];
  coffee?: string;
  fruit?: string[];
  rice?: string;
  drink: string;
}): OrderItemInput[] {
  const items: OrderItemInput[] = params.food.map((item_name) => ({
    category: 'food',
    item_name,
  }));
  if (params.meal === 'breakfast') {
    if (!params.coffee) {
      throw new Error('Breakfast updates require a coffee selection.');
    }
    items.push({ category: 'coffee', item_name: params.coffee });
  } else {
    if (!params.rice || !params.fruit?.length) {
      throw new Error('Lunch updates require fruit and a rice selection.');
    }
    items.push(
      ...params.fruit.map((item_name) => ({ category: 'fruit', item_name }))
    );
    items.push({ category: 'rice', item_name: params.rice });
  }
  items.push({ category: 'drink', item_name: params.drink });
  return items;
}

async function fetchOrders(
  column?: 'device_token' | 'panelist_name',
  value?: string
): Promise<OrderRecord[]> {
  const client = getSupabaseAdminClient();
  let query = client.from('orders').select(ORDER_SELECT).order('created_at', {
    ascending: false,
  });
  if (column === 'device_token' && value) {
    query = query.eq('device_token', value);
  } else if (column === 'panelist_name' && value) {
    query = query.ilike('panelist_name', value.replace(/[\\%_]/g, '\\$&'));
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load orders from Supabase: ${error.message}`);
  }
  return ((data ?? []) as unknown as OrderRow[]).map(mapOrderRow);
}

export async function getAllOrders(): Promise<OrderRecord[]> {
  return fetchOrders();
}

export async function getOrdersForPanelist(
  deviceToken?: string | null,
  panelistName?: string | null
): Promise<OrderRecord[]> {
  if (deviceToken) {
    const orders = await fetchOrders('device_token', deviceToken);
    if (orders.length > 0) return orders;
  }
  if (panelistName?.trim()) {
    return fetchOrders('panelist_name', panelistName.trim());
  }
  return [];
}

export function computeMetrics(orders: OrderRecord[]): KitchenMetrics {
  let reviewing = 0;
  let preparing = 0;
  let served = 0;
  let voided = 0;
  let breakfastCount = 0;
  let lunchCount = 0;

  for (const order of orders) {
    if (order.status === 'reviewing') reviewing++;
    else if (order.status === 'preparing') preparing++;
    else if (order.status === 'served') served++;
    else if (order.status === 'voided') voided++;

    if (order.meal === 'breakfast') breakfastCount++;
    else if (order.meal === 'lunch') lunchCount++;
  }

  return {
    totalActive: reviewing + preparing,
    reviewing,
    preparing,
    served,
    voided,
    allMeals: orders.length,
    breakfastCount,
    lunchCount,
  };
}

export async function createPanelistOrders(params: {
  panelistName: string;
  deviceToken: string;
  breakfast?: BreakfastSelection;
  lunch?: LunchSelection;
}): Promise<OrderRecord[]> {
  const now = new Date().toISOString();
  const panelistName = params.panelistName.trim();
  const deviceToken =
    params.deviceToken.trim() || crypto.randomBytes(2).toString('hex');
  const created: OrderRecord[] = [];

  if (params.breakfast) {
    created.push({
      id: crypto.randomUUID(),
      panelistName,
      deviceToken,
      meal: 'breakfast',
      status: 'reviewing',
      food: params.breakfast.food,
      coffee: params.breakfast.coffee,
      drink: params.breakfast.drink,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (params.lunch) {
    created.push({
      id: crypto.randomUUID(),
      panelistName,
      deviceToken,
      meal: 'lunch',
      status: 'reviewing',
      food: params.lunch.food,
      fruit: params.lunch.fruit,
      rice: params.lunch.rice,
      drink: params.lunch.drink,
      createdAt: now,
      updatedAt: now,
    });
  }

  const payload = created.map((order) => ({
    id: order.id,
    panelist_name: order.panelistName,
    device_token: order.deviceToken,
    meal: order.meal,
    status: order.status,
    note: order.note ?? null,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
    items: orderItemsForSelection(
      order.meal === 'breakfast'
        ? {
            food: order.food,
            coffee: order.coffee ?? '',
            drink: order.drink,
          }
        : {
            food: order.food,
            fruit: order.fruit ?? [],
            rice: order.rice ?? '',
            drink: order.drink,
          }
    ),
  }));

  const { error } = await getSupabaseAdminClient().rpc(
    'create_panelist_orders',
    { p_orders: payload }
  );
  if (error) {
    throw new Error(`Failed to create orders in Supabase: ${error.message}`);
  }
  return created;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<OrderRecord | null> {
  const client = getSupabaseAdminClient();
  const { data, error } = await client
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select(ORDER_SELECT)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update order status in Supabase: ${error.message}`);
  }
  return data ? mapOrderRow(data as unknown as OrderRow) : null;
}

export async function updatePanelistOrderSelections(params: {
  orderId: string;
  deviceToken: string;
  meal: MealType;
  food: string[];
  coffee?: string;
  fruit?: string[];
  rice?: string;
  drink: string;
}): Promise<{ order?: OrderRecord; error?: string; statusCode?: number }> {
  const items = orderItemsForUpdate(params);
  const { data, error } = await getSupabaseAdminClient().rpc(
    'update_panelist_order_items',
    {
      p_order_id: params.orderId,
      p_device_token: params.deviceToken,
      p_meal: params.meal,
      p_items: items,
    }
  );
  if (error) {
    throw new Error(`Failed to update order items in Supabase: ${error.message}`);
  }

  if (data === 'not_found') {
    return { error: 'Order not found.', statusCode: 404 };
  }
  if (data === 'forbidden') {
    return {
      error: 'You do not have permission to edit this order.',
      statusCode: 403,
    };
  }
  if (data === 'locked') {
    return {
      error: 'Kitchen has started — editing is locked for this order.',
      statusCode: 409,
    };
  }
  if (data === 'meal_mismatch') {
    return { error: 'The selected meal does not match this order.', statusCode: 400 };
  }
  if (data !== 'ok') {
    throw new Error('Supabase returned an unexpected order update result.');
  }

  const orders = await fetchOrders();
  const updated = orders.find((order) => order.id === params.orderId);
  if (!updated) {
    throw new Error('Updated order was not found after saving to Supabase.');
  }
  return { order: updated };
}
