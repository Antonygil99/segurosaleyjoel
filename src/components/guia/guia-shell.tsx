import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { WA_PRIMARY } from "@/lib/site";

/** WhatsApp con mensaje específico de la guía (ramo Gastos Médicos / Médica Vital). */
export const WA_MEDICA_VITAL = `${WA_PRIMARY}?text=${encodeURIComponent(
  "Hola Ale, estuve leyendo la guía de Médica Vital y me gustaría una cotización.",
)}`;

export const WA_DUDAS = `${WA_PRIMARY}?text=${encodeURIComponent(
  "Hola Ale, terminé la guía de Médica Vital y me quedaron algunas dudas.",
)}`;

/**
 * Marco visual compartido por todas las guías de "Ale te explica".
 * Ámbito `.guia`: fondo blanco, texto negro, acento morado.
 */
export function GuiaShell({
  children,
  numero,
  titulo,
}: {
  children: ReactNode;
  numero: string;
  titulo: string;
}) {
  const [progreso, setProgreso] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgreso(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="guia min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-5">
          <Link to="/ale-te-explica" className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary text-sm text-primary-foreground">
              💜
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-tight">
                Ale te explica
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {numero} · {titulo}
              </span>
            </span>
          </Link>
          <a
            href={WA_MEDICA_VITAL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary hidden !px-5 !py-2.5 !text-sm sm:inline-flex"
          >
            <MessageCircle className="h-4 w-4" />
            Cotizar
          </a>
        </div>
        <div className="h-0.5 w-full bg-secondary">
          <div
            className="h-full bg-primary transition-[width] duration-150 ease-out"
            style={{ width: `${progreso * 100}%` }}
          />
        </div>
      </header>

      <main>{children}</main>

      {/* Botón flotante de WhatsApp */}
      <a
        href={WA_DUDAS}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hablar con Ale por WhatsApp"
        className="fixed right-4 bottom-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_16px_40px_-12px_oklch(0.5_0.22_288/0.7)] transition-transform hover:scale-105 active:scale-95"
      >
        <MessageCircle className="h-6 w-6" />
      </a>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>💜 Ale te explica · Una serie de guías educativas de AJ Consultoría.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/ale-te-explica" className="hover:text-foreground">
              Todas las guías
            </Link>
            <Link to="/" className="hover:text-foreground">
              AJ Consultoría
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
