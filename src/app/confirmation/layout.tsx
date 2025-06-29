import { Header } from "@/components/header";

export default function ConfirmationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center bg-background">{children}</main>
    </div>
  );
}
