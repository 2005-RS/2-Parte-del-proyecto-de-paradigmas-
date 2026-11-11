# ProfeLink Actividades

Evaluaciones cortas de verdadero o falso para una clase. El profesor abre una sala, proyecta el código y el grupo responde desde su celular. El puntaje, las imágenes y los resultados quedan en el servicio de actividades.

La clase entra por el servidor público. Estas son las direcciones que quedaron publicadas.

| Pieza | Qué hace | Dirección |
|---|---|---|
| `web` | Aula para el profesor y los participantes | http://157.180.79.235:8080 |
| `demo-client` | Cliente adicional que solo habla por HTTP | http://157.180.79.235:8081 |
| `auth-api` | Registro, login y JWT con audiencia `activities-api` | http://157.180.79.235:3001/docs |
| `activities-api` | Cuestionarios, imágenes, salas, puntaje y WebSocket | http://157.180.79.235:3002/docs |
| Grafana | Solicitudes, respuestas y conexiones de sala | http://157.180.79.235:3005 |

Prometheus queda en el puerto 9090 de la misma máquina.

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

`WEB_AUTH_URL`, `WEB_ACTIVITIES_URL`, `WEB_WS_URL`, `DEMO_AUTH_URL`, `DEMO_ACTIVITIES_URL` y `WEB_URL` son las direcciones que usa el navegador. En el servidor publicado apuntan a `157.180.79.235`. Dentro de Docker, las APIs se hablan por los nombres `auth-api` y `activities-api`.

## Inicio y detención

```powershell
.\scripts\up.ps1
.\scripts\down.ps1
```

En bash: `./scripts/up.sh` y `./scripts/down.sh`.

`down` conserva los volúmenes. Los perfiles, cuestionarios, imágenes y resultados siguen después de reiniciar los contenedores. `docker compose --env-file .env down -v` borra esos datos.

## Cuenta del profesor

| Campo | Valor |
|---|---|
| Nombre | Ronny Salas |
| Correo | `ronny.salas@profelink.dev` |
| Contraseña | `Demo1234!` |
| Cuestionario | Paradigmas en el aula, cuatro preguntas y una imagen |

Con `SEED=true`, cada arranque deja esa contraseña lista. El cuestionario se crea solo la primera vez.

## Cómo demostrar el juego

El recorrido de la defensa es http://157.180.79.235:8080.

1. Entra con `ronny.salas@profelink.dev`. El nombre en la sala es Ronny Salas.
2. Abre **Paradigmas en el aula** y pulsa **Jugar**.
3. En otro celular, escanea el QR. La página pide solo el nombre y entra a la partida. No pide correo.
4. Inicia la partida. Cada persona ve el enunciado, la imagen y los botones Verdadero y Falso.
5. Cierra la pregunta. Se revela la respuesta y el punto.
6. Avanza hasta la clasificación.
7. Apaga la red de un celular y vuelve a abrir la misma sala. La participación y el puntaje no se duplican.
8. Abre http://157.180.79.235:8081, entra con la misma cuenta y consulta el código. Esa página no usa el código del aula: llama a las dos APIs.
9. Los perfiles, el cuestionario, las imágenes y la clasificación quedan en los volúmenes del servidor. Reiniciar los contenedores no los borra.
10. En http://157.180.79.235:3005, el tablero **ProfeLink actividades** muestra solicitudes, respuestas y conexiones de sala.

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

Publicadas y públicas en la cuenta `2005rs`, etiqueta `1.0.0`:

- https://hub.docker.com/r/2005rs/profelink-auth
- https://hub.docker.com/r/2005rs/profelink-activities
- https://hub.docker.com/r/2005rs/profelink-web
- https://hub.docker.com/r/2005rs/profelink-demo

```powershell
docker pull 2005rs/profelink-auth:1.0.0
docker pull 2005rs/profelink-activities:1.0.0
docker pull 2005rs/profelink-web:1.0.0
docker pull 2005rs/profelink-demo:1.0.0
```

El Compose usa `DOCKERHUB_NAMESPACE` (en este equipo, `2005rs`) e `IMAGE_TAG`. Para volver a publicar:

```powershell
docker login
docker compose --env-file .env build
docker compose --env-file .env push
```

## Cómo está desplegado

La URL de la clase corre en un VPS de Hetzner Cloud desde el 11 de noviembre de 2026. No usa el perfil `edge` ni un dominio: cada servicio publica su puerto en la IPv4 pública.

| Dato | Valor |
|---|---|
| Proveedor | Hetzner Cloud |
| Nombre en Hetzner | Proyecto-paradigmas |
| Hostname | `profelink` |
| Ubicación | Helsinki (`hel1`) |
| Tipo | CPX22, x86 AMD, 2 vCPU, 4 GB de RAM, 80 GB |
| Sistema | Ubuntu 24.04 |
| IPv4 | `157.180.79.235` |
| Código en el servidor | `/opt/profelink` |
| Repositorio | https://github.com/2005-RS/2-Parte-del-proyecto-de-paradigmas- |
| Imágenes | `2005rs/profelink-auth`, `profelink-activities`, `profelink-web` y `profelink-demo`, etiqueta `1.0.0` |

El aula es http://157.180.79.235:8080 y el cliente adicional es http://157.180.79.235:8081. La identidad responde en el puerto 3001 y las actividades en el 3002, que es también el origen del WebSocket. Grafana está en el 3005 y Prometheus en el 9090.

En el servidor, `.env` deja `INSECURE_TLS=false`, `SEED=true`, `DOCKERHUB_NAMESPACE=2005rs` e `IMAGE_TAG=1.0.0`. Las direcciones del navegador son la IPv4. `WEB_URL` es el enlace “Jugar en el aula” del cliente adicional:

```text
WEB_AUTH_URL=http://157.180.79.235:3001
WEB_ACTIVITIES_URL=http://157.180.79.235:3002
WEB_WS_URL=http://157.180.79.235:3002
DEMO_AUTH_URL=http://157.180.79.235:3001
DEMO_ACTIVITIES_URL=http://157.180.79.235:3002
WEB_URL=http://157.180.79.235:8080
CORS_ORIGINS=http://157.180.79.235:8080,http://157.180.79.235:8081
```

Dentro de Docker, `activities-api` sigue leyendo las llaves en `http://auth-api:3001/.well-known/jwks.json`.

Para repetir ese arranque en una máquina nueva, con Docker y Compose ya instalados:

```bash
git clone https://github.com/2005-RS/2-Parte-del-proyecto-de-paradigmas-.git /opt/profelink
cd /opt/profelink
cp .env.example .env
```

En ese `.env` del servidor, `WEB_AUTH_URL`, `WEB_ACTIVITIES_URL`, `WEB_WS_URL`, `DEMO_AUTH_URL`, `DEMO_ACTIVITIES_URL`, `WEB_URL` y `CORS_ORIGINS` quedan con la IPv4 de la tabla de arriba. Después:

```bash
docker compose --env-file .env pull
docker compose --env-file .env up -d --no-build
```

`pull` y `--no-build` usan las imágenes de Docker Hub. Postgres, las llaves JWT, las imágenes de las preguntas y Grafana quedan en volúmenes. Hetzner, sin firewall asociado, acepta esas entradas. El usuario del sistema es `root`.

Para publicar una corrección del aula o del cliente adicional, se suben `2005rs/profelink-web:1.0.0` y `2005rs/profelink-demo:1.0.0` a Docker Hub y, ya en `/opt/profelink`, se reemplazan solo esos dos servicios:

```bash
docker compose --env-file .env pull web demo-client
docker compose --env-file .env up -d --no-deps --force-recreate web demo-client
```

Ese segundo comando no recrea `auth-api` ni `activities-api`. Así la cuenta del profesor y las partidas que ya están en Postgres siguen igual.

El perfil `edge` sigue en Compose para quien más adelante publique los cuatro nombres con Caddy. Esta clase no lo usa.

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
