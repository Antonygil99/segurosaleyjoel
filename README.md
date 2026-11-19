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

La ruta `/metlife/cotizador` utiliza las tablas de la versión 7.6. Incluye Vida tradicional (TempoLife, TempoLife Grandes Sumas, TempoLife Preferente, TotaLife, PerfectLife y Horizonte con pago a 5 y 10 años en pesos crecientes o hasta la edad alcanzada), MédicaLife, Primordial Familiar y MetPlus. La vista de resultados admite impresión o guardado como PDF desde el navegador. En Vida tradicional se pueden combinar planes con un mismo perfil, moneda y forma de pago.

Horizonte incluye el ejemplo fiscal de la cuenta especial de ahorro de Windows 7.6, con el tipo de cambio de la cotización cuando se eligen dólares. Desde Primordial Familiar se puede cotizar MédicaLife con las mismas personas y forma de pago, y consultar el total conjunto, el primer pago y los pagos subsecuentes.

Met4U permite cotizar la prima inicial para 10 años o hasta los 65, con invalidez y coberturas opcionales de cáncer, diabetes y enfermedades graves. Para importar su tarifario, usa el archivo `Met4U.db` del mismo JAR y la conexión `DATA_URL`:

```sh
node scripts/import-met4u-tariffs.mjs /ruta/a/Met4U.db
```

La proyección de Met4U usa los costos mensuales de la versión 7.6 y muestra el cierre de cada año hasta los 65. Admite los escenarios optimista, promedio y conservador para fondos fijos y variables, con reparto de la aportación anual programada y sin retiros.

EducaLife calcula primas en pesos y dólares, con titular, menor, cónyuge opcional, dotal y mini dotales. Muestra primas por cobertura y valores de rescate por año. Para cargar sus tarifas y factores mediante `DATA_URL`, ejecuta:

```sh
node scripts/import-educalife-tariffs.mjs /ruta/a/dbMetaLife.db
```

Para cargar tarifas y valores garantizados, extrae estas bases SQLite del directorio `datos/` del JAR y guárdalas juntas:

- `dbMetaLife.db`
- `MedicaLifeNN.db` y `MedicaLifeNNcampa.db`
- `MedicaLifeRR.db`, `MedicaLifeRRant.db`, `MedicaLifeRRant2.db` y `MedicaLifeRRant3.db`

Con Node.js 22 o superior y `DATA_URL` disponible en el entorno, ejecuta:

```sh
node scripts/import-metlife-tariffs.mjs /ruta/a/dbMetaLife.db
```

El importador actualiza los tarifarios de Vida, valores garantizados y tarifas de Salud en una transacción dentro del esquema `metlife_cotizador`. Mantén los archivos SQLite, sus tarifas y la cadena de conexión fuera de Git.

Quedan pendientes MetaLife y su reproyección, FlexiLife, metas y retiros de Met4U, valores saldados y prorrogados de EducaLife, las combinaciones con MetaLife y los informes específicos del software de escritorio.
