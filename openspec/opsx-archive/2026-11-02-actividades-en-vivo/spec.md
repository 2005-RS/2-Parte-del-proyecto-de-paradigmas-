# Spec archivado

La versión vigente de los contratos está en `openspec/specs`. Esta carpeta es la versión cerrada que acompaña la entrega.

## Auth

- El registro y el login devuelven un JWT RS256.
- `aud` es `activities-api` e `iss` es `profelink-auth`.
- La llave pública se publica en `/.well-known/jwks.json`.

## Cuestionarios

- Solo el dueño crea, edita, ordena y borra preguntas.
- Una imagen se acepta si su contenido es JPEG, PNG o WebP y no pasa de 2 MB.
- La imagen se sirve por URL para otros dispositivos.

## Sesión

- El código tiene 6 caracteres.
- El cuestionario se copia al crear la sala.
- Máximo 40 participantes nuevos. Quien ya está puede reconectar.
- Una respuesta por persona y pregunta.
- El punto se revela al cerrar.
- Los resultados quedan guardados al terminar.

## Eventos

- Handshake con el JWT.
- `session.state` personalizado por sala.
- `game.error` solo para quien falló.
