# segurosaleyjoel

Sitio de AJ Consultoría, importado del proyecto proporcionado. Incluye la página principal, Centro AJ y Ale te explica.

## Desarrollo

Requiere Node.js 22. Instala con `npm install` y ejecuta `npm run dev`.
Para compilar: `npm run build`.

## Pendientes para publicación

- Fotos y logotipos recuperados del sitio original y guardados en `public/images`.
- El guardado usa POST https://crm.segurosaleyjoel.com/api/crm/prospectos. Configurar AJ_API_TOKEN únicamente en el servidor con la credencial de integración del CRM. No utiliza Supabase. El formulario de diagnóstico no está incluido en las rutas de este ZIP: el adaptador está preparado, pendiente de conectar a la interfaz y verificar en el alojamiento. Se requiere autorización de contacto; las respuestas quedan en las notas del prospecto. No se envían eventos de navegación.
- La configuración original usa TanStack Start y el adaptador de Lovable/Cloudflare; no es un sitio estático listo para GitHub Pages.

## Repositorio de destino

https://github.com/Antonygil99/segurosaleyjoel


