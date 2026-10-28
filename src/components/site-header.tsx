import { Link } from "@tanstack/react-router";
import { Menu, MessageCircle, X } from "lucide-react";
import { useState } from "react";

import { NAV_ITEMS, WA_PRIMARY } from "@/lib/site";

/**
 * Header compartido por todo el sitio (Home y Centro AJ).
 * `home` hace que los enlaces de sección apunten a anclas de la misma página.
 */
export function SiteHeader({ home = false }: { home?: boolean }) {
  const [open, setOpen] = useState(false);
  const hashHref = (hash: string) => (home ? `#${hash}` : `/#${hash}`);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container-aj flex h-16 items-center justify-between gap-3">
        {home ? (
          <a href="#top" className="flex min-w-0 items-center gap-2">
            <Logo />
          </a>
        ) : (
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <Logo />
          </Link>
        )}

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          {NAV_ITEMS.map((item) =>
            "to" in item ? (
              <Link
                key={item.label}
                to={item.to}
                className="transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={hashHref(item.hash)}
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ),
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href={WA_PRIMARY}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary hidden sm:inline-flex"
          >
            <MessageCircle className="h-4 w-4" />
            Hablar con AJ
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="grid h-10 w-10 place-items-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="menu-movil" className="border-t border-border/60 bg-background md:hidden">
          <nav className="container-aj flex flex-col py-2">
            {NAV_ITEMS.map((item) =>
              "to" in item ? (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="border-b border-border/50 py-3 text-base text-muted-foreground transition-colors hover:text-foreground"
                  activeProps={{ className: "text-foreground" }}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={hashHref(item.hash)}
                  onClick={() => setOpen(false)}
                  className="border-b border-border/50 py-3 text-base text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </a>
              ),
            )}
            <a
              href={WA_PRIMARY}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="btn-primary my-4 justify-center"
            >
              <MessageCircle className="h-4 w-4" />
              Hablar con AJ
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

function Logo() {
  return (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary font-display text-sm text-primary-foreground">
        AJ
      </span>
      <span className="truncate font-display text-lg">AJ Consultoría</span>
    </>
  );
}
