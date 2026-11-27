import { NextRequest, NextResponse } from 'next/server';
import { isKitchenAuthenticated } from '@/lib/auth';
import {
  computeMetrics,
  getAllOrders,
  getOrdersForPanelist,
  subscribeToOrders,
} from '@/lib/orders-store';
import type { OrderRecord } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get('scope');
  const deviceToken = searchParams.get('deviceToken');
  const panelistName = searchParams.get('panelistName');

  if (scope === 'kitchen') {
    const authed = await isKitchenAuthenticated();
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else if (!deviceToken && !panelistName) {
    return NextResponse.json(
      { error: 'Missing deviceToken or panelistName' },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const sendSnapshot = (allOrders: OrderRecord[]) => {
        if (scope === 'kitchen') {
          const payload = JSON.stringify({
            orders: allOrders,
            metrics: computeMetrics(allOrders),
          });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } else {
          const filtered = getOrdersForPanelist(deviceToken, panelistName);
          const payload = JSON.stringify({ orders: filtered });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        }
      };

      sendSnapshot(getAllOrders());

      const unsubscribe = subscribeToOrders((orders) => {
        try {
          sendSnapshot(orders);
        } catch {
          unsubscribe();
        }
      });

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 25000);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Stream already closed
        }
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
