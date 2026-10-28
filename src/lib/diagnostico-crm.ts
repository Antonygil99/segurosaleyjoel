import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  nombre: z.string().trim().min(2).max(150),
  rango_edad: z.string().max(80), ciudad_estado: z.string().max(150),
  proteger: z.string().max(500), whatsapp: z.string().regex(/^\+?[0-9 ()-]{8,25}$/),
  autoriza_contacto: z.literal(true),
  respuestas: z.record(z.string().max(20), z.string().max(100)).refine(v => Object.keys(v).length <= 12),
  puntaje: z.number().int().min(0).max(100), nivel: z.enum(['verde', 'amarillo', 'rojo']),
  intencion: z.string().max(500).nullable(),
  utm: z.record(z.string().max(100), z.string().max(500)).refine(v => Object.keys(v).length <= 10),
});

// The CRM integration credential is read only inside the server handler.
export const enviarDiagnosticoCRM = createServerFn({ method: 'POST' })
  .inputValidator(schema)
  .handler(async ({ data }) => {
    const token = process.env.AJ_API_TOKEN;
    if (!token) throw new Error('La conexión con el CRM aún no está configurada.');
    const notes = JSON.stringify({ origen: 'Autodiagnóstico web', ...data, recibido: new Date().toISOString() });
    if (notes.length > 5000) throw new Error('El diagnóstico excede el tamaño permitido.');
    const response = await fetch('https://crm.segurosaleyjoel.com/api/crm/prospectos', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: data.nombre, phone: data.whatsapp, source: 'web-segurosaleyjoel', notes }),
    });
    if (!response.ok) throw new Error('No se pudo guardar en el CRM. Contacta a AJ antes de reintentar.');
    return { guardado: true };
  });
