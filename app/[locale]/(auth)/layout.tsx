export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-6">
      <div className="w-full max-w-sm space-y-5">{children}</div>
    </div>
  );
}
