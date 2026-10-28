import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  Car,
  CalendarDays,
  Heart,
  List,
  MessageCircle,
  ShieldCheck,
  Stethoscope,
  ArrowRight,
} from "lucide-react";

import { CentroShell, WA_PRIMARY, CALENDAR_URL } from "@/components/centro-shell";
import { GLOSARIO_AJ, RAMOS } from "@/content/centro-aj";

const SITE = "https://ajconsultoria.lovable.app";

export const Route = createFileRoute("/centro-aj/")({
  head: () => ({
    meta: [
      { title: "Centro AJ | Aprende sobre seguros por tipo de protección" },
      {
        name: "description",
        content:
          "El Centro AJ organiza el aprendizaje por ramo: Gastos Médicos, Autos, Vida, Daños y Empresas. Empieza por la ruta de Gastos Médicos, en video y lenguaje simple.",
      },
      { property: "og:title", content: "Centro AJ | Aprende sobre seguros por tipo de protección" },
      {
        property: "og:description",
        content:
          "Rutas de aprendizaje por tipo de seguro, en lenguaje simple. Aprende antes de decidir, con el acompañamiento de AJ Consultoría.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE}/centro-aj` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Centro AJ | Aprende sobre seguros por tipo de protección" },
      {
        name: "twitter:description",
        content: "Rutas de aprendizaje por tipo de seguro, de AJ Consultoría.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE}/centro-aj` }],
  }),
  component: CentroIndex,
});

const ICONOS_RAMO = {
  stethoscope: Stethoscope,
  car: Car,
  heart: Heart,
  shield: ShieldCheck,
  building: Building2,
} as const;

function CentroIndex() {
  return (
    <CentroShell>
      {/* INTRO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary-soft blur-3xl opacity-70"
        />
        <div className="container-aj relative py-12 md:py-20">
          <span className="eyebrow">Centro AJ</span>
          <h1 className="mt-4 max-w-3xl text-[2rem] leading-[1.1] sm:text-4xl md:text-5xl">
            Aprender primero,{" "}
            <span className="text-primary italic">decidir después</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            El Centro AJ está organizado por tipo de protección. Elige el ramo que te interesa y
            recorre su ruta de aprendizaje con calma, sin tecnicismos.
          </p>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Hoy la ruta de Gastos Médicos ya está abierta. Las demás se irán sumando.
          </p>
        </div>
      </section>

      {/* RAMOS */}
      <section className="pb-4">
        <div className="container-aj">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl">Elige tu ramo</h2>
            <p className="mt-2 text-base text-muted-foreground">
              Cada ramo tiene su propia ruta: series de video, preguntas frecuentes, casos reales y
              glosario.
            </p>
          </div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {RAMOS.map((ramo) => {
              const Icon = ICONOS_RAMO[ramo.icono];
              if (ramo.activo && ramo.ruta) {
                return (
                  <Link
                    key={ramo.id}
                    to={ramo.ruta}
                    className="card-soft group flex flex-col transition-shadow hover:shadow-[0_18px_50px_-30px_oklch(0.3_0.05_300/0.35)]"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 text-xl leading-snug">{ramo.nombre}</h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {ramo.descripcion}
                    </p>
                    <span className="mt-5 flex items-center gap-2 text-sm text-primary">
                      Entrar a la ruta
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                );
              }
              return (
                <div
                  key={ramo.id}
                  className="card-soft flex flex-col opacity-70"
                  aria-disabled="true"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-muted-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="mt-5 flex items-center gap-3">
                    <h3 className="text-xl leading-snug">{ramo.nombre}</h3>
                    <span className="rounded-full border border-border px-2.5 py-0.5 text-[0.7rem] tracking-wide text-muted-foreground uppercase">
                      Próximamente
                    </span>
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {ramo.descripcion}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TRANSVERSAL */}
      <section className="py-14 md:py-20">
        <div className="container-aj">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl">Fundamentos</h2>
            <p className="mt-2 text-base text-muted-foreground">
              Contenido que sirve para cualquier tipo de seguro.
            </p>
          </div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/centro-aj/glosario"
              className="card-soft group flex flex-col transition-shadow hover:shadow-[0_18px_50px_-30px_oklch(0.3_0.05_300/0.35)]"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <List className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-xl leading-snug">{GLOSARIO_AJ.titulo}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {GLOSARIO_AJ.resumen}
              </p>
              <span className="mt-5 flex items-center gap-2 text-sm text-primary">
                Leer
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* CIERRE */}
      <section className="pb-14 md:pb-20">
        <div className="container-aj">
          <div className="max-w-3xl rounded-3xl border border-border bg-card p-8 sm:p-10">
            <p className="font-display text-2xl text-foreground sm:text-3xl">
              Aprender no obliga a contratar.
            </p>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Si después de aprender te quedan dudas, podemos conversar con calma. Sin presión y sin
              compromiso.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={WA_PRIMARY} target="_blank" rel="noopener noreferrer" className="btn-primary">
                <MessageCircle className="h-4 w-4" />
                Hablar con AJ Consultoría
              </a>
              <a href={CALENDAR_URL} target="_blank" rel="noopener noreferrer" className="btn-outline">
                <CalendarDays className="h-4 w-4" />
                Agendar plática
              </a>
            </div>
          </div>
        </div>
      </section>
    </CentroShell>
  );
}
