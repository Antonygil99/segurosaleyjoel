import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HeartHandshake,
  Stethoscope,
  PiggyBank,
  ShieldCheck,
  Car,
  Building2,
  MessageCircle,
  CalendarDays,
  Ear,
  Sparkles,
  HandHeart,
  Presentation,
  Leaf,
  Instagram,
  Facebook,
  Mail,
  ArrowRight,
  ChevronDown,
  BookOpen,
} from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WA_PRIMARY, CALENDAR_URL } from "@/lib/site";
import heroAsset from "@/assets/hero-award.jpg.asset.json";

import aleAsset from "@/assets/ale-valencia.jpg.asset.json";
import joelAsset from "@/assets/joel-rodriguez.jpg.asset.json";
import communityAsset from "@/assets/community.jpg.asset.json";
import selfieAsset from "@/assets/ale-joel-selfie.jpg.asset.json";

const heroImg = heroAsset.url;
const aleImg = aleAsset.url;
const joelImg = joelAsset.url;
const communityImg = communityAsset.url;
const selfieImg = selfieAsset.url;

export const Route = createFileRoute("/")({
  component: Landing,
});

const WA_AGENDA = CALENDAR_URL;


// Simple TikTok glyph (lucide has no TikTok icon)
const TikTokIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M16.5 3a5.5 5.5 0 0 0 4.5 4.5v3a8.4 8.4 0 0 1-4.5-1.4v6.4a5.9 5.9 0 1 1-5.9-5.9c.3 0 .6 0 .9.1v3.2a2.8 2.8 0 1 0 2 2.7V3h3z" />
  </svg>
);

const seguros = [
  {
    icon: Stethoscope,
    title: "Gastos Médicos Mayores",
    text: "Para tener acceso a atención médica privada, respaldo ante enfermedades o accidentes importantes y una ruta clara cuando necesites cuidar tu salud o la de tu familia.",
  },
  {
    icon: PiggyBank,
    title: "Ahorro y Retiro",
    text: "Para cuidar de tu independencia financiera cuando decidas disminuir el ritmo, construir tranquilidad para el futuro y tomar decisiones con mayor libertad.",
  },
  {
    icon: ShieldCheck,
    title: "Vida",
    text: "Para proteger tus ingresos y a quienes dependen de ti, asegurando que las personas que amas puedan continuar con estabilidad si algún día tú faltas.",
  },
  {
    icon: Car,
    title: "Auto",
    text: "Para proteger tu movilidad, tu patrimonio y tu responsabilidad frente a otras personas en caso de accidente.",
  },
  {
    icon: Building2,
    title: "Empresarial",
    text: "Para proteger la continuidad, operación, equipo y patrimonio de tu negocio.",
  },
];

const valores = [
  { icon: Sparkles, title: "Claridad", text: "Te explicamos los seguros en palabras simples." },
  {
    icon: HandHeart,
    title: "Acompañamiento",
    text: "No desaparecemos después de emitir la póliza.",
  },
  {
    icon: Leaf,
    title: "Ética",
    text: "Si una solución no es adecuada para ti, te lo diremos.",
  },
  {
    icon: Presentation,
    title: "Presencia",
    text: "Puedes escribirnos cuando tengas dudas, necesites orientación o quieras revisar tu protección.",
  },
  {
    icon: HeartHandshake,
    title: "Cuidado",
    text: "Sabemos que detrás de cada póliza hay una familia, una historia y una decisión importante.",
  },
];

const preguntasProteccion = [
  {
    q: "Si mañana necesitaras atención médica privada, ¿sabrías a dónde acudir y cómo pagarla sin desordenar tu vida financiera?",
    a: "Un seguro de gastos médicos mayores no sólo sirve para emergencias graves. También puede darte una ruta clara de atención cuando necesitas cuidar tu salud con mayor tranquilidad.",
  },
  {
    q: "Si tu ingreso se detuviera por un tiempo, ¿cuánto tiempo podrías sostener tu vida sin afectar a tu familia?",
    a: "Proteger tus ingresos también es proteger las decisiones, proyectos y estabilidad de quienes dependen de ti.",
  },
  {
    q: "Si tienes hijos, pareja o personas que dependen de ti, ¿qué pasaría con ellos si un día tú faltaras?",
    a: "Un seguro de vida no reemplaza a una persona, pero puede ayudar a que quienes amas tengan respaldo económico para continuar.",
  },
  {
    q: "Si hoy decides bajar el ritmo de trabajo en unos años, ¿ya estás construyendo la libertad financiera para hacerlo?",
    a: "El ahorro y retiro no se tratan sólo de edad. Se tratan de independencia, tranquilidad y capacidad de decidir cómo quieres vivir más adelante.",
  },
  {
    q: "Si tuvieras un accidente automovilístico, ¿tu seguro actual realmente respondería como esperas?",
    a: "Un seguro de auto no sólo protege tu vehículo. También protege tu patrimonio y tu responsabilidad frente a otras personas.",
  },
  {
    q: "Si tienes un negocio, ¿qué tendría que pasar para detener su operación?",
    a: "La protección empresarial ayuda a cuidar la continuidad, el equipo, los activos y el esfuerzo que has construido.",
  },
  {
    q: "¿Contrataste tus seguros porque los entendiste o porque alguien te dijo que eran necesarios?",
    a: "En AJ creemos que una buena decisión empieza cuando entiendes qué estás contratando, para qué sirve y cómo se usa.",
  },
  {
    q: "¿Sabes qué seguros tienes, qué cubren y qué no cubren?",
    a: "Muchas personas tienen pólizas guardadas, pero no claridad. Revisarlas puede ayudarte a saber si tu protección sigue siendo coherente con tu realidad actual.",
  },
  {
    q: "¿Tu protección actual corresponde a la vida que tienes hoy o a una etapa anterior?",
    a: "La vida cambia: familia, ingresos, trabajo, patrimonio, salud y prioridades. Tus seguros también deberían revisarse con el tiempo.",
  },
  {
    q: "Si algo importante ocurriera, ¿tendrías a quién llamar para que te oriente paso a paso?",
    a: "Un seguro no sólo debe existir en papel. También necesitas saber cómo usarlo y contar con acompañamiento cuando llegue el momento.",
  },
  {
    q: "¿Qué parte de tu vida te daría más tranquilidad proteger hoy?",
    a: "No todos necesitan el mismo seguro ni en el mismo momento. Por eso primero escuchamos, después comprendemos y finalmente buscamos contigo la opción que tenga sentido para tu realidad.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <SiteHeader home />


      <main id="top">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary-soft blur-3xl opacity-70"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full blur-3xl opacity-60"
            style={{ backgroundColor: "var(--warm-soft)" }}
          />
          <div className="container-aj grid gap-10 py-12 md:grid-cols-2 md:items-center md:gap-12 md:py-24">

            <div>
              <span className="eyebrow">AJ Consultoría</span>
              <h1 className="mt-4 text-[2rem] leading-[1.08] sm:text-5xl md:text-6xl">
                Seguros para decidir con{" "}
                <span className="text-primary italic">claridad</span>,
                <br className="hidden sm:block" /> no desde el miedo.
              </h1>
              <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
                En AJ Consultoría primero te escuchamos. Después buscamos contigo la protección
                que tenga sentido para tu vida, tu familia, tu salud, tu patrimonio y tu futuro.
              </p>
              <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
                Acompañamos a personas, familias y empresas con información clara, trato humano
                y soluciones de seguros pensadas desde su realidad.
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
            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl border border-border shadow-[0_30px_80px_-40px_oklch(0.3_0.05_300/0.35)]">
                <img
                  src={heroImg}
                  alt="Ale y Joel conversando en un espacio cálido de AJ Consultoría"
                  width={1600}
                  height={1200}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 hidden max-w-[240px] rounded-2xl border border-border bg-card p-4 shadow-lg sm:block">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                    <Ear className="h-4 w-4" />
                  </span>
                  <p className="text-sm leading-snug text-muted-foreground">
                    Aquí primero te escuchamos antes de ofrecerte algo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* NOSOTROS */}
        <section id="nosotros" className="py-14 md:py-24">
          <div className="container-aj grid gap-14 md:grid-cols-[1fr_1.2fr] md:items-start">
            <div>
              <span className="eyebrow">Quiénes somos</span>
              <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl">Somos AJ Consultoría</h2>
            </div>
            <div className="space-y-5 text-base text-muted-foreground sm:text-lg">
              <p>No nacimos para vender seguros.</p>
              <p>
                Nacimos para acompañar a las personas a tomar mejores decisiones sobre aquello
                que quieren proteger.
              </p>
              <p>
                Creemos que un seguro no debe contratarse desde el miedo ni desde la presión.
                Debe elegirse con claridad, entendiendo qué cubre, cómo se usa, cuánto cuesta y
                si realmente responde a la vida de quien lo contrata.
              </p>
              <p>Por eso nuestra forma de trabajar comienza escuchando.</p>
              <ul className="grid gap-3 pt-2 text-foreground">
                <li className="flex gap-3"><ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" /> Primero conocemos tu situación.</li>
                <li className="flex gap-3"><ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" /> Después comprendemos qué necesitas proteger.</li>
                <li className="flex gap-3"><ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" /> Finalmente buscamos la solución más coherente para ti.</li>
              </ul>
              <blockquote className="mt-8 rounded-2xl border-l-4 border-primary bg-primary-soft/60 p-6 font-display text-xl leading-snug text-foreground sm:text-2xl">
                “Aquí primero te escuchamos antes de ofrecerte algo.”
              </blockquote>
            </div>
          </div>
        </section>

        {/* FORMA DE ACOMPAÑAR */}
        <section className="bg-secondary/60 py-14 md:py-24">
          <div className="container-aj">
            <div className="max-w-3xl">
              <span className="eyebrow">Nuestra forma de acompañar</span>
              <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl">
                Primero escuchamos. Después recomendamos.
              </h2>
            </div>
            <div className="mt-12 grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-start">
              <div className="space-y-5 text-base text-muted-foreground sm:text-lg">
                <p>Cada persona llega con una historia distinta.</p>
                <p>
                  Algunas buscan proteger a sus hijos. Otras quieren cuidar su salud. Algunas
                  necesitan proteger sus ingresos. Otras están pensando en su retiro, su empresa
                  o su patrimonio.
                </p>
                <p className="text-foreground">
                  En AJ no partimos de la póliza. <br />
                  <span className="font-medium">Partimos de la persona.</span>
                </p>
                <p>
                  Nuestro trabajo es ayudarte a entender tus opciones, resolver tus dudas y
                  acompañarte antes, durante y después de contratar.
                </p>
              </div>
              <blockquote className="card-soft font-display text-xl leading-snug sm:text-2xl">
                “La mejor póliza no es la más cara ni la más conocida. Es la que responde mejor
                a tu realidad.”
              </blockquote>
            </div>
          </div>
        </section>

        {/* SEGUROS */}
        <section id="seguros" className="py-14 md:py-24">
          <div className="container-aj">
            <div className="max-w-3xl">
              <span className="eyebrow">Lo que ofrecemos</span>
              <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl">
                Soluciones para distintas etapas de tu vida
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Cada seguro tiene sentido cuando responde a una necesidad real.
              </p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {seguros.map(({ icon: Icon, title, text }) => (
                <article key={title} className="card-soft group flex flex-col">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-xl">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* PREGUNTAS PARA PENSAR TU PROTECCIÓN */}
        <section id="preguntas" className="bg-secondary/40 py-14 md:py-24">
          <div className="container-aj">
            <div className="max-w-3xl">
              <span className="eyebrow">Reflexiona con calma</span>
              <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl">
                Preguntas para pensar tu protección
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                No se trata de contratar seguros por miedo. Se trata de mirar tu vida con claridad y preguntarte qué quieres proteger.
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-2">
              {preguntasProteccion.map(({ q, a }, idx) => (
                <details
                  key={idx}
                  className="group card-soft overflow-hidden transition-shadow open:shadow-[0_8px_30px_-20px_oklch(0.3_0.05_300/0.2)]"
                >
                  <summary className="flex cursor-pointer items-start justify-between gap-4 p-5 font-display text-lg leading-snug text-foreground list-none [&::-webkit-details-marker]:hidden">
                    {q}
                    <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-primary transition-transform duration-300 group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {a}
                  </div>
                </details>
              ))}
            </div>

            <div className="mt-14 max-w-3xl rounded-3xl border border-border bg-card p-8 sm:p-10">
              <p className="font-display text-2xl text-foreground sm:text-3xl">
                No tienes que responder todo hoy.
              </p>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                Pero si alguna de estas preguntas te hizo detenerte un momento, podemos conversar.
              </p>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                La plática de detección de necesidades existe justamente para eso: ayudarte a mirar tu situación con calma, sin presión y sin compromiso de contratar.
              </p>
              <a
                href="https://wa.me/529992399551?text=Hola%2C%20me%20gustar%C3%ADa%20revisar%20mi%20protecci%C3%B3n%20con%20AJ%20Consultor%C3%ADa"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-8"
              >
                <MessageCircle className="h-4 w-4" />
                Quiero revisar mi protección con AJ
              </a>
            </div>
          </div>
        </section>

        {/* CENTRO AJ */}
        <section className="pb-14 md:pb-20">
          <div className="container-aj">
            <div className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-8 sm:p-10 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <span className="eyebrow">Centro AJ</span>
                <p className="mt-4 font-display text-2xl leading-snug text-foreground sm:text-3xl">
                  Si prefieres entender antes de conversar, empieza por aquí.
                </p>
                <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                  El Centro AJ es nuestra biblioteca de aprendizaje: guías claras sobre cómo
                  funcionan los seguros, qué mirar en cada uno y cómo usarlos cuando llega el
                  momento.
                </p>
              </div>
              <Link to="/centro-aj" className="btn-primary shrink-0">
                <BookOpen className="h-4 w-4" />
                Entrar al Centro AJ
              </Link>
            </div>
          </div>
        </section>

        {/* EQUIPO */}
        <section id="equipo" className="bg-secondary/60 py-14 md:py-24">
          <div className="container-aj">
            <div className="max-w-3xl">
              <span className="eyebrow">Quienes te acompañan</span>
              <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl">Quienes te acompañan</h2>
              <p className="mt-5 text-lg text-muted-foreground">
                Detrás de AJ hay personas que creen en el acompañamiento cercano, la claridad y
                la responsabilidad de orientar bien.
              </p>
              <p className="mt-3 text-lg text-muted-foreground">
                No buscamos que dependas de nosotros. Buscamos que entiendas, elijas y sepas qué
                hacer cuando necesites usar tu seguro.
              </p>
            </div>

            <div className="mt-14 grid gap-8 md:grid-cols-2">
              {/* Ale */}
              <article className="card-soft">
                <div className="grid gap-6 sm:grid-cols-[160px_1fr] sm:items-start">
                  <img
                    src={aleImg}
                    alt="Ale Valencia, especialista en Gastos Médicos"
                    width={912}
                    height={1104}
                    loading="lazy"
                    className="mx-auto h-40 w-40 rounded-2xl object-cover sm:h-full sm:w-full"
                  />
                  <div>
                    <h3 className="text-2xl">Ale Valencia</h3>
                    <p className="mt-1 text-sm font-medium text-primary">Especialista en Gastos Médicos</p>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      Acompaña a personas y familias a tomar decisiones de protección desde la
                      escucha, la claridad y la detección real de necesidades.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <a href="https://wa.me/529992399551" target="_blank" rel="noopener noreferrer" className="btn-primary !py-2 !px-4 !text-xs">
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                      <a href="https://www.instagram.com/alevital.mx/" target="_blank" rel="noopener noreferrer" aria-label="Instagram Ale Vital" className="btn-outline !p-2.5"><Instagram className="h-4 w-4" /></a>
                      <a href="https://www.tiktok.com/@alevalenciavital" target="_blank" rel="noopener noreferrer" aria-label="TikTok Ale Vital" className="btn-outline !p-2.5"><TikTokIcon /></a>
                      <a href="https://www.facebook.com/Ale.Valencia.Metlife/" target="_blank" rel="noopener noreferrer" aria-label="Facebook Ale" className="btn-outline !p-2.5"><Facebook className="h-4 w-4" /></a>
                      <a href="mailto:alenvr@gmail.com" aria-label="Correo Ale" className="btn-outline !p-2.5"><Mail className="h-4 w-4" /></a>
                    </div>
                  </div>
                </div>
              </article>

              {/* Joel */}
              <article className="card-soft">
                <div className="grid gap-6 sm:grid-cols-[160px_1fr] sm:items-start">
                  <img
                    src={joelImg}
                    alt="Joel Rodríguez, experto en Seguro de Auto"
                    width={912}
                    height={1104}
                    loading="lazy"
                    className="mx-auto h-40 w-40 rounded-2xl object-cover sm:h-full sm:w-full"
                  />
                  <div>
                    <h3 className="text-2xl">Joel Rodríguez</h3>
                    <p className="mt-1 text-sm font-medium text-primary">Experto en Seguro de Auto</p>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      Acompaña a personas, familias y negocios a proteger su movilidad,
                      patrimonio y continuidad con soluciones claras y bien explicadas.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <a href="https://wa.me/529999690538" target="_blank" rel="noopener noreferrer" className="btn-primary !py-2 !px-4 !text-xs">
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                      <a href="https://www.instagram.com/expertoseguroautos/" target="_blank" rel="noopener noreferrer" aria-label="Instagram Experto Seguro Autos" className="btn-outline !p-2.5"><Instagram className="h-4 w-4" /></a>
                      <a href="https://www.tiktok.com/@expertoseguroautos" target="_blank" rel="noopener noreferrer" aria-label="TikTok Experto Seguro Autos" className="btn-outline !p-2.5"><TikTokIcon /></a>
                      <a href="https://www.facebook.com/JoyShingoRodriguez" target="_blank" rel="noopener noreferrer" aria-label="Facebook Joel" className="btn-outline !p-2.5"><Facebook className="h-4 w-4" /></a>
                      <a href="mailto:joeldrodriguezd@gmail.com" aria-label="Correo Joel" className="btn-outline !p-2.5"><Mail className="h-4 w-4" /></a>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* AGENDA */}
        <section id="agenda" className="py-14 md:py-24">
          <div className="container-aj">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 sm:p-12 md:p-16">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary-soft blur-3xl"
              />
              <div className="relative grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-start">
                <div>
                  <span className="eyebrow">Plática de detección de necesidades</span>
                  <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl">
                    Antes de ofrecerte algo, queremos entenderte
                  </h2>
                  <div className="mt-6 space-y-4 text-base text-muted-foreground sm:text-lg">
                    <p>
                      La plática de detección de necesidades es una conversación breve para
                      conocer tu momento actual, tus prioridades y aquello que quieres proteger.
                    </p>
                    <p>
                      No es una llamada para presionarte. No es una venta forzada. Es un espacio
                      para escucharte, orientarte y ayudarte a ver con claridad qué opciones
                      podrían tener sentido para ti.
                    </p>
                  </div>
                </div>
                <div>
                  <div className="card-soft">
                    <p className="text-sm font-medium text-foreground">En esta conversación podemos revisar:</p>
                    <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                      {[
                        "Qué quieres proteger.",
                        "Qué te preocupa.",
                        "Qué seguros tienes actualmente.",
                        "Qué necesitas entender mejor.",
                        "Qué solución podría ser coherente con tu realidad.",
                      ].map((t) => (
                        <li key={t} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          {t}
                        </li>
                      ))}
                    </ul>
                    <a
                      href={WA_AGENDA}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary mt-6 w-full"
                    >
                      <CalendarDays className="h-4 w-4" />
                      Agendar mi plática
                    </a>
                    <p className="mt-3 text-center text-xs text-muted-foreground">
                      Agenda directamente en Google Calendar, sin compromiso.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MANERA DE TRABAJAR */}
        <section className="bg-secondary/60 py-14 md:py-24">
          <div className="container-aj">
            <div className="max-w-3xl">
              <span className="eyebrow">Nuestra manera de trabajar</span>
              <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl">
                Lo que puedes esperar de nosotros
              </h2>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {valores.map(({ icon: Icon, title, text }) => (
                <div key={title} className="card-soft">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-lg">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMUNIDAD */}
        <section className="py-14 md:py-24">
          <div className="container-aj grid gap-10 md:grid-cols-2 md:items-center">
            <div className="overflow-hidden rounded-3xl border border-border">
              <img
                src={selfieImg}
                alt="Ale y Joel, cercanos y sonrientes en un momento cotidiano"
                width={1600}
                height={1008}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <span className="eyebrow">Comunidad y cercanía</span>
              <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl">
                Acompañamos desde la vida real
              </h2>
              <div className="mt-6 space-y-4 text-base text-muted-foreground sm:text-lg">
                <p>AJ Consultoría no existe sólo detrás de un escritorio.</p>
                <p>
                  Estamos presentes en conversaciones, familias, proyectos, comunidades y
                  decisiones importantes. Creemos que la confianza se construye estando cerca,
                  escuchando con atención y respondiendo con claridad.
                </p>
                <p>Por eso nuestra forma de trabajar es sencilla:</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Escuchamos.", "Comprendemos.", "Acompañamos.", "Y sólo entonces recomendamos."].map((w) => (
                  <span key={w} className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
        {/* DIRECTORIO DE CONTACTO */}
        <section id="contacto" className="py-14 md:py-24">
          <div className="container-aj">
            <div className="max-w-2xl">
              <span className="eyebrow">Directorio</span>
              <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl">
                Escríbenos cuando quieras
              </h2>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                Estamos a un mensaje de distancia. Elige el canal con el que te sientas más cómodo/a.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {/* Ale contacto */}
              <div
                className="card-soft"
                style={{ backgroundColor: "color-mix(in oklab, var(--warm-soft) 40%, var(--card))" }}
              >
                <p className="font-display text-2xl">Ale Valencia</p>
                <p className="mt-1 text-sm text-muted-foreground">Gastos Médicos · Vida · Ahorro</p>
                <div className="mt-5 space-y-2 text-sm">
                  <a href="https://wa.me/529992399551" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-primary-soft/60 transition-colors">
                    <MessageCircle className="h-4 w-4 text-primary" /> WhatsApp · 999 239 9551
                  </a>
                  <a href="mailto:alenvr@gmail.com" className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-primary-soft/60 transition-colors">
                    <Mail className="h-4 w-4 text-primary" /> alenvr@gmail.com
                  </a>
                  <a href="https://www.instagram.com/alevital.mx/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-primary-soft/60 transition-colors">
                    <Instagram className="h-4 w-4 text-primary" /> @alevital.mx
                  </a>
                  <a href="https://www.tiktok.com/@alevalenciavital" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-primary-soft/60 transition-colors">
                    <TikTokIcon className="h-4 w-4 text-primary" /> @alevalenciavital
                  </a>
                  <a href="https://www.facebook.com/Ale.Valencia.Metlife/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-primary-soft/60 transition-colors">
                    <Facebook className="h-4 w-4 text-primary" /> Ale Valencia
                  </a>
                </div>
              </div>

              {/* Joel contacto */}
              <div
                className="card-soft"
                style={{ backgroundColor: "color-mix(in oklab, var(--primary-soft) 45%, var(--card))" }}
              >
                <p className="font-display text-2xl">Joel Rodríguez</p>
                <p className="mt-1 text-sm text-muted-foreground">Auto · Empresarial · Patrimonio</p>
                <div className="mt-5 space-y-2 text-sm">
                  <a href="https://wa.me/529999690538" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-primary-soft/60 transition-colors">
                    <MessageCircle className="h-4 w-4 text-primary" /> WhatsApp · 999 969 0538
                  </a>
                  <a href="mailto:joeldrodriguezd@gmail.com" className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-primary-soft/60 transition-colors">
                    <Mail className="h-4 w-4 text-primary" /> joeldrodriguezd@gmail.com
                  </a>
                  <a href="https://www.instagram.com/expertoseguroautos/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-primary-soft/60 transition-colors">
                    <Instagram className="h-4 w-4 text-primary" /> @expertoseguroautos
                  </a>
                  <a href="https://www.tiktok.com/@expertoseguroautos" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-primary-soft/60 transition-colors">
                    <TikTokIcon className="h-4 w-4 text-primary" /> @expertoseguroautos
                  </a>
                  <a href="https://www.facebook.com/JoyShingoRodriguez" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-primary-soft/60 transition-colors">
                    <Facebook className="h-4 w-4 text-primary" /> Joel Rodríguez
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACTO */}
        <section className="pb-14 md:pb-24">

          <div className="container-aj">
            <div className="rounded-3xl border border-border bg-gradient-to-br from-primary to-[oklch(0.42_0.16_305)] p-8 text-primary-foreground sm:p-12 md:p-16">
              <span className="inline-block text-xs uppercase tracking-[0.14em] text-primary-foreground/80">
                Hablemos
              </span>
              <h2 className="mt-4 max-w-3xl text-3xl sm:text-4xl md:text-5xl">
                Hablemos con calma sobre lo que quieres proteger
              </h2>
              <p className="mt-5 max-w-2xl text-primary-foreground/90 sm:text-lg">
                Si estás buscando orientación para proteger tu salud, tu familia, tus ingresos,
                tu retiro, tu auto o tu empresa, podemos ayudarte a revisar tus opciones con
                calma. Puedes escribirnos directamente por WhatsApp o agendar una plática de
                detección de necesidades.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={WA_PRIMARY}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-medium text-foreground transition-transform hover:-translate-y-0.5"
                >
                  <MessageCircle className="h-4 w-4" />
                  Hablar con AJ Consultoría
                </a>
                <a
                  href={WA_AGENDA}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/40 px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10"
                >
                  <CalendarDays className="h-4 w-4" />
                  Agendar plática
                </a>
              </div>
              <div className="mt-10 flex flex-wrap gap-2">
                <a href="https://www.instagram.com/alevital.mx/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-4 py-2 text-xs text-primary-foreground/90 hover:bg-primary-foreground/10">
                  <Instagram className="h-3.5 w-3.5" /> Ale Vital
                </a>
                <a href="https://www.instagram.com/expertoseguroautos/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-4 py-2 text-xs text-primary-foreground/90 hover:bg-primary-foreground/10">
                  <Instagram className="h-3.5 w-3.5" /> Experto Seguro Autos
                </a>
                <a href="https://www.tiktok.com/@alevalenciavital" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-4 py-2 text-xs text-primary-foreground/90 hover:bg-primary-foreground/10">
                  <TikTokIcon className="h-3.5 w-3.5" /> Ale Vital
                </a>
                <a href="https://www.tiktok.com/@expertoseguroautos" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-4 py-2 text-xs text-primary-foreground/90 hover:bg-primary-foreground/10">
                  <TikTokIcon className="h-3.5 w-3.5" /> Experto Seguro Autos
                </a>
              </div>
              <div className="mt-12 border-t border-primary-foreground/20 pt-8">
                <p className="font-display text-2xl">AJ Consultoría</p>
                <p className="mt-1 text-primary-foreground/80">
                  Protección con claridad, escucha y acompañamiento humano.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter home />

    </div>
  );
}
