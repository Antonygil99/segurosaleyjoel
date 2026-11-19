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



## Cotizador MetLife

La ruta `/metlife/cotizador` calcula la cobertura básica de TempoLife, TempoLife Grandes Sumas y TempoLife Preferente en MXN y USD. Usa tasas de la versión 7.6, cargos fijos y recargos por frecuencia. Las coberturas adicionales y la proyección del instalador quedan pendientes.

Para cargar las tarifas, extrae `datos/dbMetaLife.db` del JAR incluido en el instalador. Con Node.js 22 y `DATABASE_URL` disponible en el entorno de la base de datos de destino, ejecuta:

```sh
node scripts/import-metlife-tariffs.mjs /ruta/a/dbMetaLife.db
```

El importador crea el esquema `metlife_cotizador` y actualiza sus tarifas en una transacción. Ejecuta una vez por base de datos de destino. El servidor consulta la misma variable `DATABASE_URL` durante el cálculo. Mantén el archivo SQLite, sus tarifas y la cadena de conexión fuera de Git.
