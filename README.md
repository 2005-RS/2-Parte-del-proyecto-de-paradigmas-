# ProfeLink Actividades

Evaluaciones cortas de verdadero o falso para una clase. El profesor abre una sala, proyecta el código y el grupo responde desde su celular. El puntaje, las imágenes y los resultados quedan en el servicio de actividades.

Hay cuatro piezas desplegables por separado:

| Pieza | Qué hace | Dirección local |
|---|---|---|
| `auth-api` | Registro, login y JWT con audiencia `activities-api` | http://localhost:3001/docs |
| `activities-api` | Cuestionarios, imágenes, salas, puntaje y WebSocket | http://localhost:3002/docs |
| `web` | Aula para el profesor y los participantes | http://localhost:8080 |
| `demo-client` | Cliente adicional que solo habla por HTTP | http://localhost:8081 |

Grafana queda en http://localhost:3005.

## Requisitos previos

- Git
- Docker Desktop con Compose v2
- Si la red intercepta HTTPS, deja `INSECURE_TLS=true` en `.env` para que la construcción pueda descargar dependencias
- Para las pruebas unitarias en la máquina, Node.js 22

La primera ejecución descarga las imágenes de Postgres, Nginx, OpenTelemetry, Prometheus y Grafana, y construye las cuatro imágenes del equipo. No hace falta instalar NestJS ni React en el host para jugar.

## Configuración

```powershell
copy .env.example .env
```

`scripts/up.ps1` crea `.env` si todavía no existe. Las contraseñas de ejemplo son de desarrollo. Cámbialas antes de publicar el servicio.

`WEB_AUTH_URL`, `WEB_ACTIVITIES_URL`, `WEB_WS_URL`, `DEMO_AUTH_URL` y `DEMO_ACTIVITIES_URL` son las direcciones que usa el navegador. En la clase deben ser alcanzables desde los celulares. Dentro de Docker, las APIs se hablan por los nombres `auth-api` y `activities-api`.

## Inicio y detención

```powershell
.\scripts\up.ps1
.\scripts\down.ps1
```

En bash: `./scripts/up.sh` y `./scripts/down.sh`.

`down` conserva los volúmenes. Los perfiles, cuestionarios, imágenes y resultados siguen después de reiniciar los contenedores. `docker compose --env-file .env down -v` borra esos datos.

## Cuenta y datos de prueba

| Campo | Valor |
|---|---|
| Correo | `demo@profelink.dev` |
| Contraseña | `Demo1234!` |
| Cuestionario | Paradigmas en el aula, cuatro preguntas y una imagen |

Con `SEED=true`, cada arranque deja esa contraseña lista. El cuestionario demo se crea solo la primera vez.

## Cómo demostrar el juego

1. Entra en http://localhost:8080 con la cuenta demo.
2. Abre **Paradigmas en el aula** y pulsa **Abrir sala**.
3. En otro celular, crea un perfil y únete con el código.
4. Inicia la partida. Cada persona ve el enunciado, la imagen y los botones Verdadero y Falso.
5. Cierra la pregunta. Se revela la respuesta y el punto.
6. Avanza hasta la clasificación.
7. Apaga la red de un celular y vuelve a abrir la misma sala. La participación y el puntaje no se duplican.
8. Abre http://localhost:8081, entra con la misma cuenta y consulta el código. Esa página no usa el código del aula: llama a las dos APIs.
9. Ejecuta `.\scripts\down.ps1` y otra vez `.\scripts\up.ps1`. El perfil, el cuestionario, la imagen y la clasificación siguen ahí.
10. En Grafana, el tablero **ProfeLink actividades** muestra solicitudes, respuestas y conexiones de sala.

La comprobación automática de permisos, puntaje, tardanza y aislamiento de salas es:

```powershell
.\scripts\comprobar.ps1
```

La interfaz también tiene pruebas de Playwright en `e2e/`. Se ejecutan con la solución ya levantada:

```powershell
cd e2e
npm install
npx playwright install chromium
npm test
```

## Imágenes en Docker Hub

El Compose construye y etiqueta:

- `profelink/profelink-auth:1.0.0`
- `profelink/profelink-activities:1.0.0`
- `profelink/profelink-web:1.0.0`
- `profelink/profelink-demo:1.0.0`

Cambia `DOCKERHUB_NAMESPACE` e `IMAGE_TAG` en `.env`, inicia sesión y publica:

```powershell
docker login
docker compose --env-file .env build
docker compose --env-file .env push
```

## Despliegue con URL pública

En el VPS, clona el repositorio, completa `.env` con las URLs públicas que verán los navegadores y levanta también el perfil `edge`:

```powershell
docker compose --env-file .env --profile edge up -d --build
```

Caddy publica `AUTH_DOMAIN`, `ACTIVITIES_DOMAIN`, `WEB_DOMAIN` y `DEMO_DOMAIN`. Esas mismas URLs públicas deben quedar en `WEB_*` y `DEMO_*`, y hay que sumarlas a `CORS_ORIGINS`.

## Límites conocidos

- Cada sala acepta como máximo 40 participantes. El API lo rechaza al llegar al tope.
- Una sola instancia de `activities-api` atiende el WebSocket. Para más de una réplica haría falta un adaptador compartido; una clase entra en un nodo.
- Cada persona usa su propio perfil. La misma cuenta no ocupa dos puestos en la sala.
- Imágenes JPEG, PNG o WebP, hasta 2 MB.
- El punto de la pregunta abierta se revela al cerrarla, no mientras todavía se puede responder.

## Documentación de diseño

- [Especificación](docs/ESPECIFICACION.md)
- [Comprobaciones](docs/COMPROBACIONES.md)
- [Aportes](docs/APORTES.md)
- Spec archivado: `openspec/opsx-archive/2026-11-02-actividades-en-vivo/`
