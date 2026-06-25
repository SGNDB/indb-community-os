"use client";

import {useState} from "react";
import {Heart} from "lucide-react";

import {DonationModal} from "@/components/support/donation-modal";


interface SupportContributionPanelProps {
  campaignId: string;
  campaignSlug: string;
  campaignTitle: string;
  campaignEmoji: string;
  locale: string;
  isLoggedIn: boolean;
}

const buttonLabel: Record<string, string> = {
  ar: "تبرع الآن",
  fr: "Faire un don",
  en: "Donate now",
};

const labelsForLocale: Record<string, Record<string, string>> = {
  ar: {
    donateTo: "تبرع إلى",
    stepAmount: "كم ترغب في التبرع؟",
    stepMethod: "اختر طريقة الدفع",
    stepReview: "تأكيد التبرع",
    amountLabel: "المبلغ (MRU)",
    amountPlaceholder: "أدخل مبلغ التبرع",
    chooseMethod: "طريقة الدفع",
    amount: "المبلغ:",
    reviewTitle: "مراجعة التبرع",
    reviewDesc: "يرجى مراجعة معلومات التبرع قبل الإرسال.",
    campaignLabel: "الحملة",
    methodLabel: "طريقة الدفع",
    estTime: "وقت التأكيد المتوقع",
    estTimeValue: "خلال 24 ساعة",
    confirmText: "أؤكد هذا التبرع",
    confirmButton: "تأكيد التبرع",
    submitting: "جاري الإرسال...",
    thankYou: "شكراً لمساهمتك ❤️",
    successMessage: "تم إرسال تبرعك بنجاح. سيظهر التبرع في الحملة بعد التحقق منه.",
    notificationHint: "ستصلك إشعارات عند تأكيد التبرع.",
    invalidAmount: "يرجى إدخال مبلغ صحيح أكبر من صفر",
    invalidInput: "الرجاء التحقق من المبلغ وطريقة الدفع.",
    serverError: "حدث خطأ أثناء الإرسال. حاول مرة أخرى.",
    loginRequired: "يرجى تسجيل الدخول أولاً للتبرع.",
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
    stepAmount: "Combien souhaitez-vous donner ?",
    stepMethod: "Choisir le paiement",
    stepReview: "Confirmer le don",
    amountLabel: "Montant (MRU)",
    amountPlaceholder: "Entrez le montant",
    chooseMethod: "Moyen de paiement",
    amount: "Montant :",
    reviewTitle: "Vérifier le don",
    reviewDesc: "Veuillez vérifier les informations avant d'envoyer.",
    campaignLabel: "Campagne",
    methodLabel: "Moyen de paiement",
    estTime: "Délai de confirmation estimé",
    estTimeValue: "Sous 24 heures",
    confirmText: "Je confirme ce don",
    confirmButton: "Confirmer le don",
    submitting: "Envoi en cours...",
    thankYou: "Merci pour votre don ❤️",
    successMessage: "Votre don a été envoyé avec succès. Il apparaîtra sur la campagne après vérification.",
    notificationHint: "Vous recevrez une notification lorsque le don sera confirmé.",
    invalidAmount: "Veuillez entrer un montant valide supérieur à zéro",
    invalidInput: "Veuillez vérifier le montant et le moyen de paiement.",
    serverError: "Une erreur s'est produite. Veuillez réessayer.",
    loginRequired: "Veuillez vous connecter pour faire un don.",
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
    stepAmount: "How much would you like to donate?",
    stepMethod: "Choose payment",
    stepReview: "Confirm donation",
    amountLabel: "Amount (MRU)",
    amountPlaceholder: "Enter donation amount",
    chooseMethod: "Payment method",
    amount: "Amount:",
    reviewTitle: "Review donation",
    reviewDesc: "Please review your donation details before submitting.",
    campaignLabel: "Campaign",
    methodLabel: "Payment method",
    estTime: "Estimated confirmation time",
    estTimeValue: "Within 24 hours",
    confirmText: "I confirm this donation",
    confirmButton: "Confirm donation",
    submitting: "Submitting...",
    thankYou: "Thank you for your donation ❤️",
    successMessage: "Your donation has been submitted successfully. It will appear in the campaign after verification.",
    notificationHint: "You will receive a notification once the donation is confirmed.",
    invalidAmount: "Please enter a valid amount greater than zero",
    invalidInput: "Please check the amount and payment method.",
    serverError: "An error occurred. Please try again.",
    loginRequired: "Please sign in to donate.",
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
  isLoggedIn,
}: SupportContributionPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const labels = labelsForLocale[locale] ?? labelsForLocale.en;

  return (
    <aside id="donate" className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-[0_10px_26px_rgba(12,31,44,0.06)] sm:p-4">
      {!isLoggedIn ? (
        <p className="mb-3 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">{labels.loginRequired}</p>
      ) : null}

      <button
        type="button"
        onClick={() => setModalOpen(true)}
        disabled={!isLoggedIn}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-black text-primary-foreground shadow-sm transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
      >
        <Heart size={19} />
        {buttonLabel[locale] ?? buttonLabel.en}
      </button>

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
