# MarcaCheck 360 · MVP

Plataforma de prediagnóstico marcario para Colombia. Permite investigar cualquier nombre o signo en una, varias o las 45 clases de la Clasificación Internacional de Niza.

## Estado actual

- Búsqueda operativa en modo invitado y autenticado.
- Modo invitado con motor local de respaldo e historial en `localStorage`.
- Supabase Auth para usuarios que desean persistencia en la nube.
- Catálogo base de las 45 clases Niza, versionado como `NCL 13-2026`.
- Recomendación automática mediante `recommend_nice_classes(description text)`.
- Selección manual, recomendada o barrido de las 45 clases.
- Persistencia de búsquedas, clases, coincidencias y estado de fuentes.
- Row Level Security por usuario.
- Edge Function `analyze-mark` v2.
- El riesgo jurídico global permanece `insufficient` mientras SIPI y RUES no estén completos.
- Coincidencias demo claramente identificadas y separadas de datos oficiales.
- Historial persistente para usuarios autenticados.
- Vista imprimible/PDF desde el navegador.
- Diseño responsive.

## Backend

Proyecto Supabase: `MarcaCheck 360`.

Tablas principales:

- `nice_classes`
- `nice_versions`
- `source_integrations`
- `projects`
- `searches`
- `search_classes`
- `search_source_checks`
- `matches`
- `reports`

Funciones SQL:

- `recommend_nice_classes(description text)`
- `text_similarity(a text, b text)`

Edge Functions:

- `analyze-mark`: ejecuta el análisis demostrativo autenticado, guarda el mapa por clase y registra el estado de Niza, SIPI y RUES.
- `import-official-results`: permite importar de manera segura resultados estructurados provenientes de SIPI o RUES después de una consulta oficial.

## Fuentes

### Clasificación de Niza

La versión registrada en el sistema es `NCL 13-2026`, vigente desde el 1 de enero de 2026. La base contiene las 45 clases y metadatos de versión. La siguiente etapa de sincronización debe completar los términos y notas explicativas oficiales en español.

### SIPI / SIC

La aplicación abre la fuente oficial y está preparada para importar resultados verificados. No se presenta el motor demo como una consulta de antecedentes de la SIC.

### RUES

Se mantiene separado del análisis marcario porque la homonimia empresarial no equivale a derechos de marca. Se identificó documentación de un endpoint `consultarNombre` en un ambiente de pruebas de RUES, pero la integración productiva queda condicionada a credenciales y autorización.

## Seguridad

El frontend utiliza únicamente la clave publicable de Supabase. La clave `service_role` permanece únicamente en las Edge Functions. Las tablas de usuario usan RLS y las Edge Functions validan JWT. Después de la última migración, el Security Advisor de Supabase no reporta lints.

## Estado jurídico del resultado

Mientras las fuentes oficiales no estén completas, `overall_risk` se conserva como `insufficient` y `overall_score` como `null`. Los scores y riesgos por clase generados por el motor demo sirven únicamente para validar UX y metodología.

> Este análisis es preliminar y no constituye una decisión de registrabilidad. La decisión corresponde exclusivamente a la Superintendencia de Industria y Comercio.

## Pendientes para V1 productiva

- Crear/conectar el proyecto de Vercel para `julian8811/marca-diagnostico` y ejecutar pruebas E2E en una URL pública.
- Completar la importación oficial en español de NCL 13-2026.
- Obtener acceso productivo autorizado a RUES o mantener el flujo asistido/importado.
- Resolver integración autorizada con SIPI o mantener consulta oficial + importación estructurada.
- Construir similitud fonética y semántica sobre antecedentes reales.
- Añadir interfaz de importación oficial SIPI/RUES.
- Añadir recuperación de contraseña, configuración de correo y controles antiabuso para Auth.
- Generar informes PDF almacenados con snapshot, fuentes, evidencia y checksum.
