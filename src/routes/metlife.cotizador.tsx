import { createFileRoute } from "@tanstack/react-router";
import { HeartPulse, LockKeyhole, MessageCircle } from "lucide-react";

import { CentroShell } from "@/components/centro-shell";
import { WA_PRIMARY } from "@/lib/site";

const PORTAL_METLIFE = "https://agentes.metlife.mx/";
const INFO_METLIFE = "https://www.metlife.com.mx/portal-de-agentes/";
const CONTACTO_AJ = `${WA_PRIMARY}?text=${encodeURIComponent(
  "Hola, me gustaría recibir asesoría para cotizar un seguro con MetLife.",
)}`;

export const Route = createFileRoute("/metlife/cotizador")({
  head: () => ({
    meta: [
      { title: "Cotizaciones MetLife | AJ Consultoría" },
      {
        name: "description",
        content: "Accede al Portal de Agentes de MetLife o solicita asesoría a AJ Consultoría.",
      },
    ],
  }),
  component: CotizadorMetLife,
});

function CotizadorMetLife() {
  return (
    <CentroShell>
      <div className="container-aj max-w-5xl py-10 sm:py-16">
        <section
          aria-labelledby="cotizador-title"
          className="rounded-3xl border border-primary/15 bg-primary-soft p-6 sm:p-12"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <HeartPulse aria-hidden="true" className="size-5" />
            Vida y Gastos Médicos Mayores
          </div>
          <h1 id="cotizador-title" className="mt-4 text-4xl leading-tight sm:text-6xl">
            Cotizaciones MetLife
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Genera una cotización en el portal oficial de MetLife o pide a AJ Consultoría que te
            ayude con tu solicitud.
          </p>
        </section>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <section
            aria-labelledby="agentes-title"
            className="flex flex-col items-start rounded-2xl border border-border bg-card p-6 sm:p-8"
          >
            <LockKeyhole aria-hidden="true" className="size-6 text-primary" />
            <h2 id="agentes-title" className="mt-4 text-2xl">
              Portal para agentes
            </h2>
            <p className="mt-2 mb-6 grow leading-relaxed text-muted-foreground">
              Inicia sesión con tu cuenta de agente de MetLife y entra a Cotizaciones en línea.
              Desde ahí podrás generar y descargar cotizaciones.
            </p>
            <a
              href={PORTAL_METLIFE}
              className="btn-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              Entrar al portal de MetLife
            </a>
            <a
              href={INFO_METLIFE}
              className="mt-4 text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              Consultar la guía de acceso
            </a>
          </section>

          <section
            aria-labelledby="asesoria-title"
            className="flex flex-col items-start rounded-2xl border border-border bg-card p-6 sm:p-8"
          >
            <MessageCircle aria-hidden="true" className="size-6 text-primary" />
            <h2 id="asesoria-title" className="mt-4 text-2xl">
              Asesoría de AJ Consultoría
            </h2>
            <p className="mt-2 mb-6 leading-relaxed text-muted-foreground">
              Si buscas un seguro para ti o tu familia, escríbenos para conversar sobre tus
              necesidades y preparar tu cotización.
            </p>
            <a
              href={CONTACTO_AJ}
              className="btn-outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              Contactar por WhatsApp
            </a>
          </section>
        </div>
      </div>
    </CentroShell>
  );
}
