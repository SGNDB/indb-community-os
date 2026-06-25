"use client";

import {useActionState, useCallback, useEffect, useRef, useState} from "react";
import {ArrowLeft, Banknote, CreditCard, Heart, Wallet, X} from "lucide-react";
import Link from "next/link";

import {submitDonation} from "@/components/support/donation-actions";
import {Button, buttonVariants} from "@/components/ui/button";
import {cn} from "@/lib/utils/cn";

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

const methodIcons: Record<string, React.ReactNode> = {
  bankily: <Wallet size={22} />,
  masrivi: <Banknote size={22} />,
  sedad: <CreditCard size={22} />,
  visa: <CreditCard size={22} />,
  mastercard: <CreditCard size={22} />,
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
  const stepRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isRtl = locale === "ar";

  const paymentMethods: PaymentMethod[] = [
    {method: "bankily", label: "Bankily", description: labels.pmBankily, enabled: true},
    {method: "masrivi", label: "Masrivi", description: labels.pmMasrivi, enabled: true},
    {method: "sedad", label: "Sedad", description: labels.pmSedad, enabled: true},
    {method: "mastercard", label: "Mastercard", description: labels.pmMastercard, enabled: true},
    {method: "visa", label: "Visa", description: labels.pmVisa, enabled: false},
  ];

  const amount = unformatNumber(amountStr);
  const amountValid = amount > 0;
  const canProceedReview = amountValid;
  const selectedMethodData = paymentMethods.find((m) => m.method === selectedMethod);

  const [state, formAction, isPending] = useActionState(submitDonation, null);

  useEffect(() => {
    if (state?.success) {
      setStep(STEP.CONFIRM);
    }
  }, [state]);

  useEffect(() => {
    if (open) {
      setStep(STEP.METHOD);
      setAmountStr("");
      setSelectedMethod(null);
    }
  }, [open]);

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
    if (step === STEP.AMOUNT) setStep(STEP.METHOD);
    else if (step === STEP.REVIEW) setStep(STEP.AMOUNT);
  }, [step, isPending]);

  if (!open) return null;

  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 backdrop-blur-sm">
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
    <div className="fixed inset-0 z-50 flex items-end bg-black/45 p-2 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4" dir={isRtl ? "rtl" : "ltr"}>
      <div className="relative w-full overflow-hidden rounded-3xl border border-border bg-card shadow-2xl transition-all duration-300 sm:max-w-md">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            {step > STEP.METHOD ? (
              <button type="button" onClick={handleBack} disabled={isPending} className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted active:scale-95">
                <ArrowLeft size={18} className={isRtl ? "rotate-180" : ""} />
              </button>
            ) : null}
            <span className="text-sm text-muted-foreground">
              {step === STEP.METHOD ? labels.stepMethod : step === STEP.AMOUNT ? labels.stepAmount : step === STEP.REVIEW ? labels.stepReview : ""}
            </span>
          </div>
          <button type="button" onClick={handleClose} disabled={isPending} className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted active:scale-95">
            <X size={18} />
          </button>
        </div>

        <div ref={stepRef} className="overflow-y-auto p-5" style={{maxHeight: "min(80dvh, 32rem)"}}>
          {step === STEP.METHOD ? (
            <div className={cn("space-y-4", isRtl && "text-right")}>
              <div>
                <h2 className="text-xl font-black">{labels.chooseMethod}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{labels.chooseMethodHint}</p>
              </div>

              <div className="space-y-3">
                {paymentMethods.map((pm) => {
                  return (
                    <button
                      key={pm.method}
                      type="button"
                      onClick={() => {
                        if (!pm.enabled) return;
                        setSelectedMethod(pm.method);
                        setStep(STEP.AMOUNT);
                        setTimeout(() => inputRef.current?.focus(), 300);
                      }}
                      disabled={!pm.enabled}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-2xl border-2 bg-background p-4 text-start transition-all duration-200 active:scale-[0.98]",
                        "border-border hover:border-muted-foreground/30 hover:shadow-sm",
                        !pm.enabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                      )}
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                        {methodIcons[pm.method]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-black">{pm.label}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{pm.description}</p>
                      </div>
                      {!pm.enabled ? (
                        <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                          {labels.comingSoon}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

            </div>
          ) : null}

          {step === STEP.AMOUNT ? (
            <div className={cn("space-y-5 text-center", isRtl && "text-right")}>
              <div>
                <p className="text-sm font-bold text-primary">{labels.donateTo} {campaignEmoji}</p>
                <h2 className="mt-1 text-2xl font-black">{campaignTitle}</h2>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-muted-foreground">{labels.amountLabel}</p>
                <div className="mx-auto flex max-w-[18rem] items-center gap-0 overflow-hidden rounded-2xl border-2 border-border bg-background ring-primary/30 focus-within:border-primary focus-within:ring-2">
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    value={amountStr}
                    onChange={handleAmountChange}
                    placeholder={labels.amountPlaceholder}
                    className="min-w-0 flex-1 bg-transparent px-5 py-4 text-center text-3xl font-black outline-none [&::-webkit-inner-spin-button]:appearance-none"
                    autoFocus
                  />
                  <span className="px-5 text-lg font-bold text-muted-foreground">MRU</span>
                </div>
                {amountStr && !amountValid ? (
                  <p className="text-sm font-bold text-destructive">{labels.invalidAmount}</p>
                ) : null}
                {amountValid ? (
                  <p className="text-sm text-muted-foreground">{labels.youWillDonate} {amount.toLocaleString()} MRU</p>
                ) : null}
              </div>

              <Button
                type="button"
                onClick={() => setStep(STEP.REVIEW)}
                disabled={!canProceedReview}
                className="h-14 w-full rounded-2xl text-base font-black"
              >
                {labels.continue}
              </Button>
            </div>
          ) : null}

          {step === STEP.REVIEW ? (
            <div className={cn("space-y-5", isRtl && "text-right")}>
              <div>
                <h2 className="text-xl font-black">{labels.reviewTitle}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{labels.reviewDesc}</p>
              </div>

              <div className="space-y-3 rounded-2xl bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{labels.campaignLabel}</span>
                  <span className="text-sm font-black">{campaignEmoji} {campaignTitle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{labels.methodLabel}</span>
                  <span className="flex items-center gap-1.5 text-sm font-black">
                    {selectedMethodData ? methodIcons[selectedMethodData.method] : null}
                    {selectedMethodData?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{labels.amountLabel}</span>
                  <span className="text-lg font-black">{amount.toLocaleString()} MRU</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm text-muted-foreground">{labels.estTime}</span>
                  <span className="text-sm font-bold">{labels.estTimeValue}</span>
                </div>
              </div>

              <form action={formAction} className="space-y-4">
                <input type="hidden" name="campaignId" value={campaignId} />
                <input type="hidden" name="campaignSlug" value={campaignSlug} />
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="amount" value={amount} />
                <input type="hidden" name="paymentMethod" value={selectedMethod ?? ""} />

                {state?.error === "unauthorized" ? (
                  <p className="rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">{labels.loginRequired}</p>
                ) : null}
                {state?.error === "invalid-amount" || state?.error === "invalid-payment" ? (
                  <p className="rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">{labels.invalidInput}</p>
                ) : null}
                {state?.error === "server-error" ? (
                  <p className="rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive">{labels.serverError}</p>
                ) : null}

                <label className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition", isRtl && "flex-row-reverse")}>
                  <input type="checkbox" required className="mt-0.5 h-5 w-5 shrink-0 accent-primary" />
                  <span className="text-sm leading-6">{labels.confirmText}</span>
                </label>

                <Button type="submit" disabled={isPending} className="h-14 w-full rounded-2xl text-base font-black">
                  {isPending ? labels.submitting : labels.confirmButton}
                </Button>
              </form>
            </div>
          ) : null}

          {step === STEP.CONFIRM ? (
            <div className={cn("space-y-5 py-8 text-center", isRtl && "text-right")}>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Heart size={40} className="text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-black">{labels.thankYou}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {labels.successMessage}
                </p>
                <p className="mt-4 rounded-2xl bg-muted/30 p-4 text-sm font-bold">
                  {amount.toLocaleString()} MRU
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{labels.notificationHint}</p>
              </div>
              <div className="flex flex-col gap-2">
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
    </div>
  );
}
