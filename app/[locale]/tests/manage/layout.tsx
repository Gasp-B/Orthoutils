import React from "react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

// Correction: generateMetadata adapté
export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: "Tests.metadata" });
  return {
    title: t("manageTitle"),
  };
}

export default function ManageTestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Fil d'ariane simple */}
        <nav className="flex items-center text-sm text-muted-foreground mb-4">
          <Link href="/dashboard" className="hover:text-foreground transition-colors flex items-center gap-1">
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only">Dashboard</span>
          </Link>
          <ChevronRight className="h-4 w-4 mx-1" />
          <Link href="/tests/manage" className="hover:text-foreground transition-colors font-medium text-foreground">
            Gestion des tests
          </Link>
        </nav>

        {children}
      </div>
    </div>
  );
}