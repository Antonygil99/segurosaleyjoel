// Datos compartidos de navegación y contacto para todo el sitio.
// Cambiar aquí se refleja en el Home y en el Centro AJ.

export const WA_PRIMARY = "https://wa.me/529992399551";
export const CALENDAR_URL = "https://calendar.app.google/Mj8qYKzasSw216WV8";

export type NavItem =
  | { label: string; hash: string }
  | { label: string; to: "/centro-aj" | "/ale-te-explica" };

export const NAV_ITEMS: NavItem[] = [
  { label: "Nosotros", hash: "nosotros" },
  { label: "Seguros", hash: "seguros" },
  { label: "Preguntas", hash: "preguntas" },
  { label: "Centro AJ", to: "/centro-aj" },
  { label: "Ale te explica", to: "/ale-te-explica" },
  { label: "Equipo", hash: "equipo" },
  { label: "Contacto", hash: "contacto" },
];
