'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  IdCard,
  Loader2,
  ClipboardList,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ECSAD_LOGO_SRC } from '@/lib/menu-data';
import {
  getOrCreateDeviceToken,
  getSavedPanelistName,
  savePanelistName,
} from '@/lib/kiosk-client';

export default function NameEntryClient() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [showError, setShowError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasActiveOrders, setHasActiveOrders] = useState(false);

  useEffect(() => {
    let active = true;
    async function hydrate() {
      const saved = getSavedPanelistName();
      const token = getOrCreateDeviceToken();
      if (active && saved) {
        setName(saved);
      }
      try {
        const res = await fetch(
          `/api/orders?deviceToken=${encodeURIComponent(token)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (active && data?.orders?.length > 0) {
          setHasActiveOrders(true);
        }
      } catch {
        // Non-blocking check
      }
    }
    void hydrate();
    return () => {
      active = false;
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setShowError(true);
      return;
    }

    setSubmitting(true);
    savePanelistName(trimmed);
    getOrCreateDeviceToken();
    router.push('/order/breakfast');
  }

  return (
    <main className="relative flex flex-col w-full min-h-[100dvh] justify-center items-center px-4 py-10 bg-surface overflow-hidden">
      {/* Subtle ambient background accents matching Stitch surface */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-32 -right-32 w-80 h-80 rounded-full bg-primary-fixed/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -bottom-32 -left-32 w-80 h-80 rounded-full bg-secondary-container/50 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col w-full max-w-md gap-6 pb-8"
      >
        {/* Top Hospitality Header & Logo */}
        <div className="flex flex-col gap-2 pt-2 items-center text-center">
          <div className="flex flex-col items-center gap-3 mb-1">
            <div className="relative w-36 h-36 rounded-full p-1.5 bg-surface-container-lowest shadow-2xl ring-8 ring-primary/15 overflow-hidden flex items-center justify-center my-2">
              <Image
                src={ECSAD_LOGO_SRC}
                alt="ECSAD Logo"
                width={144}
                height={144}
                priority
                className="w-full h-full rounded-full object-cover shrink-0"
              />
            </div>
            <p className="font-label text-[11px] leading-[14px] uppercase tracking-widest text-primary font-bold">
              ECSAD Defense · Panelist Kiosk
            </p>
          </div>

          <h1 className="text-[28px] leading-[36px] tracking-[-0.02em] font-bold text-on-surface text-balance">
            Welcome, Panelist
          </h1>
          <p className="text-[16px] leading-[24px] font-medium text-on-surface-variant max-w-sm">
            Order your breakfast and lunch for today’s defense.
          </p>
        </div>

        {/* Name Entry Card */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4 bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/40"
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="panelist-name"
              className="text-[18px] leading-[24px] font-semibold text-on-surface"
            >
              Your Name
            </label>
            <div className="relative flex items-center">
              <IdCard
                aria-hidden="true"
                className="absolute left-4 w-5 h-5 text-primary pointer-events-none"
              />
              <input
                id="panelist-name"
                name="panelistName"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (e.target.value.trim().length > 0) {
                    setShowError(false);
                  }
                }}
                placeholder="e.g., Dr. Maria Santos"
                className={`w-full h-[52px] pl-11 pr-4 py-3 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline border text-[16px] leading-[24px] font-medium focus:outline-none focus:ring-2 transition-all ${
                  showError
                    ? 'border-error focus:border-error focus:ring-error/20'
                    : 'border-outline-variant/60 focus:border-primary focus:ring-primary/20'
                }`}
              />
            </div>
            {showError && (
              <p
                role="alert"
                className="text-[12px] leading-[16px] text-error flex items-center gap-1.5 mt-1"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Please enter your name so the kitchen knows who to serve.
                </span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[48px] px-6 py-3 rounded-full bg-primary hover:bg-primary-container text-on-primary font-label text-[16px] leading-[20px] tracking-[0.02em] font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/25 active:scale-[0.98] transition-all mt-1 disabled:opacity-75 whitespace-nowrap"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Opening Menu...</span>
              </>
            ) : (
              <>
                <span>Start Ordering</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Active Order Quick Link if panelist already placed orders */}
        {hasActiveOrders && (
          <div className="flex justify-center">
            <Link
              href="/status"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary-fixed/60 text-on-primary-fixed font-label text-[13px] font-bold hover:bg-primary-fixed transition-colors whitespace-nowrap"
            >
              <ClipboardList className="w-4 h-4 text-primary" />
              <span>View My Live Order Status</span>
              <ArrowRight className="w-4 h-4 text-primary" />
            </Link>
          </div>
        )}

        {/* Kitchen Portal Footer Link */}
        <div className="flex items-center justify-center pt-1">
          <Link
            href="/kitchen"
            className="inline-flex items-center gap-1.5 text-secondary hover:text-primary text-[12px] leading-[16px] transition-colors group"
          >
            <span>Are you kitchen staff?</span>
            <span className="font-label text-[11px] font-semibold underline underline-offset-4 group-hover:text-primary">
              Kitchen Portal →
            </span>
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
