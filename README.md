# segurosaleyjoel

Sitio de AJ Consultoría, importado del proyecto proporcionado. Incluye la página principal, Centro AJ y Ale te explica.

## Desarrollo

Requiere Node.js 22. Instala con `npm install` y ejecuta `npm run dev`.
Para compilar: `npm run build`.

## Pendientes para publicación

- Fotos y logotipos recuperados del sitio original y guardados en `public/images`.
- Para guardar diagnósticos se necesitan `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en un archivo `.env.local`, además de aplicar las migraciones incluidas a la base correspondiente. Nunca uses claves secretas como variables VITE.
- La configuración original usa TanStack Start y el adaptador de Lovable/Cloudflare; no es un sitio estático listo para GitHub Pages.

## Repositorio de destino

https://github.com/Antonygil99/segurosaleyjoel

