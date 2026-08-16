# MarcaCheck 360 · MVP

MVP de una plataforma de prediagnóstico marcario para Colombia. Permite investigar cualquier nombre o signo y ejecutar análisis en una, varias o las 45 clases de la Clasificación Internacional de Niza.

## Alcance actual

- Entrada de cualquier nombre o signo.
- Descripción libre del negocio/producto/servicio.
- Tipo de signo: marca denominativa, mixta, lema, nombre comercial o enseña.
- Selección manual de clases Niza.
- Barrido completo de las 45 clases.
- Recomendación automática de clases desde Supabase con `recommend_nice_classes()`.
- Autenticación con Supabase Auth.
- Persistencia de búsquedas, clases, coincidencias y reportes mediante PostgreSQL.
- Row Level Security para separar los datos por usuario.
- Motor de análisis ejecutado mediante la Edge Function `analyze-mark`.
- Score de viabilidad y semáforo de riesgo.
- Mapa de riesgo por clase.
- Coincidencias demostrativas priorizadas.
- Historial persistente en Supabase.
- Recuperación de análisis previos desde el historial.
- Vista imprimible/PDF desde el navegador.
- Diseño responsive.

## Backend

Proyecto Supabase: `MarcaCheck 360`

Tablas principales:

- `nice_classes`
- `projects`
- `searches`
- `search_classes`
- `matches`
- `reports`

Funciones:

- `recommend_nice_classes(description text)`

Edge Functions:

- `analyze-mark`

## Seguridad

El frontend utiliza únicamente la clave pública/publishable de Supabase. Las operaciones de usuario están protegidas con autenticación y RLS. La Edge Function valida el JWT antes de ejecutar el análisis.

## Importante

El motor de coincidencias actual es **demostrativo y determinista** (`demo-deterministic-v1`). No consulta todavía antecedentes oficiales en tiempo real y sus resultados no deben interpretarse como una decisión jurídica ni como una búsqueda oficial de antecedentes.

La aplicación mantiene separadas las fuentes:

1. **Niza**: catálogo almacenado y operativo.
2. **SIPI / SIC**: adaptador pendiente para antecedentes de signos distintivos.
3. **RUES**: adaptador pendiente para homonimia y nombres empresariales.

## Próxima iteración

- Integración técnicamente sostenible y autorizada con SIPI/SIC.
- Adaptador RUES.
- Sustitución progresiva del motor demo por similitud denominativa, ortográfica, fonética y semántica basada en antecedentes reales.
- Explicabilidad detallada del score.
- Comparador de candidatos de naming.
- Informe PDF profesional con trazabilidad de fuentes.
- Vigilancia marcaria periódica.

## Rama de trabajo

`mvp-marcacheck-360`
