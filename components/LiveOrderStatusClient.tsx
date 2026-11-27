'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  ChevronLeft,
  Flame,
  Lock,
  Pencil,
  Plus,
  ReceiptText,
  X,
} from 'lucide-react';
import {
  ECSAD_LOGO_SRC,
  STATUS_LABELS,
  STATUS_PREVIEW_IMAGES,
} from '@/lib/menu-data';
import {
  getOrCreateDeviceToken,
  getSavedPanelistName,
} from '@/lib/kiosk-client';
import type { OrderRecord } from '@/lib/types';
import SafeFoodImage from './SafeFoodImage';

export default function LiveOrderStatusClient() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelistName, setPanelistName] = useState('');
  const [deviceToken, setDeviceToken] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchOrders = useCallback(async (token: string, name: string) => {
    try {
      const qs = new URLSearchParams();
      if (token) qs.set('deviceToken', token);
      if (name) qs.set('panelistName', name);
      const res = await fetch(`/api/orders?${qs.toString()}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = (await res.json()) as { orders: OrderRecord[] };
        setOrders(data.orders || []);
      }
    } catch {
      // Keep existing state on transient error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const token = getOrCreateDeviceToken();
    const name = getSavedPanelistName();

    async function init() {
      await Promise.resolve();
      if (!active) return;
      setDeviceToken(token);
      setPanelistName(name);
      await fetchOrders(token, name);
    }
    void init();

    const qs = new URLSearchParams();
    if (token) qs.set('deviceToken', token);
    if (name) qs.set('panelistName', name);

    const es = new EventSource(`/api/orders/stream?${qs.toString()}`);
    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { orders?: OrderRecord[] };
        if (Array.isArray(payload.orders)) {
          setOrders(payload.orders);
          setLoading(false);
        }
      } catch {
        // Ignore malformed SSE event
      }
    };

    return () => {
      active = false;
      es.close();
    };
  }, [fetchOrders]);

  function handleEditOrder(order: OrderRecord) {
    setToastMsg(
      `Opening ${order.meal === 'breakfast' ? 'Breakfast' : 'Lunch'} Order customization…`
    );
    const route =
      order.meal === 'breakfast'
        ? `/order/breakfast?edit=${encodeURIComponent(order.id)}`
        : `/order/lunch?edit=${encodeURIComponent(order.id)}`;
    router.push(route);
  }

  function formatOrderSummary(order: OrderRecord): string {
    if (order.meal === 'breakfast') {
      return [order.food.join(', '), order.coffee, order.drink]
        .filter(Boolean)
        .join(' · ');
    }
    return [
      order.food.join(', '),
      order.fruit?.join(', '),
      order.rice,
      order.drink,
    ]
      .filter(Boolean)
      .join(' · ');
  }

  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-[100dvh]">
      {/* Fixed Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(112,41,226,0.06)] pt-safe">
        <div className="max-w-4xl mx-auto h-16 px-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <button
              type="button"
              aria-label="Back to home"
              onClick={() => router.push('/')}
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-[18px] leading-[24px] font-semibold text-on-surface truncate">
                Live Order Status
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="font-label text-[11px] leading-[14px] font-semibold tracking-wider text-on-surface-variant uppercase whitespace-nowrap">
              ECSAD KIOSK
            </span>
            <Image
              src={ECSAD_LOGO_SRC}
              alt="ECSAD Logo"
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover border border-outline-variant/40 shrink-0"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col relative w-full max-w-4xl mx-auto px-4 pt-20 pb-10 flex-1">
        {/* Panelist Identity Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-outline-variant/30">
          <div className="flex flex-col min-w-0">
            <span className="text-[16px] font-bold text-on-surface truncate">
              {panelistName || 'Panelist Orders'}
            </span>
            <span className="font-label text-[12px] text-on-surface-variant tabular-nums">
              Device Token #{deviceToken || '----'} · Live Sync Active
            </span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary-container text-on-secondary-fixed font-label text-[12px] font-bold hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Order</span>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-64 rounded-xl bg-surface-container animate-pulse" />
            <div className="h-64 rounded-xl bg-surface-container animate-pulse" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-8 text-center flex flex-col items-center gap-3 shadow-sm">
            <ReceiptText className="w-10 h-10 text-primary" />
            <h2 className="text-[18px] font-bold text-on-surface">
              No active orders on this device
            </h2>
            <p className="text-[14px] text-on-surface-variant max-w-sm">
              Enter your name and choose your breakfast and lunch meals to track
              them live here.
            </p>
            <Link
              href="/"
              className="mt-2 min-h-[44px] px-6 py-2.5 rounded-full bg-primary text-on-primary font-label text-[14px] font-bold inline-flex items-center gap-2 shadow-md shadow-primary/20"
            >
              <span>Start Ordering</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order) => {
              const isBreakfast = order.meal === 'breakfast';
              const isReviewing = order.status === 'reviewing';
              const isPreparing = order.status === 'preparing';
              const isServed = order.status === 'served';

              return (
                <article
                  key={order.id}
                  className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-sm flex flex-col gap-4"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <SafeFoodImage
                        src={
                          isBreakfast
                            ? STATUS_PREVIEW_IMAGES.breakfast
                            : STATUS_PREVIEW_IMAGES.lunch
                        }
                        alt={
                          isBreakfast
                            ? 'Breakfast plate preview'
                            : 'Lunch bento preview'
                        }
                        size={56}
                        className="w-14 h-14 rounded-lg"
                      />
                      <div className="flex flex-col min-w-0">
                        <h2 className="text-[18px] leading-[24px] font-semibold text-on-surface truncate">
                          {isBreakfast ? 'Breakfast Order' : 'Lunch Order'}
                        </h2>
                        <span className="text-[12px] leading-4 text-on-surface-variant">
                          {isBreakfast
                            ? 'Session 1 · Breakfast'
                            : 'Session 2 · Lunch'}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label text-[11px] leading-[14px] font-semibold shrink-0 whitespace-nowrap ${
                        isPreparing
                          ? 'bg-primary-fixed text-on-primary-fixed-variant'
                          : isServed
                          ? 'bg-surface-container-high text-on-surface'
                          : 'bg-secondary-container text-primary'
                      }`}
                    >
                      {isReviewing && <ReceiptText className="w-3.5 h-3.5" />}
                      {isPreparing && <Flame className="w-3.5 h-3.5" />}
                      {isServed && <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{STATUS_LABELS[order.status]}</span>
                    </span>
                  </div>

                  {/* 3-Step Progress Bar */}
                  <div className="flex flex-col gap-1.5">
                    <div className="grid grid-cols-3 gap-1.5 items-center">
                      <div
                        className={`h-1.5 rounded-full relative overflow-hidden ${
                          isReviewing || isPreparing || isServed
                            ? 'bg-primary'
                            : 'bg-surface-container-high'
                        }`}
                      >
                        {isReviewing && (
                          <div className="absolute inset-0 bg-primary-fixed-dim/50 animate-pulse" />
                        )}
                      </div>
                      <div
                        className={`h-1.5 rounded-full relative overflow-hidden ${
                          isPreparing || isServed
                            ? 'bg-primary'
                            : 'bg-surface-container-high'
                        }`}
                      >
                        {isPreparing && (
                          <div className="absolute inset-0 bg-primary-fixed-dim/50 animate-pulse" />
                        )}
                      </div>
                      <div
                        className={`h-1.5 rounded-full ${
                          isServed ? 'bg-primary' : 'bg-surface-container-high'
                        }`}
                      />
                    </div>
                    <div className="grid grid-cols-3 text-center pt-0.5">
                      <span
                        className={`font-label text-[11px] leading-[14px] text-left ${
                          isReviewing
                            ? 'text-primary font-bold'
                            : 'text-on-surface-variant'
                        }`}
                      >
                        Reviewing
                      </span>
                      <span
                        className={`font-label text-[11px] leading-[14px] ${
                          isPreparing
                            ? 'text-primary font-bold'
                            : isServed
                            ? 'text-on-surface-variant'
                            : 'text-outline'
                        }`}
                      >
                        Preparing
                      </span>
                      <span
                        className={`font-label text-[11px] leading-[14px] text-right ${
                          isServed
                            ? 'text-primary font-bold'
                            : 'text-outline'
                        }`}
                      >
                        Served
                      </span>
                    </div>
                  </div>

                  {/* Your Picks Summary */}
                  <div className="bg-surface-container-low border border-outline-variant/30 rounded-lg p-3 flex flex-col gap-1 flex-1">
                    <span className="font-label text-[11px] leading-[14px] text-primary font-semibold uppercase tracking-wider">
                      Your Picks
                    </span>
                    <p className="text-[14px] leading-[20px] text-on-surface">
                      {formatOrderSummary(order)}
                    </p>
                  </div>

                  {/* Action or Lock Footer */}
                  {isReviewing ? (
                    <button
                      type="button"
                      onClick={() => handleEditOrder(order)}
                      className="w-full min-h-[48px] rounded-full bg-primary-fixed/50 border border-primary/30 text-primary font-label text-[15px] leading-[20px] font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] hover:bg-primary-fixed transition-all"
                    >
                      <Pencil className="w-4 h-4 text-primary" />
                      <span>Edit Order</span>
                    </button>
                  ) : isPreparing ? (
                    <div className="flex items-center gap-1.5 text-on-surface-variant pt-0.5 min-h-[36px]">
                      <Lock className="w-4 h-4 text-outline shrink-0" />
                      <span className="text-[12px] leading-4 text-on-surface-variant">
                        Kitchen has started — editing locked
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-primary pt-0.5 min-h-[36px]">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span className="text-[12px] leading-4 font-semibold">
                        Served — enjoy your meal
                      </span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* Toast feedback */}
        {toastMsg && (
          <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto z-50 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-lg flex items-center justify-between gap-2">
            <span className="text-[14px]">{toastMsg}</span>
            <button
              type="button"
              onClick={() => setToastMsg(null)}
              className="text-inverse-primary p-1"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
