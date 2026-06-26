"use client";

import {useEffect, useMemo, useRef, useState, type ComponentType} from "react";
import {useTranslations} from "next-intl";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Eye,
  Gift,
  Globe2,
  HandHeart,
  HeartHandshake,
  Images,
  Landmark,
  Lightbulb,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircleMore,
  Network,
  Phone,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";

import {Badge} from "@/components/ui/badge";
import {Link} from "@/lib/i18n/routing";
import {cn} from "@/lib/utils/cn";

type IconKey =
  | "citizens"
  | "graatek"
  | "ideas"
  | "memory"
  | "campaigns"
  | "volunteer"
  | "impact"
  | "messages"
  | "privacy"
  | "transparency"
  | "partners"
  | "growth";

type RawFeature = {title: string; text: string; icon: IconKey};
type RawStep = {title: string; text: string};
type RawTrust = {title: string; text: string; icon: IconKey};
type RawTeam = {name: string; role: string; text: string};
type RawPartner = {title: string; text: string};
type RawFaq = {question: string; answer: string};
type RawCounter = {value: number; suffix: string; label: string};
type RawContact = {label: string; value: string; icon: "mail" | "phone" | "location"};

const iconMap: Record<IconKey, ComponentType<{size?: number; className?: string}>> = {
  citizens: UsersRound,
  graatek: Gift,
  ideas: Lightbulb,
  memory: Images,
  campaigns: HandHeart,
  volunteer: HeartHandshake,
  impact: BadgeCheck,
  messages: MessageCircleMore,
  privacy: LockKeyhole,
  transparency: Eye,
  partners: Network,
  growth: Rocket,
};

const contactIconMap = {
  mail: Mail,
  phone: Phone,
  location: MapPin,
};

function useCountUp(target: number, active: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const totalFrames = 52;

    function tick() {
      frame += 1;
      const progress = Math.min(1, frame / totalFrames);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }

    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [active, target]);

  return value;
}

function AnimatedCounter({item, locale}: {item: RawCounter; locale: string}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  const value = useCountUp(item.value, active);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      {threshold: 0.35},
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="rounded-2xl border border-border/70 bg-card p-4 shadow-[0_12px_30px_rgba(7,31,54,0.06)]">
      <p className="text-3xl font-black text-primary sm:text-4xl">
        {new Intl.NumberFormat(locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US").format(value)}
        {item.suffix}
      </p>
      <p className="mt-2 text-sm font-semibold text-muted-foreground">{item.label}</p>
    </div>
  );
}

function SectionHeader({eyebrow, title, text}: {eyebrow: string; title: string; text: string}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{text}</p>
    </div>
  );
}

function PlatformIllustration({labels}: {labels: {hub: string; trust: string; live: string; modules: string[]}}) {
  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] border border-border/70 bg-card p-4 shadow-[0_24px_70px_rgba(7,31,54,0.12)]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(237,33,36,0.08),transparent_38%,rgba(16,185,129,0.08))]" />
      <div className="relative grid h-full gap-3">
        <div className="rounded-3xl border border-border/70 bg-background/80 p-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Sparkles size={20} />
              </span>
              <div>
                <p className="text-sm font-black">{labels.hub}</p>
                <p className="text-xs text-muted-foreground">Nouadhibou</p>
              </div>
            </div>
            <Badge className="rounded-full bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">
              <ShieldCheck size={13} />
              {labels.trust}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {labels.modules.slice(0, 4).map((module, index) => {
            const icons = [Lightbulb, Gift, HandHeart, Images];
            const Icon = icons[index] ?? Sparkles;
            return (
              <div key={module} className="rounded-3xl border border-border/60 bg-background/75 p-4 backdrop-blur">
                <Icon size={20} className="text-primary" />
                <p className="mt-5 text-sm font-black">{module}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-primary" style={{width: `${58 + index * 9}%`}} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-3xl border border-border/70 bg-background/80 p-4 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black">{labels.live}</p>
              <p className="mt-1 text-xs text-muted-foreground">{labels.modules.slice(4).join(" • ")}</p>
            </div>
            <div className="flex -space-x-2 rtl:space-x-reverse">
              {["N", "D", "B"].map((letter) => (
                <span key={letter} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-card bg-primary/10 text-xs font-black text-primary">
                  {letter}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AboutPlatformClient({locale}: {locale: string}) {
  const t = useTranslations("AboutPlatform");
  const features = t.raw("features.items") as RawFeature[];
  const steps = t.raw("how.steps") as RawStep[];
  const trustItems = t.raw("trust.items") as RawTrust[];
  const team = t.raw("team.members") as RawTeam[];
  const partners = t.raw("partners.items") as RawPartner[];
  const faqs = t.raw("faq.items") as RawFaq[];
  const counters = t.raw("impact.counters") as RawCounter[];
  const contacts = t.raw("contact.items") as RawContact[];
  const audiences = t.raw("hero.audiences") as string[];
  const values = t.raw("values.items") as string[];
  const heroVisual = t.raw("hero.visual") as {hub: string; trust: string; live: string; modules: string[]};

  const isRtl = locale === "ar";
  const featureRows = useMemo(() => features.slice(0, 8), [features]);

  return (
    <div className="space-y-10 pb-24 sm:space-y-14" dir={isRtl ? "rtl" : "ltr"}>
      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-background shadow-[0_24px_80px_rgba(7,31,54,0.08)]">
        <div className="grid gap-6 p-5 sm:p-8 xl:grid-cols-[minmax(0,1fr)_460px] xl:items-center">
          <div className="max-w-3xl">
            <Badge className="rounded-full bg-primary/10 px-3 py-1.5 text-primary hover:bg-primary/10">
              <BadgeCheck size={14} />
              {t("hero.badge")}
            </Badge>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              {t("hero.subtitle")}
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link href="/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-black text-primary-foreground shadow-[0_14px_30px_rgba(237,33,36,0.24)] transition active:scale-[0.98]">
                {t("hero.primaryCta")}
                <ArrowUpRight size={18} />
              </Link>
              <Link href="/campaigns" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-black transition active:scale-[0.98]">
                {t("hero.secondaryCta")}
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {audiences.map((audience) => (
                <span key={audience} className="rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground">
                  {audience}
                </span>
              ))}
            </div>
          </div>
          <PlatformIllustration labels={heroVisual} />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{t("story.eyebrow")}</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{t("story.title")}</h2>
        </div>
        <div className="space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
          {(t.raw("story.paragraphs") as string[]).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-[0_12px_34px_rgba(7,31,54,0.06)] sm:p-6">
          <Target size={24} className="text-primary" />
          <h2 className="mt-5 text-2xl font-black">{t("vision.title")}</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("vision.text")}</p>
        </div>
        <div className="rounded-[1.75rem] border border-border/70 bg-card p-5 shadow-[0_12px_34px_rgba(7,31,54,0.06)] sm:p-6">
          <Rocket size={24} className="text-primary" />
          <h2 className="mt-5 text-2xl font-black">{t("mission.title")}</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("mission.text")}</p>
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader eyebrow={t("features.eyebrow")} title={t("features.title")} text={t("features.text")} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featureRows.map((feature) => {
            const Icon = iconMap[feature.icon] ?? Sparkles;
            return (
              <article key={feature.title} className="group rounded-[1.6rem] border border-border/70 bg-card p-5 shadow-[0_10px_28px_rgba(7,31,54,0.05)] transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_42px_rgba(7,31,54,0.1)]">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon size={22} />
                </span>
                <h3 className="mt-5 text-lg font-black">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader eyebrow={t("how.eyebrow")} title={t("how.title")} text={t("how.text")} />
        <div className="relative mx-auto max-w-4xl">
          <div className="absolute inset-y-6 start-5 hidden w-px bg-border md:block" />
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.title} className="relative rounded-[1.5rem] border border-border/70 bg-card p-4 shadow-[0_10px_28px_rgba(7,31,54,0.05)] md:ms-14">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground md:absolute md:-start-[4.75rem] md:top-4">
                  {index + 1}
                </span>
                <h3 className="font-black">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-6 rounded-[2rem] border border-border/70 bg-card p-5 shadow-[0_18px_54px_rgba(7,31,54,0.08)] sm:p-7">
        <SectionHeader eyebrow={t("impact.eyebrow")} title={t("impact.title")} text={t("impact.text")} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {counters.map((counter) => (
            <AnimatedCounter key={counter.label} item={counter} locale={locale} />
          ))}
        </div>
        <p className="text-center text-xs font-semibold text-muted-foreground">{t("impact.note")}</p>
      </section>

      <section className="space-y-6">
        <SectionHeader eyebrow={t("trust.eyebrow")} title={t("trust.title")} text={t("trust.text")} />
        <div className="grid gap-4 md:grid-cols-3">
          {trustItems.map((item) => {
            const Icon = iconMap[item.icon] ?? ShieldCheck;
            return (
              <article key={item.title} className="rounded-[1.5rem] border border-border/70 bg-card p-5">
                <Icon size={22} className="text-primary" />
                <h3 className="mt-4 font-black">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
        <div className="rounded-[1.75rem] border border-border/70 bg-card p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{t("values.eyebrow")}</p>
          <h2 className="mt-3 text-2xl font-black sm:text-4xl">{t("values.title")}</h2>
          <div className="mt-5 grid gap-2">
            {values.map((value) => (
              <div key={value} className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3 text-sm font-bold">
                <CheckCircle2 size={18} className="shrink-0 text-primary" />
                {value}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-border/70 bg-card p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{t("team.eyebrow")}</p>
          <h2 className="mt-3 text-2xl font-black sm:text-4xl">{t("team.title")}</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("team.text")}</p>
          <div className="mt-5 grid gap-3">
            {team.map((member) => (
              <div key={member.name} className="flex gap-3 rounded-2xl border border-border/60 bg-background p-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground">
                  {member.name.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="font-black">{member.name}</p>
                  <p className="text-xs font-bold text-primary">{member.role}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{member.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader eyebrow={t("partners.eyebrow")} title={t("partners.title")} text={t("partners.text")} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {partners.map((partner, index) => {
            const icons = [Building2, Landmark, Globe2, CircleDollarSign];
            const Icon = icons[index] ?? Building2;
            return (
              <article key={partner.title} className="rounded-[1.5rem] border border-border/70 bg-card p-5">
                <Icon size={22} className="text-primary" />
                <h3 className="mt-4 font-black">{partner.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{partner.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader eyebrow={t("faq.eyebrow")} title={t("faq.title")} text={t("faq.text")} />
        <div className="mx-auto max-w-4xl space-y-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="group rounded-[1.35rem] border border-border/70 bg-card p-4 shadow-[0_8px_24px_rgba(7,31,54,0.05)]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-black">
                {faq.question}
                <ChevronDown size={18} className="shrink-0 text-muted-foreground transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[1.75rem] border border-border/70 bg-card p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{t("contact.eyebrow")}</p>
          <h2 className="mt-3 text-2xl font-black sm:text-4xl">{t("contact.title")}</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("contact.text")}</p>
        </div>
        <div className="grid gap-3">
          {contacts.map((contact) => {
            const Icon = contactIconMap[contact.icon];
            return (
              <div key={contact.label} className="rounded-[1.25rem] border border-border/70 bg-card p-4">
                <Icon size={20} className="text-primary" />
                <p className="mt-3 text-xs font-bold text-muted-foreground">{contact.label}</p>
                <p className="mt-1 font-black">{contact.value}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className={cn("overflow-hidden rounded-[2rem] border border-primary/20 bg-primary p-6 text-primary-foreground shadow-[0_24px_70px_rgba(237,33,36,0.22)] sm:p-8", isRtl ? "text-right" : "text-left")}>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <p className="text-sm font-black opacity-80">{t("final.eyebrow")}</p>
            <h2 className="mt-2 text-3xl font-black sm:text-5xl">{t("final.title")}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 opacity-90 sm:text-base">{t("final.text")}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <Link href="/register" className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-black text-primary transition active:scale-[0.98]">
              {t("final.primaryCta")}
            </Link>
            <Link href="/volunteer" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/45 px-6 text-sm font-black text-white transition active:scale-[0.98]">
              {t("final.secondaryCta")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
