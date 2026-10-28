import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CALENDAR_URL, WA_PRIMARY } from "@/lib/site";

// Reexportados para conveniencia de las páginas del Centro AJ.
export { WA_PRIMARY, CALENDAR_URL };

export function CentroShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
