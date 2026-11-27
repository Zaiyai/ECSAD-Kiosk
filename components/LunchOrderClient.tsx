'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Apple,
  ArrowRight,
  Check,
  ChevronLeft,
  CookingPot,
  GlassWater,
  Loader2,
  Utensils,
  UtensilsCrossed,
} from 'lucide-react';
import {
  DEFAULT_LUNCH_SELECTION,
  ECSAD_LOGO_SRC,
  LUNCH_DRINK_OPTIONS,
  LUNCH_FOOD_OPTIONS,
  LUNCH_FRUIT_OPTIONS,
  LUNCH_RICE_OPTIONS,
} from '@/lib/menu-data';
import {
  getBreakfastDraft,
  getLunchDraft,
  getOrCreateDeviceToken,
  getSavedPanelistName,
  saveLunchDraft,
} from '@/lib/kiosk-client';
import type { LunchSelection, OrderRecord } from '@/lib/types';
import SafeFoodImage from './SafeFoodImage';

export default function LunchOrderClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editOrderId = searchParams.get('edit');

  const [selection, setSelection] = useState<LunchSelection>(
    DEFAULT_LUNCH_SELECTION
  );
  const [panelistName, setPanelistName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    async function hydrate() {
      const savedName = getSavedPanelistName();
      if (!savedName && !editOrderId) {
        router.replace('/');
        return;
      }
      if (active) setPanelistName(savedName);

      if (editOrderId) {
        try {
          const token = getOrCreateDeviceToken();
          const res = await fetch(
            `/api/orders?deviceToken=${encodeURIComponent(token)}`
          );
          const data = res.ok ? await res.json() : null;
          const match = (data?.orders as OrderRecord[] | undefined)?.find(
            (o) => o.id === editOrderId && o.meal === 'lunch'
          );
          if (active) {
            if (match) {
              setSelection({
                food: match.food,
                fruit: match.fruit || ['Grape'],
                rice: match.rice || 'Chaopan Rice',
                drink: match.drink,
              });
            } else {
              setSelection(getLunchDraft());
            }
            setReady(true);
          }
        } catch {
          if (active) {
            setSelection(getLunchDraft());
            setReady(true);
          }
        }
      } else if (active) {
        setSelection(getLunchDraft());
        setReady(true);
      }
    }
    void hydrate();
    return () => {
      active = false;
    };
  }, [editOrderId, router]);

  function toggleFood(item: string) {
    setErrorMsg(null);
    setSelection((prev) => {
      const exists = prev.food.includes(item);
      const nextFood = exists
        ? prev.food.filter((f) => f !== item)
        : [...prev.food, item];
      const next = { ...prev, food: nextFood };
      if (!editOrderId) saveLunchDraft(next);
      return next;
    });
  }

  function toggleFruit(item: string) {
    setErrorMsg(null);
    setSelection((prev) => {
      const exists = prev.fruit.includes(item);
      const nextFruit = exists
        ? prev.fruit.filter((f) => f !== item)
        : [...prev.fruit, item];
      const next = { ...prev, fruit: nextFruit };
      if (!editOrderId) saveLunchDraft(next);
      return next;
    });
  }

  function selectRice(rice: string) {
    setErrorMsg(null);
    setSelection((prev) => {
      const next = { ...prev, rice };
      if (!editOrderId) saveLunchDraft(next);
      return next;
    });
  }

  function selectDrink(drink: string) {
    setErrorMsg(null);
    setSelection((prev) => {
      const next = { ...prev, drink };
      if (!editOrderId) saveLunchDraft(next);
      return next;
    });
  }

  async function handleSubmit() {
    if (selection.food.length === 0) {
      setErrorMsg('Please select at least 1 lunch food item.');
      return;
    }
    if (selection.fruit.length === 0) {
      setErrorMsg('Please select at least 1 fruit option.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    const deviceToken = getOrCreateDeviceToken();

    try {
      if (editOrderId) {
        const res = await fetch(
          `/api/orders/${encodeURIComponent(editOrderId)}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              deviceToken,
              meal: 'lunch',
              food: selection.food,
              fruit: selection.fruit,
              rice: selection.rice,
              drink: selection.drink,
            }),
          }
        );
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'Unable to save lunch changes.');
          setSubmitting(false);
          return;
        }
        router.push('/status');
        return;
      }

      saveLunchDraft(selection);
      const breakfast = getBreakfastDraft();
      const nameToSend = panelistName || getSavedPanelistName();

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          panelistName: nameToSend,
          deviceToken,
          breakfast,
          lunch: selection,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not submit order. Please try again.');
        setSubmitting(false);
        return;
      }
      router.push('/status');
    } catch {
      setErrorMsg('Network error while submitting your order.');
      setSubmitting(false);
    }
  }

  const allPickedItems = [
    ...selection.food,
    ...selection.fruit,
    selection.rice,
    selection.drink,
  ].filter(Boolean);

  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-[100dvh]">
      {/* Fixed Top App Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(37,0,90,0.04)] border-b border-surface-container-high/60 pt-safe">
        <div className="max-w-3xl mx-auto h-16 px-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <button
              type="button"
              aria-label="Back"
              onClick={() => {
                if (editOrderId) {
                  router.push('/status');
                  return;
                }
                router.push('/order/breakfast', {
                  transitionTypes: ['nav-back'],
                });
              }}
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-primary-fixed/60 text-primary flex items-center justify-center shrink-0">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <h1 className="text-[18px] leading-[24px] font-semibold text-on-surface truncate">
                Lunch Order
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="font-label text-[11px] leading-[14px] font-semibold tracking-wider uppercase text-on-surface-variant whitespace-nowrap">
              {panelistName ? panelistName : 'ECSAD KIOSK'}
            </span>
            <Image
              src={ECSAD_LOGO_SRC}
              alt="ECSAD Logo"
              width={28}
              height={28}
              className="w-7 h-7 rounded-full object-cover border border-primary/20 shadow-sm shrink-0"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col relative w-full max-w-3xl mx-auto px-4 pt-16 pb-32 flex-1">
        {/* Progress Header */}
        <div className="flex flex-col gap-2 pt-3 pb-4">
          <div className="flex items-center justify-between">
            <span className="font-label text-[13px] leading-[16px] text-on-surface-variant font-semibold tracking-wider uppercase">
              {editOrderId
                ? 'EDITING LUNCH ORDER'
                : 'LUNCH MENU · STEP 2 OF 2'}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
            <div className="w-full h-full rounded-full bg-primary transition-all duration-300" />
          </div>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mb-4 rounded-xl bg-error-container text-on-error-container px-4 py-3 text-[13px] font-medium border border-error/20"
          >
            {errorMsg}
          </div>
        )}

        {!ready ? (
          <div className="flex flex-col gap-4 py-4">
            <div className="h-20 rounded-xl bg-surface-container animate-pulse" />
            <div className="h-20 rounded-xl bg-surface-container animate-pulse" />
            <div className="h-20 rounded-xl bg-surface-container animate-pulse" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Food Section */}
            <section aria-labelledby="food-heading" className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-primary" />
                  <h2
                    id="food-heading"
                    className="text-[18px] leading-[24px] font-semibold text-on-surface"
                  >
                    Food
                  </h2>
                </div>
                <span className="font-label text-[11px] leading-[14px] text-on-surface-variant">
                  Select 1 or more
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {LUNCH_FOOD_OPTIONS.map((item) => {
                  const isSelected = selection.food.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleFood(item.id)}
                      aria-pressed={isSelected}
                      className={`w-full flex items-center gap-4 p-2.5 rounded-xl border-2 shadow-sm transition-all duration-150 text-left min-h-[76px] ${
                        isSelected
                          ? 'bg-primary-fixed/60 border-primary text-on-primary-fixed'
                          : 'bg-surface-container-lowest border-transparent text-on-surface hover:border-outline-variant/40'
                      }`}
                    >
                      <SafeFoodImage
                        src={item.image}
                        alt={item.alt}
                        size={64}
                        className="w-16 h-16 rounded-lg shadow-sm"
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[16px] leading-5 font-bold truncate">
                          {item.label}
                        </span>
                        <span
                          className={`text-[12px] leading-4 truncate mt-0.5 ${
                            isSelected
                              ? 'text-on-primary-fixed-variant'
                              : 'text-on-surface-variant'
                          }`}
                        >
                          {item.description}
                        </span>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-primary text-on-primary shadow-sm'
                            : 'bg-surface-container-high text-transparent'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Fruit Section */}
            <section
              aria-labelledby="fruit-heading"
              className="flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Apple className="w-5 h-5 text-primary" />
                  <h2
                    id="fruit-heading"
                    className="text-[18px] leading-[24px] font-semibold text-on-surface"
                  >
                    Fruit
                  </h2>
                </div>
                <span className="font-label text-[11px] leading-[14px] text-on-surface-variant">
                  Select 1 or more
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {LUNCH_FRUIT_OPTIONS.map((item) => {
                  const isSelected = selection.fruit.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleFruit(item.id)}
                      aria-pressed={isSelected}
                      className={`w-full min-h-[60px] flex items-center justify-between gap-2 p-4 rounded-xl border-2 shadow-sm transition-all duration-150 text-left ${
                        isSelected
                          ? 'bg-primary-fixed/60 border-primary text-on-primary-fixed'
                          : 'bg-surface-container-lowest border-transparent text-on-surface hover:border-outline-variant/40'
                      }`}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-label text-[15px] leading-[20px] font-bold truncate">
                          {item.label}
                        </span>
                        {item.description && (
                          <span
                            className={`text-[12px] leading-4 truncate ${
                              isSelected
                                ? 'text-on-primary-fixed-variant'
                                : 'text-on-surface-variant'
                            }`}
                          >
                            {item.description}
                          </span>
                        )}
                      </div>
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-primary text-on-primary shadow-sm'
                            : 'bg-surface-container-high text-transparent'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Rice Section */}
            <section
              aria-labelledby="rice-heading"
              className="flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CookingPot className="w-5 h-5 text-primary" />
                  <h2
                    id="rice-heading"
                    className="text-[18px] leading-[24px] font-semibold text-on-surface"
                  >
                    Rice
                  </h2>
                </div>
                <span className="font-label text-[11px] leading-[14px] text-secondary font-medium">
                  Required · Pick 1
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {LUNCH_RICE_OPTIONS.map((item) => {
                  const isSelected = selection.rice === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectRice(item.id)}
                      aria-pressed={isSelected}
                      className={`w-full min-h-[60px] flex items-center justify-between gap-2 p-4 rounded-xl border-2 shadow-sm transition-all duration-150 text-left ${
                        isSelected
                          ? 'bg-primary-fixed/60 border-primary text-on-primary-fixed'
                          : 'bg-surface-container-lowest border-transparent text-on-surface hover:border-outline-variant/40'
                      }`}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-label text-[15px] leading-[20px] font-bold truncate">
                          {item.label}
                        </span>
                        {item.description && (
                          <span
                            className={`text-[12px] leading-4 truncate ${
                              isSelected
                                ? 'text-on-primary-fixed-variant'
                                : 'text-on-surface-variant'
                            }`}
                          >
                            {item.description}
                          </span>
                        )}
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'border-2 border-primary bg-primary text-on-primary'
                            : 'border border-outline-variant bg-surface-container-high'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isSelected ? 'bg-on-primary' : 'bg-transparent'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Drink Section */}
            <section
              aria-labelledby="drink-heading"
              className="flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <GlassWater className="w-5 h-5 text-primary" />
                  <h2
                    id="drink-heading"
                    className="text-[18px] leading-[24px] font-semibold text-on-surface"
                  >
                    Drink
                  </h2>
                </div>
                <span className="font-label text-[11px] leading-[14px] text-secondary font-medium">
                  Required · Pick 1
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {LUNCH_DRINK_OPTIONS.map((item, idx) => {
                  const isSelected = selection.drink === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectDrink(item.id)}
                      aria-pressed={isSelected}
                      className={`w-full min-h-[56px] flex items-center justify-between gap-2 p-4 rounded-xl border-2 shadow-sm transition-all duration-150 text-left ${
                        idx === 2 ? 'col-span-2 md:col-span-1' : ''
                      } ${
                        isSelected
                          ? 'bg-primary-fixed/60 border-primary text-on-primary-fixed'
                          : 'bg-surface-container-lowest border-transparent text-on-surface hover:border-outline-variant/40'
                      }`}
                    >
                      <span className="font-label text-[15px] leading-[20px] font-bold truncate">
                        {item.label}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'border-2 border-primary bg-primary text-on-primary'
                            : 'border border-outline-variant bg-surface-container-high'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isSelected ? 'bg-on-primary' : 'bg-transparent'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Fixed Bottom Summary & CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(37,0,90,0.08)] border-t border-surface-container px-4 py-2.5 pb-safe">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <span className="font-label text-[13px] leading-[16px] text-primary font-bold tabular-nums">
              {allPickedItems.length}{' '}
              {allPickedItems.length === 1 ? 'item' : 'items'} selected
            </span>
            <span className="text-[12px] leading-[16px] text-on-surface-variant truncate">
              {allPickedItems.length > 0
                ? allPickedItems.join(', ')
                : 'Tap an item to begin'}
            </span>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="min-h-[48px] px-5 rounded-full bg-primary-container hover:bg-primary text-white font-label text-[15px] leading-[20px] font-bold flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 active:scale-95 transition-all shrink-0 whitespace-nowrap disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{editOrderId ? 'Saving...' : 'Submitting...'}</span>
              </>
            ) : editOrderId ? (
              <>
                <span>Save Changes</span>
                <Check className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Submit Order</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
