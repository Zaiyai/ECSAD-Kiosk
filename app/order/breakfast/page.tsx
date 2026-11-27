import { Suspense, ViewTransition } from 'react';
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
      <ViewTransition
        enter={{
          'nav-forward': 'nav-forward',
          'nav-back': 'nav-back',
          default: 'none',
        }}
        exit={{
          'nav-forward': 'nav-forward',
          'nav-back': 'nav-back',
          default: 'none',
        }}
        default="none"
      >
        <BreakfastOrderClient />
      </ViewTransition>
    </Suspense>
  );
}
