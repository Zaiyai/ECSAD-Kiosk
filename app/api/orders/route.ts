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
    const orders = getAllOrders();
    return NextResponse.json({
      orders,
      metrics: computeMetrics(orders),
    });
  }

  if (!deviceToken && !panelistName) {
    return NextResponse.json(
      { error: 'Missing deviceToken or panelistName.' },
      { status: 400 }
    );
  }

  const orders = getOrdersForPanelist(deviceToken, panelistName);
  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      panelistName?: string;
      deviceToken?: string;
      breakfast?: BreakfastSelection;
      lunch?: LunchSelection;
    };

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
        body.lunch.fruit.length === 0 ||
        !body.lunch.rice ||
        !body.lunch.drink
      ) {
        return NextResponse.json(
          { error: 'Incomplete lunch selections.' },
          { status: 400 }
        );
      }
    }

    const created = createPanelistOrders({
      panelistName,
      deviceToken,
      breakfast: body.breakfast,
      lunch: body.lunch,
    });

    return NextResponse.json({ orders: created }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Invalid order payload.' },
      { status: 400 }
    );
  }
}
