# Estado del proyecto y cómo continuar

Última actualización: 2026-10-07.

## Qué se pidió

Una app de móvil para iPhone y Android con la funcionalidad de My Hub (el área privada de
https://themarkethub.app), publicada en las dos tiendas. Decisiones del usuario (2026-10-07):
**Expo (React Native) + EAS Build**, y estar en las tiendas (no una PWA).

## El plan, por pasos

| Paso | Qué | Estado |
|---|---|---|
| 1 | Repo `market-hub-mobile` con Expo y TypeScript, submódulo del workspace | Hecho (repo público en GitHub, submódulo de `market-hub`) |
| 2 | Sesión por token en la API del portal, con sus tests | Hecho y **desplegado** (2026-10-07, revisión `market-hub-00023-q6q`) |
| 3 | Entrar con email y contraseña, Overview y Portfolio, probados en el móvil con Expo Go | Hecho y probado en la vista de navegador; **falta probarlo en un teléfono** |
| 3b | Entrar con Google desde la app, por el navegador del teléfono | Hecho y **desplegado** (2026-10-07, revisión `market-hub-00025-gj8`; la URI de vuelta ya está en el cliente OAuth). **Falta** que el usuario lo pruebe en el teléfono |
| 4 | Login con Apple; crear cuenta con email desde la app; compilación de desarrollo con EAS | Pendiente (pide las cuentas de desarrollador) |
| 5 | Analysis, Watchlist y Community | Pendiente |
| 6 | TestFlight y prueba cerrada de Google Play | Pendiente |

## Dónde estamos

- **Expo SDK 57**, React Native 0.86, React 19, `expo-router` (rutas en `src/app/`), TypeScript
  estricto. Sin carpetas `ios/` ni `android/`: las genera Expo al compilar.
- **Pantallas**: `sign-in` ("Continue with Google" y, debajo, email y contraseña) y, ya dentro, tres pestañas (`src/app/(hub)/`):
  - **Overview** (`index.tsx`): lo que el dashboard de la web, puesto en una columna. Saludo, las
    cuatro cifras (valor, hoy, ganancia, un año frente al índice), "Your portfolio, read back" (las
    frases del código al momento y las del modelo cuando llegan, como en la web), lo que más se
    mueve hoy, el gráfico de las posiciones frente a los índices (1M, 3M, YTD, 1Y; se encienden y
    apagan los índices) con su tira de periodos, las posiciones, de qué está hecha la cartera y la
    watchlist. Tirar hacia abajo recarga. Tocar una acción abre su ficha de la web
    (`/quote/?t=`) en el navegador de la app.
  - **Portfolio** (`portfolio.tsx`): buscar una empresa y añadirla como posición (acciones y coste
    medio, este opcional) o a la watchlist; quitar; "Save and open the overview". Las mismas
    comprobaciones que la web antes de enviar, y el servidor valida igual.
  - **Account** (`account.tsx`): quién ha entrado, salir, enlace a la página de privacidad y
    **borrar la cuenta** (lo pide Apple a toda app con cuentas), con confirmación.
- **Sesión** (`src/lib/session.tsx`, `api.ts`, `storage.ts`): la app manda email y contraseña a
  `POST /api/app/auth/password`, recibe un token y lo guarda en el llavero del teléfono
  (`expo-secure-store`); lo envía en cada petición como `Authorization: Bearer`. Al abrirse pide
  uno nuevo (`/api/app/auth/renew`), así que un móvil que se usa no vuelve a pedir la contraseña;
  sin usarla 30 días, sí. Si el portal rechaza el token, la app vuelve a la pantalla de entrada.
  Sin conexión se queda con el token guardado y las pantallas dicen que no llegan al portal.
- **Aspecto**: el del portal. Colores de `global.css` en `src/lib/theme.ts`, IBM Plex Sans y Mono
  (`@expo-google-fonts`), secciones bajo una raya y sin cajas, verde y rojo solo para un movimiento.
  El gráfico y las marcas se dibujan con `react-native-svg` (`src/components/`).
- **Comprobado** (2026-10-07): `make check` en verde (tipos, lint y `expo-doctor`, 21 de 21), y
  `npx expo export` compila los paquetes de iPhone y de Android sin errores. En la
  vista de navegador (`make web`, 375 px) contra el portal en local con cifras de ejemplo y la
  cuenta de demostración: contraseña equivocada (sale el mensaje del portal), entrar, Overview
  entero, buscar "johnson" y seguir JNJ, guardar (el `PUT` pasa con el token y sin `Origin` propio
  del portal), quitar, el aviso de "faltan las acciones" sin enviar nada, recargar la página y
  seguir dentro, salir y que `/portfolio` ya no se alcance.
- **Sin probar**: nada en un teléfono ni en un simulador (este Mac no tiene Xcode ni emulador de
  Android): teclado, llavero, zonas seguras, el navegador de la app y el gesto de recargar solo se
  han visto en su versión web. Borrar la cuenta desde la pantalla (sí está probado en los tests de
  la API). Entrar desde la app contra el portal público con una cuenta de verdad (sus rutas sí
  responden: comprobado con `curl`).

## Cómo probarlo en el móvil (Expo Go)

1. Instalar **Expo Go** en el teléfono. Teléfono y ordenador en la misma wifi.
2. `make start` y escanear el QR (iPhone: con la cámara; Android: desde Expo Go).
3. Entrar con una cuenta de email y contraseña de themarkethub.app (las de Google, aún no).

Para trabajar contra el portal de este equipo en vez del público:

1. Terminal 1: `make api` (el portal en local, abierto a la red de casa, puerto 8000, con datos
   de Yahoo; `make api SAMPLE=1` para cifras de ejemplo).
2. Una vez: `make demo` crea la cuenta de demostración con una cartera pequeña. Su email y su
   contraseña están al principio de `scripts/seed-local.sh` (solo valen en local).
3. Terminal 2: `make start LOCAL=1` y escanear el QR.

## Lo que hay que saber antes de seguir

- **Entrar con Google** (`src/lib/google.ts`, 2026-10-07) va por el navegador del teléfono, no
  por el botón nativo de Google (ese no funciona en Expo Go y pide un cliente OAuth por
  plataforma). La app crea un secreto, abre el navegador en
  `/api/app/auth/google/start?redirect=<su dirección>&challenge=<SHA-256 del secreto>`
  (`expo-web-browser`, `openAuthSessionAsync`), el portal lo manda a Google, comprueba lo que
  vuelve y devuelve el navegador a la app con un código de dos minutos; la app cambia código y
  secreto por su token (`/api/app/auth/google/finish`). Detalle y razones en
  `market-hub-landing/src/markethub/appsignin.py`. Es la misma cuenta que en la web (la clave es
  el `sub` de Google), y quien no tenía cuenta la estrena así.
  - **La dirección de la app** es `markethub://auth` en una app instalada y, en Expo Go por
    túnel, `exp://<azar>-<usuario de Expo>-8081.exp.direct/--/auth`. El portal solo devuelve el
    código a las direcciones que tiene permitidas: la primera siempre; la segunda, porque está
    en `MARKETHUB_APP_REDIRECTS` del `.env` del portal con el usuario de Expo del dueño.
    **Con `make start LOCAL=1` o sin túnel (dirección `exp://192.168…`) Google no funciona**: esa
    dirección no está permitida a propósito. **Antes de publicar en tiendas, vaciar
    `MARKETHUB_APP_REDIRECTS` y desplegar.**
  - `src/app/+native-intent.tsx` hace que el enlace de vuelta (`…/auth?code=…`) no se tome por
    una pantalla (Android lo entrega como enlace a la app).
  - En la vista de navegador (`make web`) el botón dice que Google es cosa de la app.
  - **Sin probar en un teléfono**: todo el viaje por el navegador (hoja de Google en iPhone,
    pestaña de Chrome en Android, la vuelta a la app). Lo probado son los tests del portal (20,
    con Google simulado), que el botón sale y que los dos paquetes nativos compilan.
- **Crear cuenta con email** hoy se hace en la web (la pantalla de entrada enlaza a ella): el
  registro pasa por el captcha de Cloudflare, que en la app irá en un WebView.
- **Apple** pedirá "Sign in with Apple" al ofrecer el de Google, y una dirección con la política
  de privacidad; la del portal tendrá que decir lo que guarda la app (hoy, nada nuevo en el
  servidor).
- **Identificadores de la app** (`ios.bundleIdentifier`, `android.package`): sin poner. Son para
  siempre una vez publicada: los elige el usuario en el paso 4.
- **Icono y pantalla de arranque**: son los de la plantilla de Expo con el fondo del portal. Falta
  dibujar los de Market Hub antes de la primera compilación para tiendas.
- **Las herramientas** (Fundamentals Lab, Earnings Radar) comparten sesión con la web por cookie de
  dominio; la app no tiene esa cookie. Abrirlas desde la app pedirá login otra vez hasta que se
  haga un puente (pendiente de decidir cómo).
- **La vista web** (`make web`) es solo para desarrollar: guarda el token en `localStorage`, que no
  es sitio para una cuenta de verdad. No se publica.
- La plantilla de Expo traía `.claude/settings.json` activando el plugin `expo` de Claude Code; se
  quitó para no activar nada sin que el usuario lo pida. Si se quiere, se vuelve a poner.
