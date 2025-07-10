import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { AppProviders } from "./providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { Header } from "@/components/header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Waffle Payments",
  description: "Your seamless gateway to crypto payments",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProviders session={session}>
          <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1 bg-background">{children}</main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
