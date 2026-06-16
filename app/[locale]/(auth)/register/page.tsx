import {RegisterForm} from "@/app/[locale]/(auth)/register/register-form";
import {Logo} from "@/components/layout/Logo";

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: string}>;
  searchParams: Promise<{next?: string}>;
}) {
  const {locale} = await params;
  const {next} = await searchParams;

  return (
    <div className="mx-auto flex h-dvh max-w-sm flex-col justify-center overflow-hidden px-5 py-4">
      <div className="flex flex-col items-center gap-1 pb-4">
        <Logo size="md" priority />
      </div>

      <RegisterForm locale={locale} next={next} />
    </div>
  );
}
