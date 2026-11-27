'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  AtSign,
  Check,
  ChefHat,
  Eye,
  EyeOff,
  HelpCircle,
  Loader2,
  Lock,
  XCircle,
} from 'lucide-react';
import { ECSAD_LOGO_SRC } from '@/lib/menu-data';

export default function KitchenLoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState('kitchen-team@ecsad.local');
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/kitchen/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, passcode, keepSignedIn }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(
          data.message ||
            'Incorrect email or passcode (auth/invalid-login-credentials)'
        );
        setSubmitting(false);
        return;
      }

      router.push('/kitchen');
      router.refresh();
    } catch {
      setAuthError('Unable to reach authentication server. Please retry.');
      setSubmitting(false);
    }
  }

  function fillStationGuideCredentials() {
    setEmail('kitchen-team@ecsad.local');
    setPasscode('ecsad2026');
    setAuthError(null);
  }

  return (
    <div className="bg-surface min-h-[100dvh] text-on-surface flex flex-col">
      {/* Mobile Header (matches Kitchen_Staff_Login.html) */}
      <header className="lg:hidden fixed top-0 w-full z-50 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="Back to panelist kiosk"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-surface-container hover:bg-secondary-container transition-colors text-primary"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 font-label text-[11px] uppercase">
                <span className="text-primary font-bold">ECSAD KIOSK</span>
                <span className="text-outline">·</span>
                <span className="text-secondary">PORTAL</span>
              </div>
              <h1 className="text-[18px] leading-none font-semibold text-on-surface tracking-tight">
                Kitchen Login
              </h1>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-secondary-container text-on-secondary-fixed rounded-full">
            <Lock className="w-4 h-4 text-primary" />
            <span className="font-label text-[11px] uppercase font-semibold">
              Staff Area
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-10 lg:py-10">
        <div className="w-full max-w-7xl mx-auto">
          {/* Desktop Brand Top Bar (matches Kitchen_Staff_Login_Desktop.html) */}
          <div className="hidden lg:flex items-center justify-between mb-8 px-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm shrink-0">
                <Image
                  src={ECSAD_LOGO_SRC}
                  alt="ECSAD Brand Icon"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="font-label text-[11px] text-primary tracking-widest block uppercase font-bold">
                  ECSAD · Cute ni Edrian
                </span>
                <span className="text-[18px] leading-6 text-on-surface font-bold">
                  Kiosk Management Core
                </span>
              </div>
            </div>
          </div>

          {/* Centered Card Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start lg:px-4">
            <div className="hidden lg:block lg:col-span-3" />

            <div className="lg:col-span-6 w-full flex flex-col items-center">
              <div className="w-full bg-surface-container-lowest rounded-xl shadow-xl p-6 sm:p-10 relative overflow-hidden border border-outline-variant/20">
                <div
                  aria-hidden="true"
                  className="hidden lg:block absolute -top-24 -right-24 w-60 h-60 bg-primary-fixed/25 rounded-full blur-3xl pointer-events-none"
                />
                <div
                  aria-hidden="true"
                  className="hidden lg:block absolute -bottom-24 -left-24 w-60 h-60 bg-secondary-container/40 rounded-full blur-3xl pointer-events-none"
                />

                {/* Portal Header */}
                <div className="flex flex-col items-center text-center relative z-10 mb-7">
                  <div className="w-20 h-20 rounded-full p-1 bg-surface-container-low mb-4 shadow-sm overflow-hidden">
                    <Image
                      src={ECSAD_LOGO_SRC}
                      alt="ECSAD Portal Core Logo"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  <p className="font-label text-[11px] tracking-wider uppercase font-bold text-primary mb-2">
                    ECSAD Kiosk Portal
                  </p>
                  <h2 className="text-[28px] leading-[36px] tracking-[-0.02em] text-on-surface font-bold">
                    Kitchen Staff Portal
                  </h2>
                  <p className="text-[14px] leading-[20px] text-on-surface-variant mt-1.5 max-w-sm">
                    Authorized defense kitchen stations &amp; leads only
                  </p>
                </div>

                {/* 401 Auth Error Banner (shown only on failed login) */}
                {authError && (
                  <div
                    role="alert"
                    className="mb-6 p-4 rounded-xl bg-error-container text-on-error-container flex items-start gap-3 relative z-10 shadow-sm border border-error/20"
                  >
                    <AlertCircle className="w-6 h-6 text-error shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-label text-[13px] font-bold uppercase tracking-wider text-error">
                          Invalid Credentials
                        </h3>
                        <span className="font-label text-[11px] uppercase tracking-wider text-error font-semibold shrink-0">
                          401 Auth Error
                        </span>
                      </div>
                      <p className="text-[12px] leading-relaxed mt-1 text-on-error-container">
                        {authError}
                      </p>
                    </div>
                  </div>
                )}

                {/* Login Form */}
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-5 relative z-10"
                >
                  {/* Email Field */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="station-account"
                        className="font-label text-[13px] text-on-surface font-semibold"
                      >
                        Kitchen Staff Account
                      </label>
                      <span className="font-label text-[11px] text-primary uppercase font-bold">
                        Staff Only
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <AtSign className="absolute left-3.5 w-5 h-5 text-outline pointer-events-none" />
                      <input
                        id="station-account"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setAuthError(null);
                        }}
                        placeholder="kitchen-team@ecsad.local"
                        className="w-full h-13 pl-11 pr-4 bg-surface-container-low text-on-surface rounded-xl text-[14px] border border-outline-variant/40 focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Passcode Field */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="station-passcode"
                        className="font-label text-[13px] text-on-surface font-semibold"
                      >
                        Station Access Passcode
                      </label>
                      {authError && (
                        <span className="font-label text-[11px] text-error font-semibold">
                          Permission Denied
                        </span>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <Lock
                        className={`absolute left-3.5 w-5 h-5 pointer-events-none ${
                          authError ? 'text-error' : 'text-outline'
                        }`}
                      />
                      <input
                        id="station-passcode"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={passcode}
                        onChange={(e) => {
                          setPasscode(e.target.value);
                          setAuthError(null);
                        }}
                        placeholder="Enter Station Passcode"
                        className={`w-full h-13 pl-11 pr-12 rounded-xl text-[14px] focus:outline-none transition-all ${
                          authError
                            ? 'bg-error-container/30 text-error border border-error focus:ring-2 focus:ring-error/20'
                            : 'bg-surface-container-low text-on-surface border border-outline-variant/40 focus:bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20'
                        }`}
                      />
                      <button
                        type="button"
                        aria-label="Toggle password visibility"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className={`absolute right-2.5 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                          authError
                            ? 'text-error hover:bg-error-container/50'
                            : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                        }`}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {authError && (
                      <div className="flex items-center gap-1.5 mt-0.5 text-error text-[12px] font-medium">
                        <XCircle className="w-4 h-4 shrink-0" />
                        <span>
                          Incorrect email or passcode
                          (auth/invalid-login-credentials)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Keep Signed In Checkbox */}
                  <div className="flex items-center gap-3 pt-1">
                    <label className="relative flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={keepSignedIn}
                        onChange={(e) => setKeepSignedIn(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="w-6 h-6 rounded-lg bg-surface-container peer-checked:bg-primary flex items-center justify-center transition-colors">
                        <Check
                          className={`w-4 h-4 text-on-primary transition-opacity ${
                            keepSignedIn ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                      </div>
                      <span className="ml-3 text-[13px] text-on-surface font-medium">
                        Keep station signed in for defense session
                      </span>
                    </label>
                  </div>

                  {/* Submit Action Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full min-h-[52px] mt-1 px-4 py-3.5 rounded-full bg-primary-container hover:bg-primary text-on-primary font-label text-[16px] leading-[20px] font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-75"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Verifying Station...</span>
                      </>
                    ) : (
                      <>
                        <ChefHat className="w-5 h-5" />
                        <span>Sign In to Kitchen Board</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                {/* Quick Assist & Station Guide Card */}
                <div className="mt-7 p-4 rounded-xl bg-surface-container-low text-on-surface-variant flex items-start gap-3 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center shrink-0 text-primary">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-[12px] leading-relaxed">
                    <strong className="font-semibold text-on-surface block mb-0.5">
                      Need Kitchen Credentials?
                    </strong>
                    <p>
                      Ask your ECSAD Kitchen Lead or consult the printed station
                      guide affixed to prep stations.
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowGuide((prev) => !prev)}
                        className="font-label text-[11px] font-bold text-primary hover:underline"
                      >
                        {showGuide ? 'Hide Station Guide' : 'View Station Guide'}
                      </button>
                      {showGuide && (
                        <button
                          type="button"
                          onClick={fillStationGuideCredentials}
                          className="font-label text-[11px] font-bold text-on-primary-fixed bg-primary-fixed px-2.5 py-1 rounded-md hover:bg-primary-fixed-dim transition-colors"
                        >
                          Use Station 1 Credentials
                        </button>
                      )}
                    </div>
                    {showGuide && (
                      <div className="mt-2 p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/40 font-mono text-[11px] text-on-surface">
                        <div>Account: kitchen-team@ecsad.local</div>
                        <div>Passcode: ecsad2026</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Panelist Return Link */}
                <div className="mt-6 pt-4 flex justify-center relative z-10">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 font-label text-[13px] font-semibold text-primary hover:text-on-primary-fixed-variant px-4 py-2.5 rounded-full hover:bg-secondary-container transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Return to Panelist Kiosk Ordering</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="hidden lg:block lg:col-span-3" />
          </div>
        </div>
      </main>
    </div>
  );
}
