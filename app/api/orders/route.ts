import { NextRequest, NextResponse } from 'next/server';
import { isKitchenAuthenticated } from '@/lib/auth';
import {
  computeMetrics,
  createPanelistOrders,
  getAllOrders,
  getOrdersForPanelist,
} from '@/lib/orders-store';
import type { BreakfastSelection, LunchSelection } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get('scope');
  const deviceToken = searchParams.get('deviceToken');
  const panelistName = searchParams.get('panelistName');

  if (scope === 'kitchen') {
    const authed = await isKitchenAuthenticated();
    if (!authed) {
      return NextResponse.json(
        { error: 'Kitchen staff authentication required.' },
        { status: 401 }
      );
    }
    try {
      const orders = await getAllOrders();
      return NextResponse.json({
        orders,
        metrics: computeMetrics(orders),
      });
    } catch (error) {
      console.error('Failed to fetch kitchen orders.', error);
      return NextResponse.json(
        { error: 'Unable to load orders from the database.' },
        { status: 500 }
      );
    }
  }

  if (!deviceToken && !panelistName) {
    return NextResponse.json(
      { error: 'Missing deviceToken or panelistName.' },
      { status: 400 }
    );
  }

  try {
    const orders = await getOrdersForPanelist(deviceToken, panelistName);
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Failed to fetch panelist orders.', error);
    return NextResponse.json(
      { error: 'Unable to load orders from the database.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let body: {
    panelistName?: string;
    deviceToken?: string;
    breakfast?: BreakfastSelection;
    lunch?: LunchSelection;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: 'Invalid order payload.' },
      { status: 400 }
    );
  }

  const panelistName = body.panelistName?.trim();
  const deviceToken = body.deviceToken?.trim();

  if (!panelistName) {
    return NextResponse.json(
      { error: 'Please enter your name so the kitchen knows who to serve.' },
      { status: 400 }
    );
  }

  if (!deviceToken) {
    return NextResponse.json(
      { error: 'Missing device token.' },
      { status: 400 }
    );
  }

  if (!body.breakfast && !body.lunch) {
    return NextResponse.json(
      { error: 'At least one meal order (breakfast or lunch) is required.' },
      { status: 400 }
    );
  }

  if (body.breakfast) {
    if (
      !Array.isArray(body.breakfast.food) ||
      body.breakfast.food.length === 0 ||
      !body.breakfast.coffee ||
      !body.breakfast.drink
    ) {
      return NextResponse.json(
        { error: 'Incomplete breakfast selections.' },
        { status: 400 }
      );
    }
  }

  if (body.lunch) {
    if (
      !Array.isArray(body.lunch.food) ||
      body.lunch.food.length === 0 ||
      !Array.isArray(body.lunch.fruit) ||
      !body.lunch.rice ||
      !body.lunch.drink
    ) {
      return NextResponse.json(
        { error: 'Incomplete lunch selections.' },
        { status: 400 }
      );
    }
  }

  try {
    const created = await createPanelistOrders({
      panelistName,
      deviceToken,
      breakfast: body.breakfast,
      lunch: body.lunch,
    });
    return NextResponse.json({ orders: created }, { status: 201 });
  } catch (error) {
    console.error('Failed to create panelist orders.', error);
    return NextResponse.json(
      { error: 'Unable to save the order to the database.' },
      { status: 500 }
    );
  }
}
