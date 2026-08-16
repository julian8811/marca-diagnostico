# MarcaCheck 360

Plataforma de prediagnóstico marcario para Colombia. Organiza la clasificación de productos y servicios, la consulta asistida de antecedentes oficiales y la trazabilidad del análisis sin presentar resultados preliminares como una decisión de registrabilidad.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjulian8811%2Fmarca-diagnostico&project-name=marcacheck-360)

## Estado actual

- Búsqueda en modo invitado y autenticado.
- Supabase Auth, historial local/nube y recuperación de contraseña.
- Clasificación Niza `NCL 13-2026` sincronizada desde ficheros maestros de la OMPI.
- **45/45 clases** con título y nota explicativa oficial en español.
- **10.123 indicaciones oficiales en español** almacenadas en `nice_items`.
- Explorador público en `catalogo.html` y búsqueda mediante `search_nice_items`.
- Recomendador de clases basado en el catálogo oficial más reglas contextuales acotadas.
- Selección manual, recomendada o barrido de las 45 clases.
- Consulta SIPI/RUES asistida desde `fuentes.html`, con formulario para registrar evidencias sin necesidad de JSON.
- Importación oficial autenticada con normalización, cálculo de similitud, evidencia SHA-256 y confirmación expresa de consultas sin resultados.
- Similitud exacta, ortográfica, fonética en español y conceptual heurística.
- El riesgo global permanece `insufficient` mientras SIPI y RUES no estén completos.
- Los flujos nuevos no generan coincidencias marcarias demo.
- Informes con snapshot, SHA-256, historial y vista imprimible.
- Generación de **PDF privado en servidor**, almacenado en Supabase Storage y entregado mediante URL firmada temporal.
- Rate limiting para análisis, importación oficial, generación de informes y PDF.
- Registro de auditoría para eventos relevantes del análisis.
- Row Level Security por usuario y Edge Functions protegidas con JWT.
- Cabeceras de seguridad preparadas en `vercel.json`.

## Backend

Proyecto Supabase: `MarcaCheck 360`.

### Tablas principales

- `nice_classes`
- `nice_items`
- `nice_versions`
- `nice_sync_runs`
- `source_integrations`
- `projects`
- `searches`
- `search_classes`
- `search_source_checks`
- `matches`
- `reports`
- `api_usage_events`
- `audit_events`

### Funciones SQL principales

- `recommend_nice_classes(description text)`
- `search_nice_items(search_text text, max_results integer)`
- `normalize_mark(value text)`
- `phonetic_key_es(value text)`
- `text_similarity(a text, b text)`
- `semantic_similarity_es(a text, b text)`
- `mark_similarity_metrics(query_mark text, candidate_mark text)`
- `consume_api_quota(...)`

### Edge Functions

- `analyze-mark` **v5**: registra las clases seleccionadas contra NCL 13-2026, marca Niza como completada, mantiene SIPI/RUES pendientes y deja auditoría; no crea coincidencias demo.
- `import-official-results` **v6**: registra evidencias SIPI/RUES, limita URLs a dominios oficiales, calcula similitud, registra hash SHA-256 del conjunto de evidencia y controla consultas sin resultados.
- `generate-report` **v3**: crea snapshot trazable, HTML y checksum SHA-256.
- `generate-pdf-report` **v1**: convierte un snapshot guardado en un PDF privado y genera una URL firmada temporal.

## Clasificación Niza oficial

La sincronización vigente usa `NCL 13-2026`, efectiva desde el 1 de enero de 2026.

Último sync registrado:

- Run: `9308a7c4-18f3-44ad-a415-fd5d162968ae`
- Indicaciones ES: `10.123`
- Clases: `45`
- Registros sin mapear: `0`
- Archivo de textos ES: `ncl-20260101-es-classification_texts-20260715.xml`
- SHA-256 del ZIP de textos: `260c36e11c69578783c5db3b6ab820a177c39dfd820d80af62603c2f030eaa40`
- Archivo de estructura: `ncl-20260101-classification_top_structure-20250610.xml`
- SHA-256 del ZIP de estructura: `cc7e3c4bf7454005eed3557ab50f514900bae0040c6d7aae7cb5972159cc8310`

El producto reconoce la titularidad/autoria de la OMPI sobre los datos oficiales utilizados.

## SIPI / SIC

MarcaCheck abre la fuente oficial y permite registrar resultados de una consulta realizada por el usuario. Si la consulta no arroja coincidencias, el backend solo acepta el estado `completed` cuando se envía una confirmación expresa de consulta sin resultados.

SIPI se mantiene en modo asistido: no se ha identificado documentación oficial de una API pública abierta que permita sustituir de forma fiable el buscador oficial por una integración automática.

## RUES

RUES se mantiene como fuente empresarial separada del análisis de derechos marcarios. La homonimia empresarial no equivale a registrabilidad de marca. Aunque existe documentación pública de endpoints en un ambiente de pruebas, no se asume acceso productivo: la modalidad actual es consulta oficial + registro estructurado de evidencia.

## Riesgo y metodología

`overall_risk` se mantiene como `insufficient` y `overall_score` como `null` mientras SIPI y RUES no estén completos. Una consulta oficial completada sin antecedentes puede producir una señal preliminar de riesgo bajo, pero no genera un score artificial de 100/100.

La similitud ortográfica, fonética y conceptual ayuda a priorizar revisión; no sustituye una valoración jurídica de confundibilidad, conexidad competitiva, notoriedad, estado jurídico u otros factores.

> Este análisis es preliminar y no constituye una decisión de registrabilidad. La decisión corresponde exclusivamente a la Superintendencia de Industria y Comercio (SIC).

## Seguridad

- Frontend con clave publicable de Supabase; `service_role` únicamente en Edge Functions.
- RLS en datos de usuario.
- JWT obligatorio en funciones operativas.
- Rate limits por usuario.
- URLs importadas de SIPI/RUES validadas contra dominios oficiales.
- Cada importación oficial conserva `query_sign`, clases consultadas y SHA-256 de la evidencia normalizada.
- PDFs en bucket privado con URL firmada temporal.
- Funciones temporales de sincronización/diagnóstico Niza bloqueadas tras la importación oficial.
- Security Advisor de Supabase: sin lints después de la última revisión.
- `vercel.json` incluye CSP, `nosniff`, `DENY` para frames, Referrer Policy y Permissions Policy.

## Bloqueos restantes

1. **Despliegue Vercel:** en el equipo conectado todavía no existe un proyecto para `julian8811/marca-diagnostico`; no se debe sobrescribir `guaufresh-costeo-producto`. El botón superior permite crear/importar `marcacheck-360` sin tocar el proyecto existente.
2. **SIPI automatizado:** requiere una interfaz técnica oficial/autorizada si se desea sustituir el flujo asistido.
3. **RUES automatizado:** solo debe habilitarse si existe una modalidad de acceso autorizada para este caso de uso.
4. **Auth de producción:** configurar Site URL, redirects, SMTP personalizado y CAPTCHA una vez exista la URL pública final.
5. **CSP sin `unsafe-inline`:** separar scripts inline a archivos JS antes de retirar esta excepción.
6. **Validación E2E en navegador:** pendiente hasta disponer de un despliegue público de MarcaCheck.
7. **Conexidad entre productos/servicios y notoriedad:** módulos jurídicos separados pendientes; no deben inferirse únicamente por número de clase.
