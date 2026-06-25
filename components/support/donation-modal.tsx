"use client";

import {useActionState, useCallback, useEffect, useRef, useState} from "react";
import {ArrowLeft, Banknote, Check, CreditCard, Heart, Smartphone, Wallet, X} from "lucide-react";
import Link from "next/link";

import {submitDonation} from "@/components/support/donation-actions";
import {Button, buttonVariants} from "@/components/ui/button";
import {cn} from "@/lib/utils/cn";

const rtlLocales = ["ar", "ff", "snk"];

const STEP = {METHOD: 1, AMOUNT: 2, REVIEW: 3, CONFIRM: 4} as const;

type PaymentMethod = {
  method: "bankily" | "masrivi" | "sedad" | "visa" | "mastercard";
  label: string;
  description: string;
  enabled: boolean;
};

function formatNumber(n: string): string {
  const cleaned = n.replace(/[^\d]/g, "");
  if (!cleaned) return "";
  return Number(cleaned).toLocaleString();
}

function unformatNumber(s: string): number {
  return Number(s.replace(/[^\d]/g, "")) || 0;
}

const methodMeta: Record<string, {icon: React.ReactNode; ring: string}> = {
  bankily: {icon: <Smartphone size={22} />, ring: "ring-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"},
  masrivi: {icon: <Banknote size={22} />, ring: "ring-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"},
  sedad: {icon: <Wallet size={22} />, ring: "ring-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400"},
  visa: {icon: <CreditCard size={22} />, ring: "ring-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"},
  mastercard: {icon: <CreditCard size={22} />, ring: "ring-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400"},
};

interface DonationModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  campaignSlug: string;
  campaignTitle: string;
  campaignEmoji: string;
  locale: string;
  isLoggedIn: boolean;
  labels: Record<string, string>;
}

export function DonationModal({
  open,
  onClose,
  campaignId,
  campaignSlug,
  campaignTitle,
  campaignEmoji,
  locale,
  isLoggedIn,
  labels,
}: DonationModalProps) {
  const [step, setStep] = useState<number>(STEP.METHOD);
  const [amountStr, setAmountStr] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod["method"] | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const prevStepRef = useRef<number>(STEP.METHOD);
  const [animClass, setAnimClass] = useState("");

  const isRtl = rtlLocales.includes(locale);

  const paymentMethods: PaymentMethod[] = [
    {method: "bankily", label: "Bankily", description: labels.pmBankily, enabled: true},
    {method: "masrivi", label: "Masrivi", description: labels.pmMasrivi, enabled: true},
    {method: "sedad", label: "Sedad", description: labels.pmSedad, enabled: true},
    {method: "mastercard", label: "Mastercard", description: labels.pmMastercard, enabled: true},
    {method: "visa", label: "Visa", description: labels.pmVisa, enabled: false},
  ];

  const amount = unformatNumber(amountStr);
  const amountValid = amount > 0;
  const selectedMethodData = paymentMethods.find((m) => m.method === selectedMethod);

  const [state, formAction, isPending] = useActionState(submitDonation, null);

  useEffect(() => {
    if (state?.success) {
      setStep(STEP.CONFIRM);
    }
  }, [state]);

  useEffect(() => {
    if (open) {
      prevStepRef.current = STEP.METHOD;
      setStep(STEP.METHOD);
      setAmountStr("");
      setSelectedMethod(null);
      document.body.style.overflow = "hidden";
      setTimeout(() => modalRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const animateStep = useCallback((dir: "forward" | "backward") => {
    const start = dir === "forward"
      ? (isRtl ? "-translate-x-6 opacity-0" : "translate-x-6 opacity-0")
      : (isRtl ? "translate-x-6 opacity-0" : "-translate-x-6 opacity-0");
    setAnimClass(start);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimClass("translate-x-0 opacity-100");
      });
    });
  }, [isRtl]);

  const goToStep = useCallback((next: number, dir: "forward" | "backward") => {
    prevStepRef.current = step;
    setStep(next);
    animateStep(dir);
  }, [step, animateStep]);

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setAmountStr(formatNumber(raw));
  }, []);

  const handleClose = useCallback(() => {
    if (isPending) return;
    onClose();
  }, [isPending, onClose]);

  const handleBack = useCallback(() => {
    if (isPending) return;
    if (step === STEP.AMOUNT) goToStep(STEP.METHOD, "backward");
    else if (step === STEP.REVIEW) goToStep(STEP.AMOUNT, "backward");
  }, [step, isPending, goToStep]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setMounted(true));
    } else {
      setAnimClass("");
      setMounted(false);
    }
  }, [open]);

  useEffect(() => {
    if (step === STEP.AMOUNT) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [step]);

  useEffect(() => {
    if (step === STEP.CONFIRM) {
      setAnimClass("");
    }
  }, [step]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") { handleClose(); return; }
    if (e.key !== "Tab" || !modalRef.current) return;
    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
  }, [handleClose]);

  const stepTitles: Record<number, string> = {
    [STEP.METHOD]: labels.chooseMethod,
    [STEP.AMOUNT]: labels.stepAmount,
    [STEP.REVIEW]: labels.stepReview,
  };

  if (!open) return null;

  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3 backdrop-blur-sm" dir={isRtl ? "rtl" : "ltr"}>
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-2xl">
          <p className="text-lg font-black">{labels.loginRequired}</p>
          <a href={`/${locale}/login`} className={cn(buttonVariants(), "mt-4 w-full")}>
            {labels.signIn}
          </a>
          <button type="button" onClick={onClose} className="mt-2 w-full rounded-xl px-5 py-3 text-sm font-semibold hover:bg-muted">
            {labels.close}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={modalRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className={cn(
        "fixed inset-0 z-[100] flex flex-col transition-all duration-200 outline-none",
        "bg-background",
        "sm:items-center sm:justify-center sm:bg-black/45 sm:backdrop-blur-sm sm:p-4",
        mounted ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
      dir={isRtl ? "rtl" : "ltr"}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      {/* Sheet */}
      <div
        className={cn(
          "relative z-10 flex flex-col bg-background transition-all duration-300 ease-out",
          "h-dvh w-full",
          "sm:h-auto sm:max-h-[90dvh] sm:w-full sm:max-w-md sm:rounded-3xl sm:border sm:border-border sm:shadow-2xl",
          mounted ? "translate-y-0" : "translate-y-full sm:translate-y-0 sm:scale-95",
        )}
      >
        {/* Header */}
        <div
          className="shrink-0 grid grid-cols-3 items-center border-b border-border px-4 min-h-[3.75rem]"
          style={{paddingTop: "env(safe-area-inset-top, 0px)"}}
        >
          <div className="flex items-center">
            {step > STEP.METHOD ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isPending}
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted active:scale-90 transition disabled:opacity-30"
                aria-label={labels.back || "Back"}
              >
                <ArrowLeft size={20} className={isRtl ? "rotate-180" : ""} />
              </button>
            ) : null}
          </div>

          <h1 className="text-center text-sm font-bold text-foreground truncate px-2">
            {stepTitles[step] || ""}
          </h1>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted active:scale-90 transition disabled:opacity-30"
              aria-label={labels.close || "Close"}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto px-5 py-6 overscroll-contain">
          <div className={cn("transition-all duration-[250ms] ease-out", animClass)}>
            {/* Step 1: Method */}
            {step === STEP.METHOD ? (
              <div className={cn("space-y-5", isRtl && "text-right")}>
                <div>
                  <h2 className="text-lg font-black">{labels.chooseMethod}</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    {labels.chooseMethodHint}
                  </p>
                </div>

                <div className="space-y-3">
                  {paymentMethods.map((pm) => {
                    const meta = methodMeta[pm.method];
                    const isSelected = selectedMethod === pm.method;
                    return (
                      <button
                        key={pm.method}
                        type="button"
                        onClick={() => {
                          if (!pm.enabled) return;
                          setSelectedMethod(pm.method);
                          goToStep(STEP.AMOUNT, "forward");
                        }}
                        disabled={!pm.enabled}
                        className={cn(
                          "flex w-full items-center gap-4 rounded-2xl border-2 bg-card p-4 text-start transition-all duration-200 min-h-[4.5rem]",
                          isSelected
                            ? "border-primary bg-primary/[0.04] shadow-sm"
                            : "border-border hover:border-muted-foreground/30 hover:bg-muted/20 hover:shadow-sm",
                          !pm.enabled ? "cursor-not-allowed opacity-50" : "cursor-pointer active:scale-[0.98]",
                        )}
                      >
                        <span className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1",
                          meta?.ring || "bg-muted ring-border"
                        )}>
                          {meta?.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-foreground">{pm.label}</p>
                          <p className="mt-0.5 text-sm text-muted-foreground leading-snug">{pm.description}</p>
                        </div>
                        {isSelected ? (
                          <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                            <Check size={14} className="text-primary-foreground" />
                          </span>
                        ) : !pm.enabled ? (
                          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[0.7rem] font-bold text-muted-foreground uppercase tracking-wider">
                            {labels.comingSoon}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Step 2: Amount */}
            {step === STEP.AMOUNT ? (
              <div className={cn("space-y-6", isRtl && "text-right")}>
                <div className="text-center">
                  <p className="text-sm font-bold text-primary">{labels.donateTo} {campaignEmoji}</p>
                  <h2 className="mt-1.5 text-xl font-black text-foreground">{campaignTitle}</h2>
                </div>

                <div className="text-center">
                  <p className="text-sm font-bold text-muted-foreground mb-3">{labels.amountLabel}</p>
                  <div
                    className={cn(
                      "mx-auto flex max-w-[16rem] items-center gap-0 overflow-hidden rounded-2xl border-2 bg-card ring-primary/30 transition-all",
                      amountValid ? "border-primary" : "border-border focus-within:border-primary focus-within:ring-2"
                    )}
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      inputMode="numeric"
                      value={amountStr}
                      onChange={handleAmountChange}
                      placeholder={labels.amountPlaceholder}
                      className="min-w-0 flex-1 bg-transparent px-4 py-4 text-center text-3xl font-black outline-none [&::-webkit-inner-spin-button]:appearance-none"
                      autoFocus
                    />
                    <span className="px-4 text-base font-bold text-muted-foreground shrink-0">MRU</span>
                  </div>
                  {amountStr && !amountValid ? (
                    <p className="mt-2 text-sm font-bold text-destructive">{labels.invalidAmount}</p>
                  ) : null}
                  {amountValid ? (
                    <p className="mt-2 text-sm text-muted-foreground">{labels.youWillDonate} {amount.toLocaleString()} MRU</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Step 3: Review */}
            {step === STEP.REVIEW ? (
              <div className={cn("space-y-5", isRtl && "text-right")}>
                <div>
                  <h2 className="text-lg font-black">{labels.reviewTitle}</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{labels.reviewDesc}</p>
                </div>

                <div className="space-y-3 rounded-2xl bg-muted/40 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{labels.campaignLabel}</span>
                    <span className="text-sm font-bold">{campaignEmoji} {campaignTitle}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{labels.methodLabel}</span>
                    <span className="flex items-center gap-1.5 text-sm font-bold">
                      {selectedMethodData && methodMeta[selectedMethodData.method]?.icon}
                      {selectedMethodData?.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{labels.amountLabel}</span>
                    <span className="text-xl font-black">{amount.toLocaleString()} MRU</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-sm text-muted-foreground">{labels.estTime}</span>
                    <span className="text-sm font-bold">{labels.estTimeValue}</span>
                  </div>
                </div>

                {/* Hidden form for action — checkbox here, submit button below */}
                <form id="donation-form" action={formAction}>
                  <input type="hidden" name="campaignId" value={campaignId} />
                  <input type="hidden" name="campaignSlug" value={campaignSlug} />
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="amount" value={amount} />
                  <input type="hidden" name="paymentMethod" value={selectedMethod ?? ""} />

                  {state?.error === "unauthorized" ? (
                    <p className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">{labels.loginRequired}</p>
                  ) : null}
                  {state?.error === "invalid-amount" || state?.error === "invalid-payment" ? (
                    <p className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">{labels.invalidInput}</p>
                  ) : null}
                  {state?.error === "server-error" ? (
                    <p className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">{labels.serverError}</p>
                  ) : null}

                  <label className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition hover:bg-muted/20", isRtl && "flex-row-reverse")}>
                    <input type="checkbox" required className="mt-0.5 h-5 w-5 shrink-0 accent-primary rounded" />
                    <span className="text-sm leading-6">{labels.confirmText}</span>
                  </label>
                </form>
              </div>
            ) : null}

            {/* Step 4: Confirm / Success */}
            {step === STEP.CONFIRM ? (
              <div className={cn("space-y-6 py-8 text-center", isRtl && "text-right")}>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <Heart size={40} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">{labels.thankYou}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {labels.successMessage}
                  </p>
                  <p className="mt-5 rounded-2xl bg-muted/40 p-4 text-base font-bold">
                    {amount.toLocaleString()} MRU
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">{labels.notificationHint}</p>
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  <Link href={`/${locale}/campaigns`} className={cn(buttonVariants(), "h-14 w-full rounded-2xl text-base font-black")}>
                    {labels.backToCampaigns}
                  </Link>
                  <Button onClick={onClose} variant="outline" className="h-14 w-full rounded-2xl text-base font-black">
                    {labels.continueBrowsing}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Bottom Action */}
        {step > STEP.METHOD && step < STEP.CONFIRM ? (
          <div
            className="shrink-0 border-t border-border bg-card px-5 py-4"
            style={{paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))"}}
          >
            {step === STEP.AMOUNT ? (
              <Button
                type="button"
                onClick={() => goToStep(STEP.REVIEW, "forward")}
                disabled={!amountValid}
                className="h-14 w-full rounded-2xl text-base font-black"
              >
                {labels.continue}
              </Button>
            ) : null}
            {step === STEP.REVIEW ? (
              <Button
                type="submit"
                form="donation-form"
                disabled={isPending}
                className="h-14 w-full rounded-2xl text-base font-black"
              >
                {isPending ? labels.submitting : labels.confirmButton}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
