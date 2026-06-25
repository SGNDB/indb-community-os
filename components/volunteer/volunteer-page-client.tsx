"use client";

import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Clock,
  Globe,
  HandHeart,
  Heart,
  HeartHandshake,
  Leaf,
  MapPin,
  Search,
  Share2,
  Sparkles,
  Trophy,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import {toast} from "sonner";

import {Button, buttonVariants} from "@/components/ui/button";
import {cn} from "@/lib/utils/cn";
import {VolunteerJoinModal} from "@/components/volunteer/volunteer-join-modal";

const rtlLocales = ["ar", "ff", "snk"];

const formatter = new Intl.NumberFormat("fr-MR");

type VolunteerOpportunity = {
  id: string;
  slug: string;
  emoji: string;
  title: string;
  description: string;
  organizer: string;
  location: string;
  date: string;
  duration: string;
  volunteersNeeded: number;
  volunteersJoined: number;
  category: string;
  image: string;
};

const categories = [
  {key: "environment", emoji: "🧹", labelAr: "البيئة والنظافة", labelFr: "Environnement & Propreté", labelEn: "Environment & Cleanliness", color: "from-emerald-500/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-400"},
  {key: "education", emoji: "🎒", labelAr: "التعليم", labelFr: "Éducation", labelEn: "Education", color: "from-blue-500/20 to-blue-500/5 text-blue-600 dark:text-blue-400"},
  {key: "health", emoji: "🏥", labelAr: "الصحة", labelFr: "Santé", labelEn: "Health", color: "from-red-500/20 to-red-500/5 text-red-600 dark:text-red-400"},
  {key: "families", emoji: "🍲", labelAr: "دعم الأسر", labelFr: "Soutien aux familles", labelEn: "Family Support", color: "from-amber-500/20 to-amber-500/5 text-amber-600 dark:text-amber-400"},
  {key: "community", emoji: "👥", labelAr: "خدمة المجتمع", labelFr: "Service communautaire", labelEn: "Community Service", color: "from-purple-500/20 to-purple-500/5 text-purple-600 dark:text-purple-400"},
  {key: "youth", emoji: "⚽", labelAr: "الشباب والرياضة", labelFr: "Jeunesse & Sports", labelEn: "Youth & Sports", color: "from-cyan-500/20 to-cyan-500/5 text-cyan-600 dark:text-cyan-400"},
];

const whyCards = [
  {icon: Heart, colors: "bg-rose-500/10 text-rose-500"},
  {icon: Users, colors: "bg-blue-500/10 text-blue-500"},
  {icon: BookOpen, colors: "bg-emerald-500/10 text-emerald-500"},
  {icon: Globe, colors: "bg-violet-500/10 text-violet-500"},
];

const stories = [
  {nameAr: "أحمد ولد محمد", nameFr: "Ahmed Ould Mohamed", nameEn: "Ahmed Ould Mohamed", activityAr: "تنظيف شاطئ نواذيبو", activityFr: "Nettoyage de la plage de Nouadhibou", activityEn: "Nouadhibou Beach Cleanup", hours: 48, quoteAr: "المشاركة في تنظيف المدينة أعطتني شعوراً بالفخر. كل ساعة قضيتها مع الفريق كانت استثماراً في مستقبل نواذيبو.", quoteFr: "Participer au nettoyage de la ville m'a rendu fier. Chaque heure passée avec l'équipe était un investissement pour l'avenir de Nouadhibou.", quoteEn: "Participating in cleaning the city made me proud. Every hour with the team was an investment in Nouadhibou's future.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face"},
  {nameAr: "فاطمة منت الشيخ", nameFr: "Fatima Mint Cheikh", nameEn: "Fatima Mint Cheikh", activityAr: "دروس تقوية للأطفال", activityFr: "Cours de soutien pour enfants", activityEn: "Tutoring for Children", hours: 72, quoteAr: "تعليم الأطفال حرف واحد قد يغير مستقبلهم. أنا فخورة بأني جزء من هذه المبادرة.", quoteFr: "Enseigner une lettre aux enfants peut changer leur avenir. Je suis fière de faire partie de cette initiative.", quoteEn: "Teaching a single letter can change a child's future. I'm proud to be part of this initiative.", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face"},
  {nameAr: "سالم ولد عبد الله", nameFr: "Salem Ould Abdallah", nameEn: "Salem Ould Abdallah", activityAr: "حملة التوعية الصحية", activityFr: "Campagne de sensibilisation sanitaire", activityEn: "Health Awareness Campaign", hours: 36, quoteAr: "نشر الوعي الصحي بين الجيران كان تجربة رائعة. الناس بحاجة للمعلومة أكثر مما نتصور.", quoteFr: "Sensibiliser les voisins à la santé était une expérience formidable. Les gens ont besoin d'information plus qu'on ne le pense.", quoteEn: "Spreading health awareness among neighbors was a great experience. People need information more than we imagine.", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face"},
];

const upcomingActivities = [
  {dateAr: "السبت 28 يونيو", dateFr: "Samedi 28 juin", dateEn: "Saturday, June 28", location: "حي أزويرات", remainingPlaces: 12, organizer: "I ❤️ NDB", titleAr: "حملة نظافة الأحياء", titleFr: "Campagne de nettoyage des quartiers", titleEn: "Neighborhood Cleanup Campaign"},
  {dateAr: "الأحد 29 يونيو", dateFr: "Dimanche 29 juin", dateEn: "Sunday, June 29", location: "مدرسة الأمل", remainingPlaces: 8, organizer: "I ❤️ NDB", titleAr: "دروس تقوية في الرياضيات", titleFr: "Cours de soutien en maths", titleEn: "Math Tutoring Session"},
  {dateAr: "السبت 5 يوليو", dateFr: "Samedi 5 juillet", dateEn: "Saturday, July 5", location: "المركز الصحي", remainingPlaces: 15, organizer: "I ❤️ NDB", titleAr: "فحص طبي مجاني", titleFr: "Examen médical gratuit", titleEn: "Free Medical Checkup"},
  {dateAr: "الأحد 6 يوليو", dateFr: "Dimanche 6 juillet", dateEn: "Sunday, July 6", location: "ملعب المدينة", remainingPlaces: 20, organizer: "I ❤️ NDB", titleAr: "بطولة كرة القدم", titleFr: "Tournoi de football", titleEn: "Football Tournament"},
];

interface VolunteerPageClientProps {
  locale: string;
  isLoggedIn: boolean;
  isRtl: boolean;
  campaigns: Array<{
    id: string;
    slug: string;
    emoji: string;
    title: string;
    description: string;
    organizer: string;
    location?: string;
    date?: string;
    duration?: string;
    volunteersNeeded?: number;
    volunteers_count: number;
    category?: string;
  }>;
  labels: Record<string, string>;
  impactData: {
    totalVolunteers: number;
    volunteerHours: number;
    completedActivities: number;
    activeOpportunities: number;
    peopleHelped: number;
    neighborhoodsServed: number;
    treesPlanted: number;
    studentsSupported: number;
    familiesHelped: number;
  };
}

function CountUp({value, duration = 2000}: {value: number; duration?: number}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      {threshold: 0.3},
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  return <span ref={ref}>{formatter.format(count)}</span>;
}

export function VolunteerPageClient({
  locale,
  isLoggedIn,
  isRtl,
  campaigns,
  labels,
  impactData,
}: VolunteerPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [joinTarget, setJoinTarget] = useState<VolunteerOpportunity | null>(null);
  const [categoriesCount, setCategoriesCount] = useState<Record<string, {active: number; needed: number}>>({});

  // Animate counters on scroll
  const [countersVisible, setCountersVisible] = useState(false);
  const countersRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setCountersVisible(true); observer.disconnect(); } },
      {threshold: 0.2},
    );
    if (countersRef.current) observer.observe(countersRef.current);
    return () => observer.disconnect();
  }, []);

  // Convert campaigns to volunteer opportunities
  const opportunities: VolunteerOpportunity[] = useMemo(() => {
    return campaigns.map((c) => {
      const catMap: Record<string, string> = {
        water: "environment", education: "education", health: "health",
        families: "families", "clean-nouadhibou": "environment", "youth": "youth",
      };
      const catKey = catMap[c.slug] || "community";
      return {
        id: c.id,
        slug: c.slug,
        emoji: c.emoji,
        title: c.title,
        description: c.description,
        organizer: c.organizer,
        location: c.location || "نواذيبو",
        date: c.date || c.date || "قريباً",
        duration: c.duration || "مرن",
        volunteersNeeded: c.volunteersNeeded || Math.max(5, c.volunteers_count * 2),
        volunteersJoined: c.volunteers_count,
        category: catKey,
        image: `https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&h=400&fit=crop&q=80`,
      };
    });
  }, [campaigns]);

  // Compute category counts
  useEffect(() => {
    const counts: Record<string, {active: number; needed: number}> = {};
    for (const cat of categories) {
      const opps = opportunities.filter((o) => o.category === cat.key);
      counts[cat.key] = {
        active: opps.length,
        needed: opps.reduce((sum, o) => sum + o.volunteersNeeded, 0),
      };
    }
    setCategoriesCount(counts);
  }, [opportunities]);

  // Featured = first opportunity
  const featured = opportunities[0] ?? null;

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = [...opportunities];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((o) => o.title.toLowerCase().includes(q) || o.description.toLowerCase().includes(q) || o.location.toLowerCase().includes(q));
    }
    if (activeCategory) {
      list = list.filter((o) => o.category === activeCategory);
    }
    if (sortBy === "popular") list.sort((a, b) => b.volunteersJoined - a.volunteersJoined);
    else if (sortBy === "closing") list.sort((a, b) => a.volunteersNeeded - a.volunteersNeeded);
    else list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [opportunities, searchQuery, activeCategory, sortBy]);

  const featuredData: VolunteerOpportunity | null = filtered.length > 0 ? filtered[0] : null;

  const handleJoinAction = useCallback(async (opportunityId: string) => {
    // In production this would call a server action.
    // For now we simulate success since the DB doesn't have a volunteer_applications table yet.
    await new Promise((r) => setTimeout(r, 800));
    return {success: true};
  }, []);

  const handleShare = useCallback(async (title: string, text: string, url: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({title, text, url});
      } else {
        await navigator.clipboard.writeText(url);
        toast.success(labels.linkCopied || "Link copied");
      }
    } catch {
      if (typeof navigator !== "undefined" && !navigator.share) {
        toast.error(labels.shareFailed || "Unable to share");
      }
    }
  }, [labels]);

  const catLabel = (cat: typeof categories[0]) => {
    if (locale === "ar") return cat.labelAr;
    if (locale === "fr") return cat.labelFr;
    return cat.labelEn;
  };

  const handleCategoryClick = (key: string) => {
    setActiveCategory(activeCategory === key ? null : key);
    document.getElementById("active-opportunities")?.scrollIntoView({behavior: "smooth"});
  };

  const storyForLocale = (s: typeof stories[0], field: "name" | "activity" | "quote") => {
    const key = field as string;
    const value = (locale === "ar" ? s[`${key}Ar` as keyof typeof s] : locale === "fr" ? s[`${key}Fr` as keyof typeof s] : s[`${key}En` as keyof typeof s]) || "";
    return String(value);
  };

  const activityForLocale = (a: typeof upcomingActivities[0], field: "date" | "title") => {
    if (locale === "ar") return a[`${field}Ar` as keyof typeof a] as string;
    if (locale === "fr") return a[`${field}Fr` as keyof typeof a] as string;
    return a[`${field}En` as keyof typeof a] as string;
  };

  return (
    <>
      {/* ================================================================ */}
      {/* HERO SECTION */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-[0_12px_34px_rgba(8,33,56,0.06)]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] to-transparent pointer-events-none" />
        <button
          type="button"
          onClick={() => handleShare(labels.heroTitle, labels.heroSubtitle, window.location.href)}
          className="absolute top-3 end-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow-xs backdrop-blur-sm hover:bg-background hover:text-foreground active:scale-90 transition"
          aria-label={labels.share}
        >
          <Share2 size={15} />
        </button>
        <div className="relative px-5 py-7 sm:px-7 sm:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary mb-4">
                <Sparkles size={14} />
                {labels.eyebrow}
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl leading-tight">
                {labels.heroTitle}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
                {labels.heroSubtitle}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="#active-opportunities" className={cn(buttonVariants(), "h-13 rounded-2xl px-7 text-sm font-black gap-2")}>
                  <HandHeart size={18} />
                  {labels.startVolunteering}
                </Link>
                <Link href="#why-volunteer" className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-7 text-sm font-bold hover:bg-muted transition">
                  {labels.learnMore}
                </Link>
              </div>
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-2 gap-2.5 sm:min-w-72">
              {[
                {icon: Sparkles, value: impactData.activeOpportunities, label: labels.activeOpportunities},
                {icon: UsersRound, value: impactData.totalVolunteers, label: labels.volunteers},
                {icon: Clock, value: impactData.volunteerHours, label: labels.hoursContributed},
                {icon: Trophy, value: impactData.completedActivities, label: labels.completed},
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-muted/40 p-3.5 sm:p-4">
                  <stat.icon size={18} className="text-primary" />
                  <p className="mt-2 text-xl font-black sm:text-2xl">{formatter.format(stat.value)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FEATURED OPPORTUNITY */}
      {/* ================================================================ */}
      {featured ? (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wider">{labels.featured}</p>
              <h2 className="text-lg font-black">{featured.title}</h2>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-[0_12px_34px_rgba(8,33,56,0.06)]">
            <div className="flex flex-col lg:flex-row">
              {/* Image */}
              <div className="relative h-52 shrink-0 lg:h-auto lg:w-80 xl:w-96 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden">
                <span className="text-7xl opacity-60">{featured.emoji}</span>
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
              </div>
              {/* Content */}
              <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
                <div className="space-y-3">
                  <p className="text-sm leading-6 text-muted-foreground line-clamp-2">{featured.description}</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground"><MapPin size={14} />{featured.location}</span>
                    <span className="flex items-center gap-1.5 text-muted-foreground"><CalendarDays size={14} />{featured.date}</span>
                    <span className="flex items-center gap-1.5 text-muted-foreground"><Clock size={14} />{featured.duration}</span>
                    <span className="flex items-center gap-1.5 text-muted-foreground"><Users size={14} />{featured.volunteersNeeded - featured.volunteersJoined} {labels.remaining}</span>
                  </div>
                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className="text-muted-foreground">{featured.volunteersJoined}/{featured.volunteersNeeded} {labels.volunteersLower}</span>
                      <span className="text-primary">{Math.round((featured.volunteersJoined / featured.volunteersNeeded) * 100)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{width: `${Math.min(100, (featured.volunteersJoined / featured.volunteersNeeded) * 100)}%`}} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <BadgeCheck size={13} className="text-primary" />
                    {labels.organizedBy} <span className="font-bold text-foreground">{featured.organizer}</span>
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button onClick={() => setJoinTarget(featured)} className="h-12 rounded-2xl px-6 text-sm font-black gap-2">
                    <HeartHandshake size={17} />
                    {labels.joinNow}
                  </Button>
                  <Button variant="outline" onClick={() => handleShare(featured.title, featured.description, `/${locale}/campaigns/${featured.slug}`)} className="h-12 rounded-2xl px-6 text-sm font-bold gap-2">
                    <Share2 size={17} />
                    {labels.share}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ================================================================ */}
      {/* CATEGORIES */}
      {/* ================================================================ */}
      <section>
        <div className="mb-4">
          <p className="text-xs font-bold text-primary uppercase tracking-wider">{labels.categories}</p>
          <h2 className="text-lg font-black">{labels.browseCategories}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat) => {
            const count = categoriesCount[cat.key] || {active: 0, needed: 0};
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => handleCategoryClick(cat.key)}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all duration-200 min-h-[7.5rem]",
                  isActive
                    ? "border-primary bg-primary/[0.04] shadow-sm"
                    : "border-border bg-card hover:border-muted-foreground/30 hover:shadow-sm active:scale-[0.97]",
                )}
              >
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br", cat.color)}>
                  <span className="text-lg">{cat.emoji}</span>
                </span>
                <span className="text-sm font-bold leading-tight">{catLabel(cat)}</span>
                <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider">
                  {count.active} {labels.opportunitiesLower} · {count.needed} {labels.needed}
                </span>
                {isActive ? (
                  <span className="absolute -top-1.5 -end-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <X size={11} className="text-primary-foreground" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      {/* ================================================================ */}
      {/* SEARCH & FILTERS */}
      {/* ================================================================ */}
      <section id="active-opportunities" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-wider">{labels.opportunities}</p>
            <h2 className="text-lg font-black">{labels.activeOpportunities}</h2>
          </div>
        </div>

        <div className="sticky top-22 z-20 -mx-3 px-3 py-2 sm:-mx-4 sm:px-4" style={{background: "var(--background)"}}>
          <div className="flex flex-col gap-2 sm:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={labels.searchPlaceholder}
                className="h-11 w-full rounded-2xl border border-border bg-card pe-4 ps-10 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition"
              />
              {searchQuery ? (
                <button onClick={() => setSearchQuery("")} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={15} />
                </button>
              ) : null}
            </div>
            {/* Sort */}
            <div className="flex gap-2">
              {[
                {key: "newest", label: labels.newest},
                {key: "popular", label: labels.popular},
                {key: "closing", label: labels.closingSoon},
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSortBy(opt.key)}
                  className={cn(
                    "h-11 rounded-2xl border-2 px-4 text-xs font-bold transition whitespace-nowrap",
                    sortBy === opt.key
                      ? "border-primary bg-primary/[0.04] text-primary"
                      : "border-border bg-card hover:border-muted-foreground/30",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Opportunities Grid */}
        {filtered.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((opp) => {
              const progress = opp.volunteersNeeded > 0 ? Math.round((opp.volunteersJoined / opp.volunteersNeeded) * 100) : 0;
              const cat = categories.find((c) => c.key === opp.category);
              return (
                <article
                  key={opp.id}
                  className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_8px_22px_rgba(8,33,56,0.05)] transition-all duration-200 hover:shadow-[0_14px_36px_rgba(8,33,56,0.1)] hover:-translate-y-0.5"
                >
                  {/* Category badge */}
                  <div className="absolute top-3 start-3 z-10">
                    <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-[0.65rem] font-bold shadow-xs backdrop-blur-sm">
                      {cat?.emoji} {cat ? catLabel(cat) : ""}
                    </span>
                  </div>

                  {/* Image area */}
                  <div className="relative h-36 bg-gradient-to-br from-primary/[0.06] to-primary/[0.02] flex items-center justify-center overflow-hidden">
                    <span className="text-5xl transition-transform duration-300 group-hover:scale-110">{opp.emoji}</span>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-black text-foreground">{opp.title}</h3>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground line-clamp-2">{opp.description}</p>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin size={12} />{opp.location}</span>
                      <span className="flex items-center gap-1"><CalendarDays size={12} />{opp.date}</span>
                      <span className="flex items-center gap-1"><Clock size={12} />{opp.duration}</span>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold mb-1">
                        <span className="text-muted-foreground">{opp.volunteersJoined}/{opp.volunteersNeeded} {labels.volunteersLower}</span>
                        <span className="text-primary">{progress}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{width: `${progress}%`}} />
                      </div>
                    </div>

                    {/* Organizer + Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">{labels.organizedBy} <span className="font-bold text-foreground">{opp.organizer}</span></span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleShare(opp.title, opp.description, `/${locale}/campaigns/${opp.slug}`)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground active:scale-90 transition"
                          aria-label={labels.share}
                        >
                          <Share2 size={15} />
                        </button>
                        <Button onClick={() => setJoinTarget(opp)} className="h-10 rounded-xl px-4 text-xs font-black gap-1.5">
                          <HeartHandshake size={15} />
                          {labels.joinNow}
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-border/70 bg-card p-10 text-center">
            <span className="text-4xl">🔍</span>
            <p className="mt-4 text-lg font-black">{labels.noResults}</p>
            <p className="mt-1 text-sm text-muted-foreground">{labels.noResultsHint}</p>
            {(searchQuery || activeCategory) ? (
              <Button
                variant="outline"
                onClick={() => { setSearchQuery(""); setActiveCategory(null); }}
                className="mt-4 h-11 rounded-xl px-5 text-sm font-bold"
              >
                {labels.clearFilters}
              </Button>
            ) : null}
          </div>
        )}
      </section>

      {/* ================================================================ */}
      {/* WHY VOLUNTEER */}
      {/* ================================================================ */}
      <section id="why-volunteer">
        <div className="mb-4">
          <p className="text-xs font-bold text-primary uppercase tracking-wider">{labels.whyVolunteer}</p>
          <h2 className="text-lg font-black">{labels.whyVolunteerTitle}</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {icon: Heart, title: labels.makeImpact, desc: labels.makeImpactDesc},
            {icon: Users, title: labels.meetCommunity, desc: labels.meetCommunityDesc},
            {icon: BookOpen, title: labels.buildSkills, desc: labels.buildSkillsDesc},
            {icon: Globe, title: labels.strengthenCity, desc: labels.strengthenCityDesc},
          ].map((card, i) => (
            <div key={i} className="group rounded-2xl border border-border/70 bg-card p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 transition-transform duration-200 group-hover:scale-110">
                <card.icon size={20} />
              </div>
              <h3 className="text-sm font-black">{card.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================ */}
      {/* COMMUNITY IMPACT */}
      {/* ================================================================ */}
      <section ref={countersRef} className="relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-[0_12px_34px_rgba(8,33,56,0.06)]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />
        <div className="relative px-5 py-7 sm:px-7 sm:py-10">
          <div className="text-center mb-7">
            <p className="text-xs font-bold text-primary uppercase tracking-wider">{labels.communityImpact}</p>
            <h2 className="mt-1 text-2xl font-black">{labels.ourImpact}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              {icon: Clock, value: impactData.volunteerHours, label: labels.hoursContributed},
              {icon: Trophy, value: impactData.completedActivities, label: labels.completedActivities},
              {icon: Heart, value: impactData.peopleHelped, label: labels.peopleHelped},
              {icon: Globe, value: impactData.neighborhoodsServed, label: labels.neighborhoodsServed},
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
                  <item.icon size={22} />
                </div>
                <p className="text-2xl font-black sm:text-3xl">
                  {countersVisible ? <CountUp value={item.value} /> : "0"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* VOLUNTEER STORIES */}
      {/* ================================================================ */}
      {stories.length > 0 ? (
        <section>
          <div className="mb-4">
            <p className="text-xs font-bold text-primary uppercase tracking-wider">{labels.stories}</p>
            <h2 className="text-lg font-black">{labels.volunteerStories}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stories.map((story, i) => (
              <div key={i} className="relative rounded-2xl border border-border/70 bg-card p-5 shadow-[0_8px_22px_rgba(8,33,56,0.05)]">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-muted">
                    <img src={story.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">{storyForLocale(story, "name")}</p>
                    <p className="text-xs text-muted-foreground">{storyForLocale(story, "activity")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleShare(
                      storyForLocale(story, "name"),
                      storyForLocale(story, "quote"),
                      window.location.href
                    )}
                    className="shrink-0 flex items-center gap-1.5 rounded-xl border border-border/60 px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition"
                    aria-label={labels.share}
                  >
                    <Share2 size={13} />
                    {labels.share}
                  </button>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground italic">
                  &ldquo;{storyForLocale(story, "quote")}&rdquo;
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Clock size={13} />
                  {story.hours} {labels.hoursLower}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ================================================================ */}
      {/* UPCOMING ACTIVITIES */}
      {/* ================================================================ */}
      {upcomingActivities.length > 0 ? (
        <section>
          <div className="mb-4">
            <p className="text-xs font-bold text-primary uppercase tracking-wider">{labels.upcoming}</p>
            <h2 className="text-lg font-black">{labels.upcomingActivities}</h2>
          </div>
          <div className="space-y-3">
            {upcomingActivities.map((activity, i) => (
              <div key={i} className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-[0_4px_12px_rgba(8,33,56,0.04)] transition-all duration-200 hover:shadow-md">
                <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CalendarDays size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{activityForLocale(activity, "title")}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarDays size={12} />{activityForLocale(activity, "date")}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} />{activity.location}</span>
                    <span className="flex items-center gap-1"><Users size={12} />{activity.remainingPlaces} {labels.remaining}</span>
                    <span className="flex items-center gap-1"><BadgeCheck size={12} />{activity.organizer}</span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleShare(
                      activityForLocale(activity, "title"),
                      `${activityForLocale(activity, "date")} · ${activity.location}`,
                      window.location.href
                    )}
                    className="flex h-10 items-center gap-1.5 rounded-xl border border-border/60 px-3 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition"
                    aria-label={labels.share}
                  >
                    <Share2 size={14} />
                    {labels.share}
                  </button>
                  <Button variant="outline" size="sm" className="h-10 rounded-xl text-xs font-bold gap-1">
                    {labels.viewDetails}
                    <ArrowLeft size={14} className={cn(isRtl ? "" : "rotate-180")} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ================================================================ */}
      {/* EMPTY STATE */}
      {/* ================================================================ */}
      {opportunities.length === 0 ? (
        <section className="flex flex-col items-center justify-center rounded-3xl border border-border/70 bg-card p-12 text-center">
          <span className="text-5xl">🙋</span>
          <h2 className="mt-5 text-xl font-black">{labels.noOpportunities}</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">{labels.noOpportunitiesHint}</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setActiveCategory(null);
            }}
            className="mt-6 h-12 rounded-2xl px-6 text-sm font-bold"
          >
            {labels.clearFilters}
          </Button>
        </section>
      ) : null}

      {/* ================================================================ */}
      {/* JOIN MODAL */}
      {/* ================================================================ */}
      <VolunteerJoinModal
        open={joinTarget !== null}
        onClose={() => setJoinTarget(null)}
        opportunity={joinTarget}
        locale={locale}
        isLoggedIn={isLoggedIn}
        labels={labels}
        onJoin={handleJoinAction}
      />
    </>
  );
}
