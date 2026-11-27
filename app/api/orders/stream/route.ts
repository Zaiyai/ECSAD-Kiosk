import { NextRequest, NextResponse } from 'next/server';
import { isKitchenAuthenticated } from '@/lib/auth';
import {
  computeMetrics,
  getAllOrders,
  getOrdersForPanelist,
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

  const getSnapshotOrders = () =>
    scope === 'kitchen'
      ? getAllOrders()
      : getOrdersForPanelist(deviceToken, panelistName);

  let initialOrders: OrderRecord[];
  try {
    initialOrders = await getSnapshotOrders();
  } catch (error) {
    console.error('Failed to start order updates stream.', error);
    return NextResponse.json(
      { error: 'Unable to load orders from the database.' },
      { status: 500 }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      let polling = false;
      let previousPayload = '';

      const sendSnapshot = (orders: OrderRecord[]) => {
        const snapshot =
          scope === 'kitchen'
            ? { orders, metrics: computeMetrics(orders) }
            : { orders };
        const payload = JSON.stringify(snapshot);
        if (payload === previousPayload) return;
        previousPayload = payload;
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };

      const poll = async () => {
        if (closed || polling) return;
        polling = true;
        try {
          sendSnapshot(await getSnapshotOrders());
        } catch (error) {
          console.error('Failed to refresh order updates stream.', error);
        } finally {
          polling = false;
        }
      };

      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(pollingInterval);
        clearInterval(heartbeatInterval);
        try {
          controller.close();
        } catch {
          // The client may have already closed the stream.
        }
      };

      sendSnapshot(initialOrders);
      const pollingInterval = setInterval(() => {
        void poll();
      }, 5000);
      const heartbeatInterval = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          close();
        }
      }, 25000);

      req.signal.addEventListener('abort', close, { once: true });
      if (req.signal.aborted) close();
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
