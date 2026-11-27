import { Suspense } from 'react';
import BreakfastOrderClient from '@/components/BreakfastOrderClient';

export default function BreakfastOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] bg-surface flex items-center justify-center p-6 text-on-surface-variant text-sm">
          Loading breakfast menu...
        </div>
      }
    >
      <BreakfastOrderClient />
    </Suspense>
  );
}
