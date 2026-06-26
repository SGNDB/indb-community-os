import type {Metadata} from "next";
import {redirect} from "next/navigation";

import {VolunteerPageClient} from "@/components/volunteer/volunteer-page-client";
import {getSupportCampaigns} from "@/lib/data/support";
import {createClient} from "@/lib/supabase/server";

const copy = {
  ar: {
    metaTitle: "التطوع | I ❤️ NDB",
    metaDescription: "انضم إلى فرص تطوعية موثقة لخدمة نواذيبو مع فريق I ❤️ NDB.",
    eyebrow: "فرص تطوعية موثقة",
    heroTitle: "🙋 التطوع",
    heroSubtitle: "اصنع أثراً حقيقياً بوقتك ومهاراتك.\nكل ساعة تقدمها قد تغيّر حياة شخص أو تخدم مجتمعاً كاملاً.",
    startVolunteering: "ابدأ التطوع",
    learnMore: "تعرف أكثر",
    activeOpportunities: "فرص مفتوحة",
    volunteers: "متطوع",
    hoursContributed: "ساعات التطوع",
    completed: "مكتملة",
    featured: "فرصة مميزة",
    remaining: "متبقي",
    volunteersLower: "متطوع",
    organizedBy: "ينظمها",
    joinNow: "انضم الآن",
    share: "شارك الفرصة",
    categories: "الفئات",
    browseCategories: "تصفح فئات التطوع",
    opportunitiesLower: "فرصة",
    needed: "مطلوب",
    opportunities: "الفرص",
    searchPlaceholder: "ابحث عن فرصة تطوع...",
    newest: "الأحدث",
    popular: "الأكثر مشاركة",
    closingSoon: "تغلق قريباً",
    noResults: "لا توجد نتائج",
    noResultsHint: "حاول تغيير معايير البحث أو التصفية.",
    clearFilters: "مسح التصفية",
    whyVolunteer: "لماذا التطوع؟",
    whyVolunteerTitle: "كل ساعة تصنع فرقاً",
    makeImpact: "❤️ اصنع أثراً حقيقياً",
    makeImpactDesc: "ساهم في تحسين حياة الناس في نواذيبو من خلال وقتك ومهاراتك.",
    meetCommunity: "🤝 تعرف على مجتمعك",
    meetCommunityDesc: "اعمل مع أشخاص يهتمون بمستقبل مدينتك ويبذلون وقتهم من أجلها.",
    buildSkills: "📈 طور مهاراتك",
    buildSkillsDesc: "اكتسب خبرة عملية في التنظيم والتنسيق والعمل الجماعي.",
    strengthenCity: "🌍 قوِّ مدينتك",
    strengthenCityDesc: "كل ساعة تطوع تخلق تغييراً إيجابياً في نواذيبو.",
    communityImpact: "الأثر المجتمعي",
    ourImpact: "ما حققناه معاً",
    completedActivities: "نشاط مكتمل",
    peopleHelped: "شخص مستفيد",
    neighborhoodsServed: "حي مخدوم",
    stories: "قصص ملهمة",
    volunteerStories: "قصص المتطوعين",
    hoursLower: "ساعة",
    upcoming: "قادم",
    upcomingActivities: "الأنشطة القادمة",
    viewDetails: "عرض التفاصيل",
    noOpportunities: "لا توجد فرص تطوعية حالياً",
    noOpportunitiesHint: "تابعنا، ستُضاف فرص جديدة قريباً. يمكنك العودة لاحقاً أو متابعة صفحتنا على فيسبوك.",
    // Join modal
    joinTitle: "تأكيد الانضمام",
    joinSuccess: "تم التسجيل ✅",
    joinSuccessTitle: "تم تسجيل انضمامك بنجاح 🎉",
    joinSuccessMessage: "سيتم إشعارك بأي تحديثات تخص هذه الفرصة. شكراً لك على مبادرتك الرائعة.",
    backToOpportunities: "العودة للفرص",
    confirmJoin: "تأكيد الانضمام",
    joining: "جاري التسجيل...",
    loginHint: "سجّل الدخول لتسجيل الانضمام.",
    signIn: "تسجيل الدخول",
    close: "إغلاق",
    joinError: "حدث خطأ أثناء التسجيل. حاول مرة أخرى.",
    organizer: "المنظم",
    location: "الموقع",
    date: "التاريخ",
    duration: "المدة",
    volunteersNeeded: "المتطوعون المطلوبون",
    progress: "التقدم",
    skils: "المهارات المطلوبة",
    linkCopied: "تم نسخ الرابط",
    shareFailed: "تعذر المشاركة",
  },
  fr: {
    metaTitle: "Bénévolat | I ❤️ NDB",
    metaDescription: "Rejoignez des opportunités de bénévolat vérifiées pour servir Nouadhibou avec I ❤️ NDB.",
    eyebrow: "Opportunités vérifiées",
    heroTitle: "🙋 Bénévolat",
    heroSubtitle: "Créez un impact réel avec votre temps et vos compétences.\nChaque heure donnée peut changer une vie ou servir toute une communauté.",
    startVolunteering: "Commencer",
    learnMore: "En savoir plus",
    activeOpportunities: "Opportunités ouvertes",
    volunteers: "Bénévoles",
    hoursContributed: "Heures contribuées",
    completed: "Terminées",
    featured: "Opportunité vedette",
    remaining: "restants",
    volunteersLower: "bénévoles",
    organizedBy: "Organisé par",
    joinNow: "Rejoindre",
    share: "Partager",
    categories: "Catégories",
    browseCategories: "Parcourir les catégories",
    opportunitiesLower: "opportunités",
    needed: "besoin",
    opportunities: "Opportunités",
    searchPlaceholder: "Rechercher une opportunité...",
    newest: "Récent",
    popular: "Populaire",
    closingSoon: "Bientôt fin",
    noResults: "Aucun résultat",
    noResultsHint: "Essayez de modifier vos critères de recherche.",
    clearFilters: "Effacer les filtres",
    whyVolunteer: "Pourquoi être bénévole ?",
    whyVolunteerTitle: "Chaque heure compte",
    makeImpact: "❤️ Créez un impact réel",
    makeImpactDesc: "Aidez à améliorer la vie des gens à Nouadhibou avec votre temps et vos compétences.",
    meetCommunity: "🤝 Rencontrez votre communauté",
    meetCommunityDesc: "Travaillez avec des personnes qui se soucient de l'avenir de votre ville.",
    buildSkills: "📈 Développez vos compétences",
    buildSkillsDesc: "Acquérez une expérience pratique en organisation, coordination et travail d'équipe.",
    strengthenCity: "🌍 Renforcez votre ville",
    strengthenCityDesc: "Chaque heure de bénévolat crée un changement positif à Nouadhibou.",
    communityImpact: "Impact communautaire",
    ourImpact: "Ce que nous avons accompli ensemble",
    completedActivities: "Activités terminées",
    peopleHelped: "Personnes aidées",
    neighborhoodsServed: "Quartiers servis",
    stories: "Histoires inspirantes",
    volunteerStories: "Témoignages de bénévoles",
    hoursLower: "heures",
    upcoming: "À venir",
    upcomingActivities: "Activités à venir",
    viewDetails: "Voir détails",
    noOpportunities: "Aucune opportunité pour le moment",
    noOpportunitiesHint: "Suivez-nous, de nouvelles opportunités seront ajoutées bientôt. Revenez plus tard ou suivez notre page Facebook.",
    joinTitle: "Confirmer l'inscription",
    joinSuccess: "Inscrit ✅",
    joinSuccessTitle: "Inscription réussie 🎉",
    joinSuccessMessage: "Vous serez notifié de toute mise à jour concernant cette opportunité. Merci pour votre belle initiative.",
    backToOpportunities: "Retour aux opportunités",
    confirmJoin: "Confirmer l'inscription",
    joining: "Inscription...",
    loginHint: "Connectez-vous pour vous inscrire.",
    signIn: "Se connecter",
    close: "Fermer",
    joinError: "Une erreur s'est produite. Veuillez réessayer.",
    organizer: "Organisateur",
    location: "Lieu",
    date: "Date",
    duration: "Durée",
    volunteersNeeded: "Bénévoles requis",
    progress: "Progression",
    skils: "Compétences requises",
    linkCopied: "Lien copié",
    shareFailed: "Échec du partage",
  },
  en: {
    metaTitle: "Volunteering | I ❤️ NDB",
    metaDescription: "Join verified volunteer opportunities to serve Nouadhibou with I ❤️ NDB.",
    eyebrow: "Verified opportunities",
    heroTitle: "🙋 Volunteering",
    heroSubtitle: "Make a real impact with your time and skills.\nEvery hour you give can change a life or serve an entire community.",
    startVolunteering: "Start Volunteering",
    learnMore: "Learn more",
    activeOpportunities: "Open Opportunities",
    volunteers: "Volunteers",
    hoursContributed: "Hours Contributed",
    completed: "Completed",
    featured: "Featured Opportunity",
    remaining: "remaining",
    volunteersLower: "volunteers",
    organizedBy: "Organized by",
    joinNow: "Join Now",
    share: "Share",
    categories: "Categories",
    browseCategories: "Browse Categories",
    opportunitiesLower: "opportunities",
    needed: "needed",
    opportunities: "Opportunities",
    searchPlaceholder: "Search opportunities...",
    newest: "Newest",
    popular: "Most Popular",
    closingSoon: "Closing Soon",
    noResults: "No results found",
    noResultsHint: "Try changing your search or filter criteria.",
    clearFilters: "Clear filters",
    whyVolunteer: "Why Volunteer?",
    whyVolunteerTitle: "Every hour makes a difference",
    makeImpact: "❤️ Make Real Impact",
    makeImpactDesc: "Help improve lives in Nouadhibou with your time and skills.",
    meetCommunity: "🤝 Meet Your Community",
    meetCommunityDesc: "Work with people who care about the future of your city.",
    buildSkills: "📈 Build Skills",
    buildSkillsDesc: "Gain practical experience in organizing, coordinating, and teamwork.",
    strengthenCity: "🌍 Strengthen Your City",
    strengthenCityDesc: "Every volunteer hour creates positive change in Nouadhibou.",
    communityImpact: "Community Impact",
    ourImpact: "What we achieved together",
    completedActivities: "Completed Activities",
    peopleHelped: "People Helped",
    neighborhoodsServed: "Neighborhoods Served",
    stories: "Inspiring Stories",
    volunteerStories: "Volunteer Stories",
    hoursLower: "hours",
    upcoming: "Upcoming",
    upcomingActivities: "Upcoming Activities",
    viewDetails: "View Details",
    noOpportunities: "No opportunities right now",
    noOpportunitiesHint: "Follow us, new opportunities will be added soon. Check back later or follow our Facebook page.",
    joinTitle: "Confirm Joining",
    joinSuccess: "Registered ✅",
    joinSuccessTitle: "You're registered successfully 🎉",
    joinSuccessMessage: "You'll be notified of any updates about this opportunity. Thank you for your wonderful initiative.",
    backToOpportunities: "Back to opportunities",
    confirmJoin: "Confirm Join",
    joining: "Joining...",
    loginHint: "Sign in to register.",
    signIn: "Sign in",
    close: "Close",
    joinError: "An error occurred. Please try again.",
    organizer: "Organizer",
    location: "Location",
    date: "Date",
    duration: "Duration",
    volunteersNeeded: "Volunteers Needed",
    progress: "Progress",
    skils: "Skills Required",
    linkCopied: "Link copied",
    shareFailed: "Share failed",
  },
};

function labelsFor(locale: string) {
  return locale === "ar" ? copy.ar : locale === "fr" ? copy.fr : copy.en;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const labels = labelsFor(locale);
  return {
    title: labels.metaTitle,
    description: labels.metaDescription,
  };
}

export default async function VolunteerPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const labels = labelsFor(locale);
  const isRtl = ["ar", "ff", "snk"].includes(locale);

  const supabase = await createClient();
  const {data: {user}} = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const allCampaigns = await getSupportCampaigns();
  const campaigns = allCampaigns.filter((c) => c.status === "active");
  const totalVolunteers = campaigns.reduce((sum, c) => sum + c.volunteers_count, 0);

  const impactData = {
    totalVolunteers,
    volunteerHours: 0,
    completedActivities: allCampaigns.filter((c) => c.status === "completed").length,
    activeOpportunities: campaigns.length,
    peopleHelped: 0,
    neighborhoodsServed: 0,
    treesPlanted: 0,
    studentsSupported: 0,
    familiesHelped: 0,
  };

  return (
    <div className="space-y-7 pb-4 sm:space-y-8 sm:pb-6" dir={isRtl ? "rtl" : "ltr"}>
      <VolunteerPageClient
        locale={locale}
        isLoggedIn={true}
        isRtl={isRtl}
        campaigns={campaigns}
        labels={labels}
        impactData={impactData}
      />
    </div>
  );
}
