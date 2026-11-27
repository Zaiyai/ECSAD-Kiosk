import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { isKitchenAuthenticated } from '@/lib/auth';
import KitchenLoginClient from '@/components/KitchenLoginClient';

export default function KitchenLoginPage() {
  return (
    <Suspense fallback={null}>
      <KitchenLoginContent />
    </Suspense>
  );
}

async function KitchenLoginContent() {
  const authed = await isKitchenAuthenticated();
  if (authed) {
    redirect('/kitchen');
  }
  return <KitchenLoginClient />;
}
