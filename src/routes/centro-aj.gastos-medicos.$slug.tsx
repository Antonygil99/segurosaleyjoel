import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CalendarDays, MessageCircle, Video } from "lucide-react";

import { Bloque } from "@/components/centro-bloques";
import { CentroShell, WA_PRIMARY, CALENDAR_URL } from "@/components/centro-shell";
import { getGmSeccion, getGmVideo, type SeccionBloque } from "@/content/centro-aj";

const SITE = "https://ajconsultoria.lovable.app";
const BASE = "/centro-aj/gastos-medicos";

export const Route = createFileRoute("/centro-aj/gastos-medicos/$slug")({
  loader: ({ params }) => {
    const video = getGmVideo(params.slug);
    if (video) {
      return {
        tipo: "video" as const,
        titulo: video.video.titulo,
        resumen: video.video.resumen,
        video,
      };
    }
    const seccion = getGmSeccion(params.slug);
    if (seccion) {
      return {
        tipo: "seccion" as const,
        titulo: seccion.titulo,
        resumen: seccion.resumen,
        seccion,
      };
    }
    throw notFound();
  },
  head: ({ params, loaderData }) => {
    const url = `${SITE}${BASE}/${params.slug}`;
    if (!loaderData) {
      return {
        meta: [
          { title: "Contenido no encontrado | Centro AJ" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.titulo} | Gastos Médicos · Centro AJ`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.resumen },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.resumen },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: loaderData.resumen },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": loaderData.tipo === "video" ? "VideoObject" : "Article",
            name: loaderData.titulo,
            headline: loaderData.titulo,
            description: loaderData.resumen,
            mainEntityOfPage: url,
            publisher: { "@type": "Organization", name: "AJ Consultoría" },
          }),
        },
      ],
    };
  },
  component: GmContenido,
  notFoundComponent: GmNoEncontrado,
  errorComponent: GmNoEncontrado,
});

function VolverALaRuta() {
  return (
    <Link
      to={BASE}
      className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Volver a la ruta de Gastos Médicos
    </Link>
  );
}

function Cierre() {
  return (
    <div className="mt-12 rounded-3xl border border-border bg-card p-7 sm:p-9">
      <p className="font-display text-xl text-foreground sm:text-2xl">
        ¿Te quedó alguna duda de este tema?
      </p>
      <p className="mt-3 text-base text-muted-foreground">
        Aquí primero te escuchamos antes de ofrecerte algo.
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
  );
}

function GmContenido() {
  const data = Route.useLoaderData();

  return (
    <CentroShell>
      <article className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-primary-soft blur-3xl opacity-60"
        />
        <div className="container-aj relative max-w-3xl py-10 md:py-16">
          <VolverALaRuta />

          {data.tipo === "video" ? (
            <>
              <span className="eyebrow mt-8 block">
                {data.video.serie.etiqueta} · Video {data.video.posicion} de {data.video.total}
              </span>
              <h1 className="mt-4 text-[1.75rem] leading-[1.15] sm:text-4xl">
                {data.video.video.titulo}
              </h1>

              <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-secondary/60">
                {data.video.video.embedUrl ? (
                  <div className="aspect-video w-full">
                    <iframe
                      src={data.video.video.embedUrl}
                      title={data.video.video.titulo}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full border-0"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 px-6 text-center">
                    <Video className="h-8 w-8 text-primary" />
                    <p className="font-display text-lg text-foreground">
                      [PENDIENTE] Espacio para el video
                    </p>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      Cuando me compartas el enlace del video, aparecerá incrustado aquí.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-10">
                <h2 className="text-xl text-foreground sm:text-2xl">Resumen</h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {data.video.video.resumen}
                </p>
              </div>

              <div className="mt-8 rounded-3xl border-l-4 border-primary bg-primary-soft/60 p-6">
                <span className="eyebrow">Idea principal</span>
                <p className="mt-3 font-display text-xl leading-snug text-foreground sm:text-2xl">
                  {data.video.video.ideaPrincipal}
                </p>
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {data.video.siguiente ? (
                  <Link
                    to="/centro-aj/gastos-medicos/$slug"
                    params={{ slug: data.video.siguiente.slug }}
                    className="btn-primary"
                  >
                    Siguiente video
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link to={BASE} className="btn-primary">
                    Terminaste la ruta · volver al inicio
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                {data.video.anterior && (
                  <Link
                    to="/centro-aj/gastos-medicos/$slug"
                    params={{ slug: data.video.anterior.slug }}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    ← Video anterior
                  </Link>
                )}
              </div>
            </>
          ) : (
            <>
              <span className="eyebrow mt-8 block">Gastos Médicos</span>
              <h1 className="mt-4 text-[1.75rem] leading-[1.15] sm:text-4xl">
                {data.seccion.titulo}
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl">{data.seccion.resumen}</p>
              <div className="mt-8">
                {data.seccion.bloques.map((bloque: SeccionBloque, i: number) => (
                  <Bloque key={i} bloque={bloque} />
                ))}
              </div>
            </>
          )}

          <Cierre />

          <div className="mt-10">
            <VolverALaRuta />
          </div>
        </div>
      </article>
    </CentroShell>
  );
}

function GmNoEncontrado() {
  return (
    <CentroShell>
      <section className="container-aj max-w-2xl py-20 text-center">
        <h1 className="text-3xl sm:text-4xl">Este contenido aún no existe</h1>
        <p className="mt-5 text-base text-muted-foreground sm:text-lg">
          Puede que estemos preparándolo. Vuelve a la ruta de Gastos Médicos para ver lo que ya está
          disponible.
        </p>
        <div className="mt-8 flex justify-center">
          <Link to={BASE} className="btn-primary">
            <ArrowLeft className="h-4 w-4" />
            Ruta de Gastos Médicos
          </Link>
        </div>
      </section>
    </CentroShell>
  );
}
