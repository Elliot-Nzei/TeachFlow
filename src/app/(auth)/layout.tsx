import { Logo } from '@/components/logo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background px-4">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-6 flex justify-center">
            <Logo />
        </div>
        {children}
      </div>
    </div>
  );
}
