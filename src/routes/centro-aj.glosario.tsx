import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, MessageCircle } from "lucide-react";

import { Bloque } from "@/components/centro-bloques";
import { CentroShell, WA_PRIMARY, CALENDAR_URL } from "@/components/centro-shell";
import { GLOSARIO_AJ } from "@/content/centro-aj";

const SITE = "https://ajconsultoria.lovable.app";

export const Route = createFileRoute("/centro-aj/glosario")({
  head: () => ({
    meta: [
      { title: "Glosario AJ | Las palabras de los seguros en simple" },
      {
        name: "description",
        content:
          "Glosario transversal del Centro AJ: prima, cobertura, deducible, coaseguro y más, explicados en lenguaje cotidiano por AJ Consultoría.",
      },
      { property: "og:title", content: "Glosario AJ | Las palabras de los seguros en simple" },
      {
        property: "og:description",
        content: "Las palabras que aparecen en cualquier seguro, explicadas en simple.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `${SITE}/centro-aj/glosario` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Glosario AJ | Las palabras de los seguros en simple" },
      {
        name: "twitter:description",
        content: "Las palabras que aparecen en cualquier seguro, explicadas en simple.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE}/centro-aj/glosario` }],
  }),
  component: GlosarioPage,
});

function GlosarioPage() {
  return (
    <CentroShell>
      <article className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-primary-soft blur-3xl opacity-60"
        />
        <div className="container-aj relative max-w-3xl py-10 md:py-16">
          <Link
            to="/centro-aj"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Centro AJ
          </Link>

          <span className="eyebrow mt-8 block">Fundamentos</span>
          <h1 className="mt-4 text-[1.75rem] leading-[1.15] sm:text-4xl">{GLOSARIO_AJ.titulo}</h1>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">{GLOSARIO_AJ.resumen}</p>

          <div className="mt-8">
            {GLOSARIO_AJ.bloques.map((bloque, i) => (
              <Bloque key={i} bloque={bloque} />
            ))}
          </div>

          <div className="mt-12 rounded-3xl border border-border bg-card p-7 sm:p-9">
            <p className="font-display text-xl text-foreground sm:text-2xl">
              ¿Alguna palabra que te gustaría que agreguemos?
            </p>
            <p className="mt-3 text-base text-muted-foreground">
              Escríbenos y la explicamos con calma.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={WA_PRIMARY} target="_blank" rel="noopener noreferrer" className="btn-primary">
                <MessageCircle className="h-4 w-4" />
                Preguntar por WhatsApp
              </a>
              <a href={CALENDAR_URL} target="_blank" rel="noopener noreferrer" className="btn-outline">
                <CalendarDays className="h-4 w-4" />
                Agendar plática
              </a>
            </div>
          </div>
        </div>
      </article>
    </CentroShell>
  );
}
