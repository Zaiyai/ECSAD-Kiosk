'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Apple,
  Check,
  CheckCircle2,
  Clock,
  Coffee,
  CookingPot,
  Flame,
  GlassWater,
  ListFilter,
  LogOut,
  RefreshCw,
  Search,
  Undo2,
  User,
  Utensils,
  UtensilsCrossed,
  X,
  Zap,
} from 'lucide-react';
import { formatRelativeTime, STATUS_LABELS } from '@/lib/menu-data';
import type {
  KitchenMetrics,
  MealType,
  OrderRecord,
  OrderStatus,
} from '@/lib/types';

interface KitchenBoardClientProps {
  initialOrders: OrderRecord[];
  initialMetrics: KitchenMetrics;
}

type MealFilter = 'all' | MealType;
type StatusFilter = 'all' | OrderStatus;

export default function KitchenBoardClient({
  initialOrders,
  initialMetrics,
}: KitchenBoardClientProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRecord[]>(initialOrders);
  const [metrics, setMetrics] = useState<KitchenMetrics>(initialMetrics);
  const [mealFilter, setMealFilter] = useState<MealFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const orderDialogRef = useRef<HTMLDialogElement>(null);
  const selectedOrder = orders.find((order) => order.id === selectedOrderId);

  // Real-time SSE connection
  useEffect(() => {
    const es = new EventSource('/api/orders/stream?scope=kitchen');
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          orders?: OrderRecord[];
          metrics?: KitchenMetrics;
        };
        if (Array.isArray(data.orders) && data.metrics) {
          setOrders(data.orders);
          setMetrics(data.metrics);
        }
      } catch {
        // Ignore malformed frame
      }
    };

    const tick = setInterval(() => {
      setNowMs(Date.now());
    }, 30000);

    return () => {
      es.close();
      clearInterval(tick);
    };
  }, []);

  useEffect(() => {
    const dialog = orderDialogRef.current;
    if (selectedOrder && dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [selectedOrder]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch('/api/orders?scope=kitchen', {
        cache: 'no-store',
      });
      if (res.status === 401) {
        router.push('/kitchen/login');
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as {
          orders: OrderRecord[];
          metrics: KitchenMetrics;
        };
        setOrders(data.orders);
        setMetrics(data.metrics);
        setNowMs(Date.now());
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/kitchen/logout', { method: 'POST' });
    router.push('/kitchen/login');
    router.refresh();
  }

  async function moveOrder(orderId: string, targetStatus: OrderStatus) {
    if (
      targetStatus === 'voided' &&
      !window.confirm('Void this order? This action cannot be undone.')
    ) {
      return;
    }

    setActionError(null);
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (res.status === 401) {
        router.push('/kitchen/login');
        return;
      }

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setActionError(data.error || 'Unable to update this order.');
        return;
      }

      // Optimistically reflect immediately while SSE confirms
      setOrders((prev) => {
        const next = prev.map((o) =>
          o.id === orderId
            ? { ...o, status: targetStatus, updatedAt: new Date().toISOString() }
            : o
        );
        let reviewing = 0;
        let preparing = 0;
        let served = 0;
        let voided = 0;
        let breakfastCount = 0;
        let lunchCount = 0;
        for (const o of next) {
          if (o.status === 'reviewing') reviewing++;
          else if (o.status === 'preparing') preparing++;
          else if (o.status === 'served') served++;
          else if (o.status === 'voided') voided++;
          if (o.meal === 'breakfast') breakfastCount++;
          else lunchCount++;
        }
        setMetrics({
          totalActive: reviewing + preparing,
          reviewing,
          preparing,
          served,
          voided,
          allMeals: next.length,
          breakfastCount,
          lunchCount,
        });
        return next;
      });
    } catch {
      setActionError('Unable to update this order. Check your connection and try again.');
    } finally {
      setUpdatingId(null);
    }
  }

  // Detect duplicate panelist names across distinct deviceTokens for the same meal
  const duplicateMap = useMemo(() => {
    const groups = new Map<string, Set<string>>();
    for (const order of orders) {
      if (order.status === 'served' || order.status === 'voided') continue;
      const key = `${order.meal}::${order.panelistName.trim().toLowerCase()}`;
      if (!groups.has(key)) groups.set(key, new Set());
      groups.get(key)!.add(order.deviceToken);
    }
    return groups;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (mealFilter !== 'all' && order.meal !== mealFilter) return false;
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (q) {
        const matchesName = order.panelistName.toLowerCase().includes(q);
        const matchesFood = order.food.some((f) => f.toLowerCase().includes(q));
        const matchesToken = order.deviceToken.toLowerCase().includes(q);
        if (!matchesName && !matchesFood && !matchesToken) return false;
      }
      return true;
    });
  }, [orders, mealFilter, statusFilter, searchQuery]);

  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-[100dvh]">
      {/* Fixed Header */}
      <header className="fixed top-0 w-full z-50 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
        <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <h1 className="text-[18px] leading-[24px] font-semibold text-on-surface tracking-tight truncate">
              Kitchen Order Board
            </h1>
            <span className="font-label text-[11px] leading-[14px] text-on-surface-variant truncate">
              ECSAD Kiosk /kitchen
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              aria-label="Filter and search orders"
              onClick={() => setShowSearch((prev) => !prev)}
              className={`w-11 h-11 flex items-center justify-center rounded-full transition-all ${
                showSearch
                  ? 'bg-primary-fixed text-primary'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <ListFilter className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="Refresh orders"
              onClick={handleRefresh}
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all"
            >
              <RefreshCw
                className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              type="button"
              aria-label="Staff logout"
              onClick={handleLogout}
              className="w-11 h-11 flex items-center justify-center rounded-full text-error hover:bg-error-container/40 active:scale-95 transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-col relative w-full max-w-7xl mx-auto pt-16 pb-12 flex-1">
        {actionError && (
          <div
            role="alert"
            className="mx-4 mt-3 rounded-xl bg-error-container text-on-error-container px-4 py-3 text-[13px] font-medium border border-error/20"
          >
            {actionError}
          </div>
        )}

        {/* Live Operational Metrics & Context Bar */}
        <section className="px-4 pt-3 pb-2 flex flex-col gap-2">
          <div className="bg-surface-container-low rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                  <Utensils className="w-4 h-4" />
                </div>
                <span className="font-label text-[13px] leading-[16px] text-primary tracking-wider uppercase font-bold">
                  Defense service
                </span>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span className="font-label text-[11px] leading-[14px] text-on-surface-variant">
                  Queue
                </span>
                <span className="font-label text-[16px] leading-[20px] text-primary font-bold flex items-center gap-1.5 tabular-nums">
                  <span>{metrics.totalActive} Active</span>
                </span>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="bg-surface-container-lowest rounded-lg p-2.5 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="font-label text-[11px] leading-[14px] text-on-surface-variant">
                  Reviewing
                </span>
                <span className="text-[18px] leading-[24px] font-semibold text-primary mt-0.5 tabular-nums">
                  {metrics.reviewing}
                </span>
              </div>
              <div className="bg-surface-container-lowest rounded-lg p-2.5 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="font-label text-[11px] leading-[14px] text-on-surface-variant">
                  Preparing
                </span>
                <span className="text-[18px] leading-[24px] font-semibold text-primary mt-0.5 tabular-nums">
                  {metrics.preparing}
                </span>
              </div>
              <div className="bg-surface-container-lowest rounded-lg p-2.5 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="font-label text-[11px] leading-[14px] text-on-surface-variant">
                  Served
                </span>
                <span className="text-[18px] leading-[24px] font-semibold text-secondary mt-0.5 tabular-nums">
                  {metrics.served}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Optional Expandable Search Bar */}
        {showSearch && (
          <section className="px-4 py-2">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-outline absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search panelist name, food item, or token..."
                className="w-full h-11 pl-10 pr-10 rounded-xl bg-surface-container-lowest border border-outline-variant/50 text-[14px] text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </section>
        )}

        {/* Sticky Interactive Filter Section */}
        <section className="sticky top-16 z-30 bg-surface/95 backdrop-blur-md px-4 py-2 flex flex-col gap-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 py-1">
            {/* Meal Category Segmented Control */}
            <div className="flex items-center justify-between gap-1 p-1 bg-surface-container-high rounded-full shadow-inner md:min-w-[340px]">
              {(
                [
                  { id: 'all', label: 'All Meals', count: metrics.allMeals },
                  {
                    id: 'breakfast',
                    label: 'Breakfast',
                    count: metrics.breakfastCount,
                  },
                  { id: 'lunch', label: 'Lunch', count: metrics.lunchCount },
                ] as const
              ).map((item) => {
                const active = mealFilter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setMealFilter(item.id)}
                    className={`flex-1 py-1.5 px-3 rounded-full font-label text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                      active
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`tabular-nums text-[11px] font-bold ${
                        active ? 'text-on-primary/90' : 'text-on-surface-variant'
                      }`}
                    >
                      ({item.count})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Status Tabs */}
            <div
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5"
              role="tablist"
            >
              {(
                [
                  { id: 'all', label: 'All', count: null },
                  {
                    id: 'reviewing',
                    label: 'Reviewing',
                    count: metrics.reviewing,
                  },
                  {
                    id: 'preparing',
                    label: 'Preparing',
                    count: metrics.preparing,
                  },
                  { id: 'served', label: 'Served', count: metrics.served },
                  { id: 'voided', label: 'Voided', count: metrics.voided },
                ] as const
              ).map((tab) => {
                const active = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`h-9 px-3.5 rounded-full font-label text-[12px] font-semibold shrink-0 flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      active
                        ? 'bg-primary-container text-on-primary-container shadow-sm'
                        : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface shadow-sm'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== null && (
                      <span className="tabular-nums font-bold">
                        · {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Live Orders Feed */}
        {filteredOrders.length === 0 ? (
          <section className="px-4 py-14 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-secondary-container text-primary flex items-center justify-center">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-1 max-w-xs">
              <h3 className="text-[18px] leading-[24px] font-semibold text-on-surface">
                Queue is currently clear
              </h3>
              <p className="text-[14px] leading-[20px] text-on-surface-variant">
                No panelist tickets match this filter right now. New orders pop
                in automatically via live sync.
              </p>
            </div>
          </section>
        ) : (
          <div className="px-4 pt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            {filteredOrders.map((order) => {
              const dupKey = `${order.meal}::${order.panelistName.trim().toLowerCase()}`;
              const dupTokens = duplicateMap.get(dupKey);
              const isDuplicate =
                order.status !== 'served' &&
                order.status !== 'voided' &&
                dupTokens &&
                dupTokens.size > 1;
              const relativeTime = formatRelativeTime(order.createdAt, nowMs);
              const isJustNow = relativeTime === 'Just now';
              const isBusy = updatingId === order.id;
              const isVoided = order.status === 'voided';

              if (order.status === 'served' || isVoided) {
                return (
                  <article
                    key={order.id}
                    className={`bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-3 relative overflow-hidden transition-all duration-200 ${
                      isVoided
                        ? 'opacity-75 border border-error/25'
                        : 'opacity-85 border border-outline-variant/25'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          {isVoided ? (
                            <X className="w-5 h-5 text-error shrink-0" />
                          ) : (
                            <Check className="w-5 h-5 text-secondary shrink-0" />
                          )}
                          <h2 className="text-[18px] leading-[24px] font-semibold text-on-surface truncate line-through">
                            {order.panelistName}
                          </h2>
                        </div>
                        <span className="font-label text-[11px] text-on-surface-variant mt-0.5">
                          {order.meal === 'breakfast' ? 'Breakfast' : 'Lunch'} ·
                          Token #{order.deviceToken}
                          {order.note ? ` · ${order.note}` : ''}
                        </span>
                      </div>
                      <span
                        className={`font-label text-[11px] font-bold whitespace-nowrap ${
                          isVoided ? 'text-error' : 'text-on-surface-variant'
                        }`}
                      >
                        {isVoided ? 'Voided' : 'Served ✓'}
                      </span>
                    </div>

                    <div className="bg-surface-container-low rounded-lg p-2.5 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderId(order.id)}
                        aria-label={`View full order for ${order.panelistName}`}
                        className="text-[12px] text-on-surface-variant truncate text-left hover:text-primary cursor-pointer"
                      >
                        {[
                          ...order.food,
                          order.coffee,
                          ...(order.fruit || []),
                          order.rice,
                          order.drink,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </button>
                      {order.status === 'served' && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => moveOrder(order.id, 'preparing')}
                            className="min-h-[36px] px-3 rounded-full bg-surface-container-highest hover:bg-surface-dim text-on-surface-variant font-label text-[11px] font-semibold flex items-center gap-1 shrink-0 active:scale-95 transition-all disabled:opacity-60"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                            <span>Return</span>
                          </button>
                      )}
                    </div>
                  </article>
                );
              }

              return (
                <article
                  key={order.id}
                  className="bg-surface-container-lowest rounded-xl p-4 shadow-md flex flex-col gap-3 relative overflow-hidden transition-all duration-200 border border-outline-variant/20"
                >
                  {/* Duplicate Name Warning Banner */}
                  {isDuplicate && (
                    <div className="bg-error-container text-on-error-container rounded-lg p-2.5 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-label text-[11px] font-bold">
                          Duplicate Name Alert
                        </span>
                        <span className="text-[12px] leading-tight text-on-surface-variant">
                          {dupTokens.size} distinct device orders under &quot;
                          {order.panelistName}&quot;. Verify token{' '}
                          <code className="font-label text-[11px] font-bold text-on-error-container">
                            #{order.deviceToken}
                          </code>
                          .
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <User className="w-5 h-5 text-primary shrink-0" />
                        <h2 className="text-[18px] leading-[24px] font-semibold text-on-surface truncate">
                          {order.panelistName}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span
                          className={`font-label text-[11px] flex items-center gap-1 tabular-nums ${
                            isJustNow
                              ? 'text-primary font-bold'
                              : 'text-on-surface-variant'
                          }`}
                        >
                          {isJustNow ? (
                            <Zap className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          <span>{relativeTime}</span>
                        </span>
                        <span className="text-outline-variant">·</span>
                        <span className="font-label text-[11px] text-on-surface-variant tabular-nums">
                          #{order.deviceToken}
                        </span>
                        {order.note && (
                          <>
                            <span className="text-outline-variant">·</span>
                            <span className="font-label text-[11px] text-on-surface-variant">
                              {order.note}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`font-label text-[11px] uppercase tracking-wider font-bold ${
                          order.meal === 'breakfast'
                            ? 'text-primary'
                            : 'text-tertiary'
                        }`}
                      >
                        {order.meal === 'breakfast' ? 'Breakfast' : 'Lunch'}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-label font-bold ${
                          order.status === 'preparing'
                            ? 'text-primary'
                            : 'text-secondary'
                        }`}
                      >
                        {order.status === 'preparing' ? (
                          <Flame className="w-3.5 h-3.5" />
                        ) : null}
                        <span>{STATUS_LABELS[order.status]}</span>
                      </span>
                    </div>
                  </div>

                  {/* Food Choices Box */}
                  <div
                    role="button"
                    tabIndex={0}
                    aria-haspopup="dialog"
                    aria-label={`View full order for ${order.panelistName}`}
                    onClick={() => setSelectedOrderId(order.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedOrderId(order.id);
                      }
                    }}
                    className="bg-surface-container-low rounded-lg p-3 flex flex-col gap-2.5 cursor-pointer hover:ring-1 hover:ring-primary/30 focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-label text-[11px] text-on-surface-variant tracking-wide">
                        Food Picks ({order.food.length}{' '}
                        {order.food.length === 1 ? 'Item' : 'Items'})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {order.food.map((item) => (
                          <span
                            key={item}
                            className="px-2.5 py-1 rounded-md bg-surface-container-lowest text-on-surface text-[13px] font-medium shadow-sm"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    {order.meal === 'breakfast' ? (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="flex flex-col min-w-0">
                          <span className="font-label text-[11px] text-on-surface-variant">
                            Coffee
                          </span>
                          <span className="text-[13px] text-on-surface font-semibold truncate flex items-center gap-1">
                            <Coffee className="w-3.5 h-3.5 text-tertiary shrink-0" />
                            <span className="truncate">
                              {order.coffee || 'No Coffee'}
                            </span>
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-label text-[11px] text-on-surface-variant">
                            Drink
                          </span>
                          <span className="text-[13px] text-on-surface font-semibold truncate flex items-center gap-1">
                            <GlassWater className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate">{order.drink}</span>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div className="flex flex-col min-w-0">
                          <span className="font-label text-[11px] text-on-surface-variant">
                            Rice
                          </span>
                          <span className="text-[13px] text-on-surface font-semibold truncate flex items-center gap-1">
                            <CookingPot className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate">
                              {order.rice?.replace(' Rice', '') || 'Plain'}
                            </span>
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-label text-[11px] text-on-surface-variant">
                            Fruit
                          </span>
                          <span className="text-[13px] text-on-surface font-semibold truncate flex items-center gap-1">
                            <Apple className="w-3.5 h-3.5 text-tertiary shrink-0" />
                            <span className="truncate">
                              {order.fruit?.join(', ') || 'None'}
                            </span>
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-label text-[11px] text-on-surface-variant">
                            Drink
                          </span>
                          <span className="text-[13px] text-on-surface font-semibold truncate flex items-center gap-1">
                            <GlassWater className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate">{order.drink}</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Kitchen Action Buttons */}
                  {order.status === 'reviewing' ? (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => moveOrder(order.id, 'preparing')}
                        className="flex-1 h-12 rounded-full bg-primary-container hover:bg-primary text-on-primary-container hover:text-on-primary font-label text-[15px] font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all disabled:opacity-60"
                      >
                        <Flame className="w-5 h-5" />
                        <span>Start Preparing</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => moveOrder(order.id, 'voided')}
                        aria-label="Void order"
                        title="Void order"
                        className="h-12 px-4 rounded-full border border-error/30 bg-error-container/40 text-error hover:bg-error-container font-label text-[12px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-60"
                      >
                        <X className="w-4 h-4" />
                        <span>Void</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => moveOrder(order.id, 'reviewing')}
                        title="Move back to Reviewing"
                        className="h-12 px-3.5 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-variant font-label text-[12px] font-semibold flex items-center justify-center gap-1 shrink-0 active:scale-95 transition-all disabled:opacity-60"
                      >
                        <Undo2 className="w-4 h-4" />
                        <span>Review</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => moveOrder(order.id, 'served')}
                        className="h-12 flex-1 rounded-full bg-primary-container hover:bg-primary text-on-primary-container hover:text-on-primary font-label text-[15px] font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all disabled:opacity-60"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Mark as Served</span>
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
      {selectedOrder && (
        <dialog
          ref={orderDialogRef}
          aria-labelledby="order-details-title"
          onCancel={(event) => {
            event.preventDefault();
            setSelectedOrderId(null);
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedOrderId(null);
            }
          }}
          className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-outline-variant/30 bg-surface p-0 text-on-surface shadow-2xl backdrop:bg-black/50"
        >
          <div className="p-5">
            <header className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="font-label text-[11px] font-bold uppercase tracking-wider text-primary">
                  {selectedOrder.meal === 'breakfast' ? 'Breakfast' : 'Lunch'}
                </span>
                <h2
                  id="order-details-title"
                  className="text-xl font-bold text-on-surface"
                >
                  Order details
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {selectedOrder.panelistName}
                </p>
              </div>
              <button
                type="button"
                autoFocus
                aria-label="Close order details"
                onClick={() => setSelectedOrderId(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-surface-container-low p-3 text-sm">
              <div>
                <dt className="text-xs text-on-surface-variant">Status</dt>
                <dd className="mt-0.5 font-semibold">
                  {STATUS_LABELS[selectedOrder.status]}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-on-surface-variant">Token</dt>
                <dd className="mt-0.5 font-semibold">
                  #{selectedOrder.deviceToken}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-on-surface-variant">Placed</dt>
                <dd className="mt-0.5 font-semibold">
                  {formatRelativeTime(selectedOrder.createdAt, nowMs)}
                </dd>
              </div>
            </dl>

            <section className="mt-4 rounded-xl border border-outline-variant/30 p-4">
              <h3 className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Food Picks
              </h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {selectedOrder.food.map((item) => (
                  <li
                    key={item}
                    className="rounded-lg bg-surface-container-low px-3 py-2 text-sm font-semibold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {selectedOrder.meal === 'breakfast' ? (
              <dl className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface-container-low p-3">
                  <dt className="text-xs text-on-surface-variant">Coffee</dt>
                  <dd className="mt-1 font-semibold">
                    {selectedOrder.coffee || 'No Coffee'}
                  </dd>
                </div>
                <div className="rounded-xl bg-surface-container-low p-3">
                  <dt className="text-xs text-on-surface-variant">Drink</dt>
                  <dd className="mt-1 font-semibold">{selectedOrder.drink}</dd>
                </div>
              </dl>
            ) : (
              <dl className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface-container-low p-3">
                  <dt className="text-xs text-on-surface-variant">Fruit</dt>
                  <dd className="mt-1 font-semibold">
                    {selectedOrder.fruit?.join(', ') || 'None'}
                  </dd>
                </div>
                <div className="rounded-xl bg-surface-container-low p-3">
                  <dt className="text-xs text-on-surface-variant">Rice</dt>
                  <dd className="mt-1 font-semibold">
                    {selectedOrder.rice || 'Plain Rice'}
                  </dd>
                </div>
                <div className="col-span-2 rounded-xl bg-surface-container-low p-3">
                  <dt className="text-xs text-on-surface-variant">Drink</dt>
                  <dd className="mt-1 font-semibold">{selectedOrder.drink}</dd>
                </div>
              </dl>
            )}

            {selectedOrder.note && (
              <div className="mt-3 rounded-xl bg-surface-container-low p-3">
                <span className="text-xs text-on-surface-variant">Note</span>
                <p className="mt-1 font-semibold">{selectedOrder.note}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedOrderId(null)}
              className="mt-5 min-h-11 w-full rounded-full bg-primary text-on-primary font-label font-bold hover:bg-primary-container"
            >
              Close
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
}
