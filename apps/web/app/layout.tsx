import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ConsentBanner } from "@/components/consent/ConsentBanner";
import { ManageConsentButton } from "@/components/consent/ManageConsentButton";
import { NavHeader } from "@/components/navigation/NavHeader";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ConsentProvider } from "@/components/providers/ConsentProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: "StepCountLeague",
  description: "Compete fairly with friends on daily step counts.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        <ConsentProvider>
          <AuthProvider>
            <NavHeader />
            <main className="flex min-h-screen flex-col">{children}</main>
            <ConsentBanner />
            <ManageConsentButton />
          </AuthProvider>
        </ConsentProvider>
      </body>
    </html>
  );
}