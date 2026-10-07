# Instrucciones para agentes

Lee primero [docs/HANDOFF.md](docs/HANDOFF.md): estado, pendientes y siguientes pasos. Y
[AGENTS.md](AGENTS.md), que viene con la plantilla de Expo: **Expo cambia en cada SDK y lo que
recuerdes de memoria estará mal**; antes de tocar una API de Expo o de React Native se lee su
documentación de la versión instalada (`expo` en `package.json`).

Esto es la app de móvil de Market Hub (iPhone y Android): My Hub, el área privada del portal, en
nativo. **No tiene servidor propio**: habla con la API del portal (`market-hub-landing`), que es
quien verifica el login, guarda los datos y hace las cuentas. La app solo pinta.

Reglas que no se negocian (las del portal, que aquí valen igual):
- **Nada de trading.** No se escribe código que envíe órdenes ni que se conecte a un broker.
- **Describir, no recomendar.** La app enseña valores, ganancias frente al coste del propio usuario
  y rentabilidades pasadas. Nada de "compra", "vende", alertas de oportunidad ni predicciones, y
  tampoco notificaciones que empujen a operar.
- **Los datos del usuario son suyos.** La app no guarda en el teléfono más que la sesión (el token
  y el nombre y el email de quien entró), en el llavero del sistema (`expo-secure-store`). Nada de
  la cartera se guarda en el teléfono ni va a un log. Ningún SDK de analítica ni de anuncios sin
  preguntar al usuario y sin decirlo antes en la página de privacidad del portal.
- **El login lo verifica el portal.** La app nunca decide quién es nadie: manda la contraseña (o,
  más adelante, el token de Google o de Apple) al portal y guarda el token que este le devuelve
  (`market-hub-landing/src/markethub/tokens.py`). La contraseña no se guarda.
- **Claves solo en `.env.local` o en el entorno.** Nunca en el repo. Lo que lleva `EXPO_PUBLIC_`
  acaba dentro de la app y lo puede leer cualquiera: ahí no va ningún secreto.
- **Nada programado y nada en GitHub Actions.** Todo se lanza a mano desde el `Makefile`; las
  compilaciones de EAS también, y **publicar en una tienda es decisión del usuario, versión a
  versión**.

Convenciones:
- Hablar con el usuario en español. Código, comentarios y textos de la app en inglés.
- El aspecto es el del portal: los colores de `src/lib/theme.ts` son los de
  `market-hub-landing/site/src/styles/global.css`, y `src/lib/format.ts` y `src/lib/types.ts` son
  copia de los de su web. Un cambio allí se hace aquí.
- Antes de dar algo por hecho: `make check`. Lo que se ve se comprueba en `make web` (la vista de
  navegador, solo para desarrollo) y, lo que no se puede ver ahí, se dice.
- Al terminar una tarea relevante, actualizar "Dónde estamos" en `docs/HANDOFF.md`.
