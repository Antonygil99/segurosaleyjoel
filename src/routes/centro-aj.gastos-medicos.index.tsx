import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  FileText,
  HelpCircle,
  List,
  MessageCircle,
  PlayCircle,
  Users,
} from "lucide-react";

import { CentroShell, WA_PRIMARY, CALENDAR_URL } from "@/components/centro-shell";
import { GM_SECCIONES, GM_SERIES } from "@/content/centro-aj";

const SITE = "https://ajconsultoria.lovable.app";

export const Route = createFileRoute("/centro-aj/gastos-medicos/")({
  head: () => ({
    meta: [
      { title: "Gastos Médicos | Ruta de aprendizaje del Centro AJ" },
      {
        name: "description",
        content:
          "Ruta de aprendizaje en video sobre seguros de gastos médicos mayores: series en orden, preguntas frecuentes, casos reales, cómo usar tu seguro y glosario.",
      },
      { property: "og:title", content: "Gastos Médicos | Ruta de aprendizaje del Centro AJ" },
      {
        property: "og:description",
        content:
          "Series de video en orden para entender tu protección médica antes de contratar, con AJ Consultoría.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE}/centro-aj/gastos-medicos` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Gastos Médicos | Ruta de aprendizaje del Centro AJ" },
      {
        name: "twitter:description",
        content: "Series de video para entender tu protección médica, de AJ Consultoría.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE}/centro-aj/gastos-medicos` }],
  }),
  component: GastosMedicosRuta,
});

const ICONOS_SECCION = {
  help: HelpCircle,
  users: Users,
  file: FileText,
  list: List,
} as const;

function GastosMedicosRuta() {
  return (
    <CentroShell>
      {/* INTRO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-primary-soft blur-3xl opacity-60"
        />
        <div className="container-aj relative py-10 md:py-16">
          <Link
            to="/centro-aj"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Centro AJ
          </Link>
          <span className="eyebrow mt-8 block">Ruta de aprendizaje</span>
          <h1 className="mt-4 max-w-3xl text-[2rem] leading-[1.1] sm:text-4xl md:text-5xl">
            Gastos Médicos
          </h1>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            [PENDIENTE] Introducción a la ruta de Gastos Médicos: qué vas a aprender y en qué orden.
          </p>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Recórrela en orden, de arriba hacia abajo. Cada serie contiene uno o varios videos
            cortos.
          </p>
        </div>
      </section>

      {/* SERIES */}
      <section className="pb-4">
        <div className="container-aj space-y-10">
          {GM_SERIES.map((serie, i) => (
            <div key={serie.slug} className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-2xl">
                  <span className="eyebrow">{serie.etiqueta}</span>
                  <h2 className="mt-3 text-xl leading-snug sm:text-2xl">{serie.titulo}</h2>
                  <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                    {serie.descripcion}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                    Paso {i + 1} de {GM_SERIES.length}
                  </span>
                  <span className="rounded-full bg-primary-soft px-3 py-1 text-xs text-primary">
                    {serie.videos.length} {serie.videos.length === 1 ? "video" : "videos"}
                  </span>
                </div>
              </div>

              <ol className="mt-6 grid gap-3">
                {serie.videos.map((video, n) => (
                  <li key={video.slug}>
                    <Link
                      to="/centro-aj/gastos-medicos/$slug"
                      params={{ slug: video.slug }}
                      className="group flex items-start gap-4 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/40 sm:items-center"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <PlayCircle className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-base leading-snug text-foreground">
                          {n + 1}. {video.titulo}
                        </span>
                        <span className="mt-1 block text-sm text-muted-foreground">
                          {video.resumen}
                        </span>
                      </span>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1 sm:mt-0" />
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* SECCIONES DE APOYO */}
      <section className="py-14 md:py-20">
        <div className="container-aj">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl">Además de los videos</h2>
            <p className="mt-2 text-base text-muted-foreground">
              Material de apoyo para consultar cuando lo necesites.
            </p>
          </div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {GM_SECCIONES.map((seccion) => {
              const Icon = ICONOS_SECCION[seccion.icono];
              return (
                <Link
                  key={seccion.slug}
                  to="/centro-aj/gastos-medicos/$slug"
                  params={{ slug: seccion.slug }}
                  className="card-soft group flex flex-col transition-shadow hover:shadow-[0_18px_50px_-30px_oklch(0.3_0.05_300/0.35)]"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-lg leading-snug">{seccion.titulo}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {seccion.resumen}
                  </p>
                  <span className="mt-5 flex items-center gap-2 text-sm text-primary">
                    Ver
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* AGENDA UNA PLÁTICA */}
      <section className="pb-14 md:pb-20">
        <div className="container-aj">
          <div className="max-w-3xl rounded-3xl border border-border bg-secondary/50 p-8 sm:p-10">
            <span className="eyebrow">Agenda una plática</span>
            <p className="mt-4 font-display text-2xl text-foreground sm:text-3xl">
              Cuando quieras revisar tu caso, aquí estamos.
            </p>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              [PENDIENTE] Texto de cierre de la ruta de Gastos Médicos.
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
