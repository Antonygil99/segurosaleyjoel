import { createFileRoute } from "@tanstack/react-router";
import {
  Ambulance,
  ArrowRight,
  Baby,
  Building2,
  ChevronDown,
  FlaskConical,
  Heart,
  HeartPulse,
  Info,
  MessageCircle,
  Pill,
  Play,
  ScanLine,
  Scissors,
  Sparkles,
  Stethoscope,
  UserRound,
} from "lucide-react";

import { GuiaShell, WA_DUDAS, WA_MEDICA_VITAL } from "@/components/guia/guia-shell";
import { Reveal } from "@/components/guia/reveal";
import aleFoto from "@/assets/ale-valencia.jpg.asset.json";
import familia from "@/assets/guia-familia.png";
import {
  ANTES_DE_CONTRATAR,
  COBERTURAS,
  FAQ,
  GUIA_MV,
  NOTA_INFORMATIVA,
  NOVEDAD,
  PARA_QUIEN_NO,
  PARA_QUIEN_SI,
  PILARES,
  RUTA_PASOS,
  SOBRE_ALE,
  VIDEOS,
} from "@/content/ale-te-explica/medica-vital";

const SITE = "https://ajconsultoria.lovable.app";
const TITLE = "Médica Vital explicado fácil | Ale te explica · Guía 01";
const DESC =
  "Guía educativa para entender Médica Vital en palabras sencillas: qué cubre, para quién sí y para quién no, cómo funciona y qué saber antes de contratar.";

export const Route = createFileRoute("/ale-te-explica/medica-vital")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `${SITE}/ale-te-explica/medica-vital` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: `${SITE}/ale-te-explica/medica-vital` }],
  }),
  component: GuiaMedicaVital,
});

const ICONOS = {
  stethoscope: Stethoscope,
  hospital: Building2,
  ambulance: Ambulance,
  pill: Pill,
  flask: FlaskConical,
  scan: ScanLine,
  userRound: UserRound,
  scissors: Scissors,
  baby: Baby,
  ribbon: HeartPulse,
  heart: Heart,
} as const;

function Seccion({
  id,
  eyebrow,
  titulo,
  descripcion,
  children,
  tono = "blanco",
}: {
  id?: string;
  eyebrow?: string;
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
  tono?: "blanco" | "suave";
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 py-16 sm:py-24 ${tono === "suave" ? "bg-secondary/60" : ""}`}
    >
      <div className="mx-auto w-full max-w-5xl px-5">
        <Reveal>
          {eyebrow && <span className="guia-chip">{eyebrow}</span>}
          <h2 className="mt-5 max-w-2xl text-3xl leading-[1.1] sm:text-[2.75rem]">{titulo}</h2>
          {descripcion && (
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              {descripcion}
            </p>
          )}
        </Reveal>
        <div className="mt-10 sm:mt-14">{children}</div>
      </div>
    </section>
  );
}

function GuiaMedicaVital() {
  return (
    <GuiaShell numero={GUIA_MV.numero} titulo="Médica Vital explicado fácil">
      {/* 1 — HERO ------------------------------------------------------ */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-primary-soft blur-3xl opacity-70"
        />
        <div className="relative mx-auto grid w-full max-w-5xl items-center gap-10 px-5 pt-14 pb-16 sm:pt-20 sm:pb-24 lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal>
            <span className="guia-chip">💜 Ale te explica · {GUIA_MV.numero}</span>
            <h1 className="mt-6 text-[2.5rem] leading-[1.03] sm:text-6xl">{GUIA_MV.titulo}</h1>
            <p className="mt-5 text-lg text-foreground/80 sm:text-2xl sm:leading-snug">
              {GUIA_MV.subtitulo}
            </p>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              {GUIA_MV.intro}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#que-es" className="btn-primary">
                Comenzar
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={WA_MEDICA_VITAL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                <MessageCircle className="h-4 w-4" />
                Cotizar por WhatsApp
              </a>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <img
              src={familia}
              alt="Ilustración de una familia de cuatro integrantes tomados de la mano"
              width={1280}
              height={960}
              className="mx-auto w-full max-w-md lg:max-w-none"
            />
          </Reveal>
        </div>
      </section>

      {/* 2 — ¿QUÉ ES? -------------------------------------------------- */}
      <Seccion
        id="que-es"
        tono="suave"
        eyebrow="Lo esencial"
        titulo="¿Qué es Médica Vital?"
        descripcion="Un plan de salud que te acompaña en tres momentos: cuando algo te molesta, cuando necesitas un hospital y cuando la situación no puede esperar."
      >
        <div className="grid gap-5 md:grid-cols-3">
          {PILARES.map((p, i) => {
            const Icono = ICONOS[p.icono];
            return (
              <Reveal key={p.titulo} delay={i * 90}>
                <article className="guia-card h-full bg-card p-7 sm:p-8">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
                    <Icono className="h-7 w-7" />
                  </span>
                  <h3 className="mt-6 text-xl sm:text-2xl">{p.titulo}</h3>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">{p.texto}</p>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={260}>
          <div className="mt-6 rounded-[1.75rem] border border-primary/25 bg-primary p-7 text-primary-foreground sm:p-9">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-widest uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              Nuevo
            </span>
            <p className="mt-5 text-2xl leading-snug font-semibold sm:text-3xl">{NOVEDAD}</p>
          </div>
        </Reveal>
      </Seccion>

      {/* 3 — ¿PARA QUIÉN? --------------------------------------------- */}
      <Seccion
        eyebrow="Con honestidad"
        titulo="¿Para quién sí es?"
        descripcion="Este plan le acomoda especialmente a quienes quieren atenderse con calma, desde una gripa hasta una cirugía."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {PARA_QUIEN_SI.map((t, i) => (
            <Reveal key={t} delay={i * 70}>
              <div className="flex h-full items-start gap-4 rounded-[1.5rem] border border-border bg-primary-soft/50 p-6">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm text-primary-foreground">
                  ✓
                </span>
                <p className="text-base text-foreground sm:text-lg">{t}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <h3 className="mt-16 text-2xl sm:text-[2rem]">¿Para quién probablemente NO es?</h3>
          <p className="mt-3 max-w-xl text-base text-muted-foreground sm:text-lg">
            Decirlo antes es parte de acompañarte bien. Si te encuentras aquí, buscamos otra
            alternativa juntos.
          </p>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {PARA_QUIEN_NO.map((t, i) => (
            <Reveal key={t} delay={i * 70}>
              <div className="flex h-full items-start gap-4 rounded-[1.5rem] border border-border bg-secondary p-6">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-background text-sm text-muted-foreground">
                  ✕
                </span>
                <p className="text-base text-muted-foreground sm:text-[1.05rem]">{t}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Seccion>

      {/* 4 — ¿CÓMO FUNCIONA? ------------------------------------------ */}
      <Seccion
        tono="suave"
        eyebrow="El momento real"
        titulo="¿Cómo funciona?"
        descripcion="Imagina un día cualquiera. Algo no anda bien. Esto es lo que pasa después."
      >
        <div className="flex flex-col items-center">
          <Reveal>
            <div className="rounded-full border border-primary/25 bg-card px-8 py-5 text-center shadow-[0_20px_50px_-30px_oklch(0.4_0.2_288/0.6)]">
              <span className="text-3xl">🤒</span>
              <p className="mt-1 text-xl font-semibold sm:text-2xl">Me siento mal…</p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div aria-hidden className="my-4 h-10 w-px bg-primary/30" />
          </Reveal>

          <div className="grid w-full gap-4 sm:grid-cols-2">
            {[
              {
                emoji: "👨‍⚕️",
                titulo: "Médico General",
                texto: "Puede esperar. Agendas tu consulta y empiezas por ahí.",
              },
              {
                emoji: "🚨",
                titulo: "Urgencias",
                texto: "No puede esperar. Vas directo y te atienden.",
              },
            ].map((c, i) => (
              <Reveal key={c.titulo} delay={120 + i * 120}>
                <div className="guia-card h-full bg-card text-center">
                  <span className="text-3xl">{c.emoji}</span>
                  <h3 className="mt-3 text-xl">{c.titulo}</h3>
                  <p className="mt-2 text-sm text-muted-foreground sm:text-base">{c.texto}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <div aria-hidden className="my-4 h-10 w-px bg-primary/30" />
            <p className="text-center text-sm tracking-widest text-muted-foreground uppercase">
              Los dos caminos siguen igual
            </p>
          </Reveal>

          <ol className="mt-8 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {RUTA_PASOS.map((p, i) => (
              <Reveal key={p.titulo} delay={i * 80}>
                <li className="guia-card h-full bg-card">
                  <span className="text-xs font-semibold tracking-widest text-primary">
                    0{i + 1}
                  </span>
                  <h3 className="mt-2 text-lg sm:text-xl">{p.titulo}</h3>
                  <p className="mt-2 text-sm text-muted-foreground sm:text-base">{p.texto}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </Seccion>

      {/* 5 — ¿QUÉ SÍ CUBRE? ------------------------------------------- */}
      <Seccion eyebrow="Cobertura" titulo="¿Qué sí cubre?">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {COBERTURAS.map((c, i) => {
            const Icono = ICONOS[c.icono];
            return (
              <Reveal key={c.titulo} delay={i * 50}>
                <div className="guia-card flex h-full flex-col items-start gap-4 bg-card p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Icono className="h-5.5 w-5.5" />
                  </span>
                  <p className="text-base font-medium sm:text-lg">{c.titulo}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Seccion>

      {/* 6 — ANTES DE CONTRATAR --------------------------------------- */}
      <Seccion
        tono="suave"
        eyebrow="Con transparencia"
        titulo="Lo que necesitas conocer antes de contratar"
        descripcion="Cinco cosas que prefiero explicarte hoy, con calma, y no el día que necesitas usar tu seguro."
      >
        <div className="grid gap-3">
          {ANTES_DE_CONTRATAR.map((item, i) => (
            <Reveal key={item.titulo} delay={i * 60}>
              <details className="group rounded-[1.5rem] border border-border bg-card px-6 py-5 transition-colors open:border-primary/25">
                <summary className="flex cursor-pointer list-none items-center gap-4">
                  <span className="text-xl">{item.emoji}</span>
                  <span className="flex-1 text-lg font-medium sm:text-xl">{item.titulo}</span>
                  <ChevronDown className="h-5 w-5 shrink-0 text-primary transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">{item.texto}</p>
              </details>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mt-8 flex items-start gap-4 rounded-[1.5rem] border border-primary/20 bg-primary-soft/60 p-7">
            <Info className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <p className="text-base leading-relaxed text-foreground sm:text-lg">
              {NOTA_INFORMATIVA}
            </p>
          </div>
        </Reveal>
      </Seccion>

      {/* 7 — VIDEOS --------------------------------------------------- */}
      <Seccion
        eyebrow="💜 Ale te explica"
        titulo="En video, en dos minutos"
        descripcion="Explicaciones cortas para verlas cuando quieras. Pronto disponibles."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {VIDEOS.map((v, i) => (
            <Reveal key={v.titulo} delay={i * 80}>
              <article className="group overflow-hidden rounded-[1.75rem] border border-border bg-card transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_28px_70px_-40px_oklch(0.3_0.12_288/0.55)]">
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[oklch(0.30_0.12_288)] to-[oklch(0.55_0.24_288)]">
                  {v.embedUrl ? (
                    <iframe
                      src={v.embedUrl}
                      title={v.titulo}
                      allowFullScreen
                      loading="lazy"
                      className="h-full w-full"
                    />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="grid h-16 w-16 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition-transform duration-500 group-hover:scale-110">
                        <Play className="h-6 w-6 translate-x-[1px]" />
                      </span>
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-4 p-6">
                  <h3 className="text-lg leading-snug sm:text-xl">{v.titulo}</h3>
                  <span className="shrink-0 text-[11px] tracking-wide text-muted-foreground uppercase">
                    {v.duracion}
                  </span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Seccion>

      {/* 8 — FAQ ------------------------------------------------------ */}
      <Seccion tono="suave" eyebrow="Dudas comunes" titulo="Preguntas frecuentes">
        <div className="grid gap-3">
          {FAQ.map((f, i) => (
            <Reveal key={f.pregunta} delay={i * 50}>
              <details className="group rounded-[1.5rem] border border-border bg-card px-6 py-5 open:border-primary/25">
                <summary className="flex cursor-pointer list-none items-center gap-4">
                  <span className="flex-1 text-lg font-medium sm:text-xl">{f.pregunta}</span>
                  <ChevronDown className="h-5 w-5 shrink-0 text-primary transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  {f.respuesta}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </Seccion>

      {/* 9 — SOBRE ALE ----------------------------------------------- */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-10 px-5 lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal>
            <img
              src={aleFoto.url}
              alt="Ale Valencia, agente de seguros y autora de la guía"
              loading="lazy"
              className="aspect-[4/5] w-full rounded-[2rem] object-cover"
            />
          </Reveal>
          <Reveal delay={100}>
            <span className="guia-chip">Quién te explica</span>
            <h2 className="mt-5 text-3xl sm:text-[2.75rem]">{SOBRE_ALE.titulo}</h2>
            <div className="mt-6 space-y-4 text-base text-muted-foreground sm:text-lg">
              {SOBRE_ALE.parrafos.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* 10 — CTA FINAL ---------------------------------------------- */}
      <section className="relative overflow-hidden border-t border-border py-20 sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-14rem] left-1/2 h-[26rem] w-[42rem] -translate-x-1/2 rounded-full bg-primary-soft blur-3xl opacity-80"
        />
        <div className="relative mx-auto w-full max-w-2xl px-5 text-center">
          <Reveal>
            <h2 className="text-3xl leading-tight sm:text-5xl">¿Te quedaron dudas?</h2>
            <p className="mt-5 text-lg text-muted-foreground sm:text-xl">
              Será un gusto ayudarte a resolverlas.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <a href={WA_DUDAS} target="_blank" rel="noopener noreferrer" className="btn-primary">
                <MessageCircle className="h-4 w-4" />
                Hablar con Ale por WhatsApp
              </a>
              <a
                href={WA_MEDICA_VITAL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                Solicitar cotización
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </GuiaShell>
  );
}
