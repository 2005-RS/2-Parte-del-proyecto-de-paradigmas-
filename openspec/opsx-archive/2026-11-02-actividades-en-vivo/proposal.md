# Actividades en vivo

## Problema

ProfeLink necesita evaluaciones cortas durante la clase, con sala, imagen y verdadero o falso, sin mezclar los resultados de dos grupos.

## Decisiones

- La identidad y las actividades son servicios desplegables por separado.
- El token declara la audiencia `activities-api`.
- Las reglas de puntaje viven en el dominio y se confirman con una restricción única en la base.
- El cliente adicional solo usa HTTP documentado.

## Hecho

- Registro, login y JWKS.
- Cuestionarios, imágenes y salas.
- Partida en vivo, puntaje y clasificación.
- Compose, semilla, OpenTelemetry y Grafana.
- Spec de auth, quizzes, sesiones, eventos y observabilidad en `openspec/specs`.
