import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { isKitchenAuthenticated } from '@/lib/auth';
import { computeMetrics, getAllOrders } from '@/lib/orders-store';
import KitchenBoardClient from '@/components/KitchenBoardClient';

export default function KitchenBoardPage() {
  return (
    <Suspense fallback={null}>
      <KitchenBoardContent />
    </Suspense>
  );
}

async function KitchenBoardContent() {
  const authed = await isKitchenAuthenticated();
  if (!authed) {
    redirect('/kitchen/login');
  }

  const orders = getAllOrders();
  const metrics = computeMetrics(orders);

  return (
    <KitchenBoardClient initialOrders={orders} initialMetrics={metrics} />
  );
}
