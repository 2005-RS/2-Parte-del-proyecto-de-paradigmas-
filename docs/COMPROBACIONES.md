# Comprobaciones

Límite usado en las pruebas: **40 participantes por sala**, una instancia del servicio de actividades.

| Caso | Cómo se comprueba | Resultado |
|---|---|---|
| Acceso y permisos | Pruebas de `assertHost` y `assertOwner`, y `scripts/comprobar.ps1` | Un participante recibe 403 al editar o al iniciar una sala ajena |
| Juego simultáneo | Dos salas en `comprobar.ps1` y el presenter | El puntaje de la primera sala no aparece en la segunda |
| Respuestas válidas | Reglas unitarias y la partida de `comprobar.ps1` | Un acierto suma 1. El reenvío y la respuesta tardía reciben 409 y no cambian el marcador. La correcta se revela al cerrar |
| Reconexión | Segundo `join` del mismo perfil | Sigue habiendo un participante y el puntaje no se duplica |
| Persistencia | Volúmenes de Compose | `down` sin `-v` conserva Postgres, llaves e imágenes |
| Consumo independiente | `apps/demo-client` | Consulta sesión y resultados solo con las URLs y el token |

La evidencia automática de la partida se obtiene con la solución levantada:

```powershell
.\scripts\comprobar.ps1
```

Ejecución del 2 de noviembre de 2026, con Compose en esta máquina: el script terminó sin errores. Cubrió login demo, registro, 403 al editar un cuestionario ajeno, creación de preguntas, PNG público, sala sin participantes, reconexión sin duplicar el puesto, respuesta oculta hasta el cierre, 409 en reenvío y en respuesta tardía, un punto en la clasificación y una segunda sala con puntaje 0.

La interfaz en http://localhost:8080 también se recorrió: login de `demo@profelink.dev`, editor de **Paradigmas en el aula**, sala `DFCE67`, unión desde otra pestaña, pregunta en vivo, respuesta Verdadero y revelado con 1 punto en anfitrión y participante.

Las reglas de dominio también corren sin Docker:

```powershell
cd apps\auth-api; npm test
cd ..\activities-api; npm test
```

## Limitaciones

- El tope de 40 es el máximo configurado y probado como rechazo. No se ejecutó una partida real de 40 dispositivos en esta máquina.
- El WebSocket vive en un solo proceso. Dos réplicas del API no compartirían la sala sin un adaptador adicional.
- La misma cuenta no puede ocupar dos puestos.
