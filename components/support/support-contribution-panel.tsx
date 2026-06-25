"use client";

import {useMemo, useState} from "react";
import {Gift, HandHeart, WalletCards} from "lucide-react";

import {recordSupportContributionAction} from "@/app/[locale]/server-actions";
import {DonationModal} from "@/components/support/donation-modal";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {Link} from "@/lib/i18n/routing";

interface SupportContributionPanelProps {
  campaignId: string;
  campaignSlug: string;
  campaignTitle: string;
  campaignEmoji: string;
  locale: string;
  t: Record<string, string>;
  isLoggedIn: boolean;
}

const labelsForLocale: Record<string, Record<string, string>> = {
  ar: {
    donateTo: "تبرع إلى",
    stepAmount: "المبلغ",
    stepMethod: "طريقة الدفع",
    stepReview: "مراجعة",
    amountLabel: "المبلغ (MRU)",
    amountPlaceholder: "أدخل مبلغ التبرع",
    chooseMethod: "اختر طريقة الدفع",
    amount: "المبلغ:",
    reviewTitle: "تأكيد التبرع",
    reviewDesc: "يرجى مراجعة معلومات التبرع قبل الإرسال.",
    campaignLabel: "الحملة",
    methodLabel: "طريقة الدفع",
    estTime: "وقت التأكيد المتوقع",
    estTimeValue: "خلال 24 ساعة",
    confirmText: "أؤكد صحة هذه المعلومات وأوافق على إرسال التبرع.",
    confirmButton: "تأكيد التبرع",
    submitting: "جاري الإرسال...",
    thankYou: "شكراً لمساهمتك ❤️",
    successMessage: "تم إرسال تبرعك بنجاح. سيظهر في الحملة بعد التحقق.",
    notificationHint: "ستصلك إشعارات عند تأكيد التبرع.",
    invalidAmount: "يرجى إدخال مبلغ صحيح أكبر من صفر",
    invalidInput: "الرجاء التحقق من المبلغ وطريقة الدفع.",
    serverError: "حدث خطأ أثناء الإرسال. حاول مرة أخرى.",
    loginRequired: "يرجى تسجيل الدخول أولاً للمساهمة.",
    signIn: "تسجيل الدخول",
    close: "إغلاق",
    continue: "متابعة",
    youWillDonate: "سيتم التبرع بمبلغ",
    comingSoon: "قريباً",
    pmBankily: "تحويل عبر تطبيق Bankily",
    pmMasrivi: "تحويل عبر Masrivi",
    pmSedad: "دفع عبر Sedad",
    pmVisa: "بطاقة فيزا",
    pmMastercard: "بطاقة ماستركارد",
  },
  fr: {
    donateTo: "Faire un don à",
    stepAmount: "Montant",
    stepMethod: "Paiement",
    stepReview: "Confirmation",
    amountLabel: "Montant (MRU)",
    amountPlaceholder: "Entrez le montant",
    chooseMethod: "Choisissez un moyen de paiement",
    amount: "Montant :",
    reviewTitle: "Confirmer le don",
    reviewDesc: "Veuillez vérifier les informations avant d'envoyer.",
    campaignLabel: "Campagne",
    methodLabel: "Moyen de paiement",
    estTime: "Délai de confirmation estimé",
    estTimeValue: "Sous 24 heures",
    confirmText: "Je confirme ces informations et j'accepte d'envoyer le don.",
    confirmButton: "Confirmer le don",
    submitting: "Envoi en cours...",
    thankYou: "Merci pour votre don ❤️",
    successMessage: "Votre don a été envoyé avec succès. Il apparaîtra sur la campagne après vérification.",
    notificationHint: "Vous recevrez une notification lorsque le don sera confirmé.",
    invalidAmount: "Veuillez entrer un montant valide supérieur à zéro",
    invalidInput: "Veuillez vérifier le montant et le moyen de paiement.",
    serverError: "Une erreur s'est produite. Veuillez réessayer.",
    loginRequired: "Veuillez vous connecter pour contribuer.",
    signIn: "Se connecter",
    close: "Fermer",
    continue: "Continuer",
    youWillDonate: "Vous allez donner",
    comingSoon: "Bientôt disponible",
    pmBankily: "Transfert via l'application Bankily",
    pmMasrivi: "Transfert via Masrivi",
    pmSedad: "Paiement via Sedad",
    pmVisa: "Carte Visa",
    pmMastercard: "Carte Mastercard",
  },
  en: {
    donateTo: "Donate to",
    stepAmount: "Amount",
    stepMethod: "Payment",
    stepReview: "Review",
    amountLabel: "Amount (MRU)",
    amountPlaceholder: "Enter donation amount",
    chooseMethod: "Choose payment method",
    amount: "Amount:",
    reviewTitle: "Confirm donation",
    reviewDesc: "Please review your donation details before submitting.",
    campaignLabel: "Campaign",
    methodLabel: "Payment method",
    estTime: "Estimated confirmation time",
    estTimeValue: "Within 24 hours",
    confirmText: "I confirm this information and agree to submit the donation.",
    confirmButton: "Confirm donation",
    submitting: "Submitting...",
    thankYou: "Thank you for your donation ❤️",
    successMessage: "Your donation has been submitted successfully. It will appear in the campaign after verification.",
    notificationHint: "You will receive a notification once the donation is confirmed.",
    invalidAmount: "Please enter a valid amount greater than zero",
    invalidInput: "Please check the amount and payment method.",
    serverError: "An error occurred. Please try again.",
    loginRequired: "Please sign in to contribute.",
    signIn: "Sign in",
    close: "Close",
    continue: "Continue",
    youWillDonate: "You will donate",
    comingSoon: "Coming soon",
    pmBankily: "Transfer via Bankily app",
    pmMasrivi: "Transfer via Masrivi",
    pmSedad: "Pay via Sedad",
    pmVisa: "Visa card",
    pmMastercard: "Mastercard",
  },
};

export function SupportContributionPanel({
  campaignId,
  campaignSlug,
  campaignTitle,
  campaignEmoji,
  locale,
  t,
  isLoggedIn,
}: SupportContributionPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const labels = labelsForLocale[locale] ?? labelsForLocale.en;

  return (
    <aside id="donate" className="space-y-3 rounded-2xl border border-border/70 bg-card p-3.5 shadow-[0_10px_26px_rgba(12,31,44,0.06)] sm:p-4">
      <h2 className="text-lg font-black sm:text-xl">{t.title}</h2>
      {!isLoggedIn ? (
        <p className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">{t.loginHint}</p>
      ) : null}

      <button
        type="button"
        onClick={() => setModalOpen(true)}
        disabled={!isLoggedIn}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-black text-primary-foreground shadow-sm transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
      >
        <WalletCards size={19} />
        {labels.continue}
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

      <DonationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        campaignId={campaignId}
        campaignSlug={campaignSlug}
        campaignTitle={campaignTitle}
        campaignEmoji={campaignEmoji}
        locale={locale}
        isLoggedIn={isLoggedIn}
        labels={labels}
      />
    </aside>
  );
}
