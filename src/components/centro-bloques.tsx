import { ArrowRight } from "lucide-react";

import type { SeccionBloque } from "@/content/centro-aj";

export function Bloque({ bloque }: { bloque: SeccionBloque }) {
  switch (bloque.tipo) {
    case "lista":
      return (
        <ul className="mt-5 grid gap-3">
          {bloque.items.map((item, i) => (
            <li key={i} className="flex gap-3">
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
              <span className="text-base text-muted-foreground sm:text-lg">{item}</span>
            </li>
          ))}
        </ul>
      );
    case "faq":
      return (
        <div className="mt-6 grid gap-3">
          {bloque.items.map((item, i) => (
            <details key={i} className="card-soft group">
              <summary className="flex cursor-pointer list-none items-start gap-3 font-display text-lg text-foreground">
                <span className="flex-1">{item.pregunta}</span>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {item.respuesta}
              </p>
            </details>
          ))}
        </div>
      );
    case "terminos":
      return (
        <dl className="mt-6 grid gap-4">
          {bloque.items.map((t) => (
            <div key={t.termino} className="card-soft">
              <dt className="font-display text-lg text-foreground">{t.termino}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t.definicion}
              </dd>
            </div>
          ))}
        </dl>
      );
    default:
      return (
        <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
          {bloque.texto}
        </p>
      );
  }
}
