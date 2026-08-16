# MarcaCheck 360 · MVP

MVP de una plataforma de prediagnóstico marcario para Colombia. Permite investigar cualquier nombre o signo y ejecutar análisis en una, varias o las 45 clases de la Clasificación Internacional de Niza.

## Alcance actual

- Entrada de cualquier nombre o signo.
- Descripción libre del negocio/producto/servicio.
- Tipo de signo: marca denominativa, mixta, lema, nombre comercial o enseña.
- Selección manual de clases Niza.
- Barrido completo de las 45 clases.
- Recomendación inicial de clases por palabras clave.
- Score de viabilidad y semáforo de riesgo.
- Mapa de riesgo por clase.
- Coincidencias demostrativas priorizadas.
- Historial local en navegador.
- Vista imprimible/PDF desde el navegador.
- Diseño responsive.

## Importante

El motor de coincidencias del MVP es **demostrativo y determinista**. No consulta aún antecedentes oficiales en tiempo real y no debe interpretarse como resultado jurídico.

La arquitectura visual deja diferenciados los futuros conectores:

1. **SIPI / SIC** para antecedentes de signos distintivos.
2. **RUES** para homonimia y nombres empresariales.
3. **Clasificación de Niza / WIPO-SIC** como catálogo maestro de productos y servicios.

## Próxima iteración

- Backend y persistencia de proyectos/búsquedas.
- Adaptador SIPI con estrategia de integración autorizada/documentada.
- Adaptador RUES.
- Motor real de similitud denominativa, fonética y semántica.
- Explicabilidad del score.
- Comparador de candidatos de naming.
- Generación de informe PDF profesional.
- Vigilancia marcaria periódica.

## Rama de trabajo

`mvp-marcacheck-360`
