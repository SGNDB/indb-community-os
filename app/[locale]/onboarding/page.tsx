import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";

import {OnboardingFlow} from "@/components/onboarding/onboarding-flow";
import {createClient} from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Onboarding"});

  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const supabase = await createClient();

  // Check if user is authenticated
  const {data: {user}} = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Check if user has already completed onboarding
  const {data: profile} = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) {
    redirect(`/${locale}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#ED2124]/5 to-background">
      <OnboardingFlow locale={locale} userId={user.id} />
    </div>
  );
}
