CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.diagnosticos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  nombre text NOT NULL,
  rango_edad text,
  ciudad_estado text,
  proteger text,
  whatsapp text,
  autoriza_contacto boolean NOT NULL DEFAULT false,
  respuestas jsonb NOT NULL DEFAULT '{}'::jsonb,
  puntaje integer NOT NULL DEFAULT 0,
  nivel text NOT NULL,
  intencion text,
  utm jsonb NOT NULL DEFAULT '{}'::jsonb,
  seguimiento text NOT NULL DEFAULT 'nuevo',
  notas text
);
GRANT INSERT ON public.diagnosticos TO anon, authenticated;
GRANT SELECT, UPDATE ON public.diagnosticos TO authenticated;
GRANT ALL ON public.diagnosticos TO service_role;
ALTER TABLE public.diagnosticos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cualquiera puede guardar su diagnostico" ON public.diagnosticos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins leen diagnosticos" ON public.diagnosticos FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins actualizan diagnosticos" ON public.diagnosticos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.diagnostico_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  sesion text NOT NULL,
  evento text NOT NULL,
  pregunta text,
  nivel text,
  utm jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT INSERT ON public.diagnostico_eventos TO anon, authenticated;
GRANT SELECT ON public.diagnostico_eventos TO authenticated;
GRANT ALL ON public.diagnostico_eventos TO service_role;
ALTER TABLE public.diagnostico_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cualquiera registra eventos" ON public.diagnostico_eventos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins leen eventos" ON public.diagnostico_eventos FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER diagnosticos_updated_at BEFORE UPDATE ON public.diagnosticos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();