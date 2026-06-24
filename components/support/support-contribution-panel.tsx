"use client";

import {useMemo, useState} from "react";
import {CreditCard, Gift, HandHeart, ReceiptText, Upload, WalletCards, X} from "lucide-react";

import {recordSupportContributionAction} from "@/app/[locale]/server-actions";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Link} from "@/lib/i18n/routing";
import type {SupportPaymentReceiver} from "@/lib/data/support";
import {cn} from "@/lib/utils/cn";

interface SupportContributionPanelProps {
  campaignId: string;
  campaignSlug: string;
  locale: string;
  paymentReceivers: SupportPaymentReceiver[];
  t: {
    title: string;
    money: string;
    volunteer: string;
    materials: string;
    suggested: string;
    otherAmount: string;
    note: string;
    send: string;
    helpButton: string;
    materialPlaceholder: string;
    graatekButton: string;
    loginHint: string;
  };
  isLoggedIn: boolean;
}

const suggestedAmounts = [100, 500, 1000, 5000];

const methodCopy: Record<string, Record<string, string>> = {
  ar: {
    contributeNow: "ساهم الآن",
    modalTitle: "مساهمة مالية",
    amount: "المبلغ",
    method: "طريقة الدفع",
    instructions: "التعليمات",
    transactionId: "رقم العملية",
    transactionPlaceholder: "أدخل رقم العملية بعد الدفع",
    receipt: "صورة الوصل",
    receiptHint: "اختياري: ارفع لقطة شاشة للوصول لتسهيل التحقق.",
    pendingNote: "سيتم تسجيل المساهمة كقيد المراجعة حتى يؤكدها فريق I ❤️ NDB.",
    manualInstructions: "حوّل المبلغ إلى الحساب الرسمي، ثم أدخل رقم العملية وارفع الوصل إن توفر.",
    comingSoon: "قريباً",
    cardInstructions: "الدفع بالبطاقات سيتم عبر مزود دفع آمن فقط. لا ندخل أو نخزن أرقام البطاقات داخل I ❤️ NDB.",
    submitPending: "إرسال للمراجعة",
    close: "إغلاق",
  },
  fr: {
    contributeNow: "Contribuer",
    modalTitle: "Contribution financière",
    amount: "Montant",
    method: "Mode de paiement",
    instructions: "Instructions",
    transactionId: "ID de transaction",
    transactionPlaceholder: "Saisissez l'ID après le paiement",
    receipt: "Reçu",
    receiptHint: "Optionnel : ajoutez une capture du reçu pour faciliter la vérification.",
    pendingNote: "La contribution restera en attente jusqu'à vérification par l'équipe I ❤️ NDB.",
    manualInstructions: "Envoyez le montant au compte officiel, puis saisissez l'ID de transaction et le reçu si disponible.",
    comingSoon: "Bientôt disponible",
    cardInstructions: "Les cartes passeront uniquement par un prestataire sécurisé. I ❤️ NDB ne stocke jamais les numéros de carte.",
    submitPending: "Envoyer pour vérification",
    close: "Fermer",
  },
  en: {
    contributeNow: "Contribute now",
    modalTitle: "Financial contribution",
    amount: "Amount",
    method: "Payment method",
    instructions: "Instructions",
    transactionId: "Transaction ID",
    transactionPlaceholder: "Enter the transaction ID after payment",
    receipt: "Receipt screenshot",
    receiptHint: "Optional: upload a receipt screenshot to help admins verify faster.",
    pendingNote: "Your donation will stay pending until the I ❤️ NDB team verifies the payment.",
    manualInstructions: "Send the amount to the official receiver, then enter the transaction ID and upload the receipt if available.",
    comingSoon: "Coming soon",
    cardInstructions: "Cards must be handled by a secure payment provider only. I ❤️ NDB never stores raw card numbers.",
    submitPending: "Submit for review",
    close: "Close",
  },
};

function labelsFor(locale: string) {
  return methodCopy[locale] ?? methodCopy.en;
}

export function SupportContributionPanel({
  campaignId,
  campaignSlug,
  locale,
  paymentReceivers,
  t,
  isLoggedIn,
}: SupportContributionPanelProps) {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<SupportPaymentReceiver["method"]>("bankily");
  const labels = labelsFor(locale);
  const method = useMemo(
    () => paymentReceivers.find((item) => item.method === selectedMethod) ?? paymentReceivers[0],
    [paymentReceivers, selectedMethod],
  );
  const methodDisabled = method?.method === "card" ? !method.cardReady : !method?.configured;

  return (
    <aside className="space-y-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-[0_10px_26px_rgba(12,31,44,0.06)] sm:p-4">
      <h2 className="text-lg font-black sm:text-xl">{t.title}</h2>
      {!isLoggedIn ? (
        <p className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">{t.loginHint}</p>
      ) : null}

      <button
        type="button"
        onClick={() => setPaymentOpen(true)}
        disabled={!isLoggedIn}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-black text-primary-foreground shadow-sm transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
      >
        <WalletCards size={19} />
        {labels.contributeNow}
      </button>

      <form action={recordSupportContributionAction} className="rounded-2xl border border-border bg-muted/25 p-3">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="campaignId" value={campaignId} />
        <input type="hidden" name="campaignSlug" value={campaignSlug} />
        <input type="hidden" name="contributionType" value="volunteer" />
        <div className="mb-3 flex items-center gap-2 font-bold">
          <HandHeart size={18} className="text-primary" />
          {t.volunteer}
        </div>
        <Textarea name="message" placeholder={t.note} className="min-h-20 rounded-xl bg-card" />
        <Button type="submit" variant="outline" className="mt-3 w-full" disabled={!isLoggedIn}>
          {t.helpButton}
        </Button>
      </form>

      <form action={recordSupportContributionAction} className="rounded-2xl border border-border bg-muted/25 p-3">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="campaignId" value={campaignId} />
        <input type="hidden" name="campaignSlug" value={campaignSlug} />
        <input type="hidden" name="contributionType" value="materials" />
        <div className="mb-3 flex items-center gap-2 font-bold">
          <Gift size={18} className="text-primary" />
          {t.materials}
        </div>
        <Textarea name="message" placeholder={t.materialPlaceholder} className="min-h-20 rounded-xl bg-card" />
        <Button type="submit" variant="outline" className="mt-3 w-full" disabled={!isLoggedIn}>
          {t.send}
        </Button>
        <Link href="/fadla" className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary">
          {t.graatekButton}
        </Link>
      </form>

      {paymentOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/45 p-2 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
          <div className="max-h-[calc(100dvh-1rem)] w-full overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl sm:max-w-lg">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 p-4 backdrop-blur">
              <div>
                <p className="text-xs font-bold text-primary">{t.money}</p>
                <h3 className="text-xl font-black">{labels.modalTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
                aria-label={labels.close}
              >
                <X size={20} />
              </button>
            </div>

            <form action={recordSupportContributionAction} className="space-y-4 p-4">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="campaignId" value={campaignId} />
              <input type="hidden" name="campaignSlug" value={campaignSlug} />
              <input type="hidden" name="contributionType" value="money" />

              <section>
                <p className="mb-2 text-sm font-black">{labels.amount}</p>
                <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-4">
                  {suggestedAmounts.map((amount) => (
                    <label key={amount} className="cursor-pointer rounded-xl border border-border bg-background px-3 py-2 text-center text-sm font-bold has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary">
                      <input type="radio" name="amount" value={amount} className="sr-only" defaultChecked={amount === 500} />
                      {amount} MRU
                    </label>
                  ))}
                </div>
                <Input name="customAmount" inputMode="numeric" placeholder={t.otherAmount} className="mt-2 rounded-xl bg-background" />
              </section>

              <section>
                <p className="mb-2 text-sm font-black">{labels.method}</p>
                <div className="grid gap-2 min-[420px]:grid-cols-2">
                  {paymentReceivers.map((item) => {
                    const disabled = item.method === "card" ? !item.cardReady : !item.configured;
                    return (
                      <label
                        key={item.method}
                        className={cn(
                          "cursor-pointer rounded-2xl border bg-background p-3 transition has-[:checked]:border-primary has-[:checked]:bg-primary/10",
                          disabled ? "opacity-60" : "active:scale-[0.99]",
                        )}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={item.method}
                          className="sr-only"
                          checked={selectedMethod === item.method}
                          disabled={disabled}
                          onChange={() => setSelectedMethod(item.method)}
                        />
                        <span className="flex items-center gap-2 text-sm font-black">
                          {item.method === "card" ? <CreditCard size={17} /> : <WalletCards size={17} />}
                          {item.label}
                        </span>
                        {disabled ? <span className="mt-1 block text-xs font-bold text-muted-foreground">{labels.comingSoon}</span> : null}
                      </label>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-muted/30 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-black">
                  <ReceiptText size={17} className="text-primary" />
                  {labels.instructions}
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {method?.method === "card" ? labels.cardInstructions : labels.manualInstructions}
                </p>
                {method?.method !== "card" ? (
                  <div className="mt-3 rounded-xl bg-card p-3">
                    <p className="text-xs font-bold text-muted-foreground">{method?.receiverLabel}</p>
                    <p className="mt-1 break-words text-sm font-black">{method?.receiverValue}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{labels.pendingNote}</p>
                  </div>
                ) : null}
              </section>

              <section className={cn("space-y-3", methodDisabled && "pointer-events-none opacity-50")}>
                <label className="block space-y-1 text-sm font-bold">
                  {labels.transactionId}
                  <Input name="transactionId" placeholder={labels.transactionPlaceholder} className="bg-background" required={!methodDisabled} />
                </label>
                <label className="block space-y-2 rounded-2xl border border-dashed border-border bg-background p-3 text-sm font-bold">
                  <span className="flex items-center gap-2">
                    <Upload size={17} className="text-primary" />
                    {labels.receipt}
                  </span>
                  <input name="receipt" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm text-muted-foreground file:me-3 file:rounded-xl file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-bold file:text-primary" />
                  <span className="block text-xs font-medium leading-5 text-muted-foreground">{labels.receiptHint}</span>
                </label>
              </section>

              <Button type="submit" className="w-full" disabled={methodDisabled}>
                {methodDisabled ? labels.comingSoon : labels.submitPending}
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
