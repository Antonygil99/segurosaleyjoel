import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";

import { GuiaShell } from "@/components/guia/guia-shell";
import { Reveal } from "@/components/guia/reveal";
import { GUIAS_FUTURAS } from "@/content/ale-te-explica/medica-vital";

const SITE = "https://ajconsultoria.lovable.app";
const TITLE = "Ale te explica | Guías de seguros en palabras sencillas";
const DESC =
  "Serie de guías educativas de Ale Valencia para entender cómo funcionan los seguros antes de contratar. Guía 01: Médica Vital explicado fácil.";

export const Route = createFileRoute("/ale-te-explica/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE}/ale-te-explica` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: `${SITE}/ale-te-explica` }],
  }),
  component: IndiceGuias,
});

function IndiceGuias() {
  return (
    <GuiaShell numero="Serie" titulo="Guías educativas">
      <section className="mx-auto w-full max-w-5xl px-5 py-16 sm:py-24">
        <Reveal>
          <span className="guia-chip">💜 Ale te explica</span>
          <h1 className="mt-6 max-w-2xl text-4xl leading-[1.05] sm:text-6xl">
            Entender primero.
            <br />
            <span className="text-muted-foreground">Decidir después.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Guías cortas y visuales para entender cómo funcionan los seguros, sin palabras
            complicadas y sin que nadie te presione.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <Link
            to="/ale-te-explica/medica-vital"
            className="guia-card mt-12 block bg-secondary/60 p-7 sm:p-10"
          >
            <span className="guia-chip">Guía 01</span>
            <h2 className="mt-5 text-2xl sm:text-4xl">Médica Vital explicado fácil</h2>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Qué es, para quién sí y para quién no, cómo funciona el día que te sientes mal y qué
              conviene saber antes de contratar.
            </p>
            <span className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-primary">
              Empezar la guía
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </Reveal>

        <Reveal delay={140}>
          <h2 className="mt-20 text-xl sm:text-2xl">Próximas guías</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {GUIAS_FUTURAS.map((g) => (
              <li
                key={g}
                className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/50 px-5 py-4 text-sm text-muted-foreground"
              >
                <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                <span className="flex-1">{g}</span>
                <span className="text-[11px] tracking-wide uppercase">Pronto</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>
    </GuiaShell>
  );
}
