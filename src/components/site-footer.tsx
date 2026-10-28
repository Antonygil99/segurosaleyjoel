import { Link } from "@tanstack/react-router";

import { WA_PRIMARY } from "@/lib/site";

/** Pie de página compartido por todo el sitio (Home y Centro AJ). */
export function SiteFooter({ home = false }: { home?: boolean }) {
  return (
    <footer className="border-t border-border py-8">
      <div className="container-aj flex flex-col items-center justify-between gap-3 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
        <p>
          © {new Date().getFullYear()} AJ Consultoría. Seguros con claridad, escucha y
          acompañamiento humano.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a href={WA_PRIMARY} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
            WhatsApp
          </a>
          <Link to="/centro-aj" className="hover:text-foreground">
            Centro AJ
          </Link>
          {home ? (
            <a href="#contacto" className="hover:text-foreground">
              Contacto
            </a>
          ) : (
            <a href="/#contacto" className="hover:text-foreground">
              Contacto
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
