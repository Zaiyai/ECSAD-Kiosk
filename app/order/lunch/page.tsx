import { Suspense } from 'react';
import LunchOrderClient from '@/components/LunchOrderClient';

export default function LunchOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] bg-surface flex items-center justify-center p-6 text-on-surface-variant text-sm">
          Loading lunch menu...
        </div>
      }
    >
      <LunchOrderClient />
    </Suspense>
  );
}
