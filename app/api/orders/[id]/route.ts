import { NextRequest, NextResponse } from 'next/server';
import { isKitchenAuthenticated } from '@/lib/auth';
import {
  updateOrderStatus,
  updatePanelistOrderSelections,
} from '@/lib/orders-store';
import type { MealType, OrderStatus } from '@/lib/types';

const VALID_STATUSES: OrderStatus[] = [
  'reviewing',
  'preparing',
  'served',
  'voided',
];

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await req.json()) as {
      status?: OrderStatus;
      deviceToken?: string;
      meal?: MealType;
      food?: string[];
      coffee?: string;
      fruit?: string[];
      rice?: string;
      drink?: string;
    };

    // Kitchen staff status transition
    if (body.status !== undefined) {
      const authed = await isKitchenAuthenticated();
      if (!authed) {
        return NextResponse.json(
          { error: 'Kitchen staff authentication required.' },
          { status: 401 }
        );
      }

      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid order status.' },
          { status: 400 }
        );
      }

      const updated = updateOrderStatus(id, body.status);
      if (!updated) {
        return NextResponse.json(
          { error: 'Order not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json({ order: updated });
    }

    // Panelist editing order while still in Reviewing state
    if (!body.deviceToken || !body.meal || !Array.isArray(body.food) || !body.drink) {
      return NextResponse.json(
        { error: 'Incomplete update payload.' },
        { status: 400 }
      );
    }

    if (body.food.length === 0) {
      return NextResponse.json(
        { error: 'Select at least 1 food item.' },
        { status: 400 }
      );
    }

    if (body.meal === 'breakfast' && !body.coffee) {
      return NextResponse.json(
        { error: 'Please select a coffee option.' },
        { status: 400 }
      );
    }

    if (
      body.meal === 'lunch' &&
      (!Array.isArray(body.fruit) || body.fruit.length === 0 || !body.rice)
    ) {
      return NextResponse.json(
        { error: 'Please select at least 1 fruit and a rice option.' },
        { status: 400 }
      );
    }

    const result = updatePanelistOrderSelections({
      orderId: id,
      deviceToken: body.deviceToken,
      meal: body.meal,
      food: body.food,
      coffee: body.coffee,
      fruit: body.fruit,
      rice: body.rice,
      drink: body.drink,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json({ order: result.order });
  } catch {
    return NextResponse.json(
      { error: 'Unable to process update.' },
      { status: 400 }
    );
  }
}
