# Estado del proyecto y cómo continuar

Última actualización: 2026-10-08.

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
| 4a | Crear cuenta con email desde la app, con el captcha en un WebView | Hecho (2026-10-08), probado en la vista de navegador sin captcha, y el portal **desplegado** (revisión `market-hub-00027-wcg`). **Falta probar el captcha en un teléfono** |
| 4b | Icono y pantalla de arranque de Market Hub | Hecho (2026-10-08); se ven en una compilación, no en Expo Go |
| 4c | Login con Apple; identificadores; compilación de desarrollo con EAS | Pendiente (pide las cuentas de desarrollador; el usuario aún no tiene ninguna, 2026-10-08) |
| 5 | Analysis, Watchlist y Community | Hecho (2026-10-07) y probado en la vista de navegador; **falta verlo en un teléfono** |
| 5b | Lo que la web tenía y la app no: noticias en Overview, volumen en la ficha, lo guardado y cambiar contraseña en Account | Hecho (2026-10-08) y probado en la vista de navegador |
| 6 | TestFlight y prueba cerrada de Google Play | Pendiente |

## Dónde estamos

- **Expo SDK 57**, React Native 0.86, React 19, `expo-router` (rutas en `src/app/`), TypeScript
  estricto. Sin carpetas `ios/` ni `android/`: las genera Expo al compilar.
- **Pantallas**: `sign-in` ("Continue with Google" y, debajo, email y contraseña, para entrar o
  para **crear una cuenta**: el mismo formulario con el nombre, el captcha y otra palabra en el
  botón) y, ya dentro,
  cinco pestañas en el orden del menú de la web (`src/app/(hub)/(tabs)/`), más tres pantallas que
  se abren encima (`src/app/(hub)/`): el editor de la cartera, la cuenta y la ficha de una acción.
  - **Overview** (`index.tsx`): lo que el dashboard de la web, en una columna. Saludo, las cuatro
    cifras, "Your portfolio, read back" (las frases del código al momento y las del modelo cuando
    llegan), lo que más se mueve hoy, el gráfico frente a los índices con su tira de periodos, las
    posiciones, de qué está hecha la cartera, la watchlist y las **noticias de tus acciones**
    (`/api/news/mine`, hasta ocho; si están viejas la app pide el refresco, como la web; con
    noticias de ejemplo la sección no sale). Un titular abre su página del portal en el navegador.
    Tirar hacia abajo recarga.
  - **Analysis** (`analysis.tsx`): de qué está hecha (por sector, país, volatilidad y tamaño, con
    sus tickers y rentabilidades), frente a los índices por periodo (con la marca de la regla y
    los puntos), cómo se mueve y cómo reparte su peso, hoy posición por posición, y todas las
    posiciones ordenadas por la cifra que se elija.
  - **Watchlist** (`watchlist.tsx`): las acciones seguidas, una por línea (precio, sparkline, sus
    tres estados y su frase), las que se tienen si se encienden, y cualquier otra que se busque
    (hasta 20; "Follow" la pasa a la lista). Vista **Map**: todas en un plano, como en la web.
    Tocar una abre **su ficha** (`stock/[ticker].tsx`): gráfico de velas o línea con las medias
    de 20, 50 y 200 sesiones y el volumen al pie (3M a 2Y; `components/price-chart.tsx`,
    dibujado con SVG) y la **lectura** aspecto por aspecto con los mismos medidores que la web
    (`components/reading.tsx`): precio frente a su media de 50, tendencia, fuerza frente al
    índice, sector, momentum, rango de 52 semanas, volumen, crecimiento por consenso y PER. Las
    frases del modelo sustituyen a las del código cuando llegan (`/api/watchlist/read`).
  - **Community** (`community.tsx`), con sus dos secciones:
    - *Shared portfolios* (`components/shared-portfolios.tsx`): compartir la cartera (los tres
      pasos, el nombre, dejar de compartir), dónde estás por periodo y el ranking con índices y
      media; una línea se abre sobre lo que tiene esa cartera.
    - *Monthly competition* (`components/competition.tsx`, `competition-entry.tsx`): el mes en
      juego y el siguiente con su cuenta atrás, podio, el mes sesión a sesión (se eligen las
      líneas, hasta seis), clasificación, discusión del mes (`components/thread.tsx`: comentar,
      responder, borrar), el formulario de la apuesta (pesos con − / + y campo, porque React
      Native no trae un deslizador), el historial y las reglas.
  - **More** (`more.tsx`): lo que no tiene pestaña. Portfolio y Account and data (pantallas de la
    app), Fundamentals Lab y Earnings Radar, y las secciones públicas (Markets, News, Opinion,
    Media), que se abren en el navegador.
  - **Portfolio** (`portfolio.tsx`): buscar una empresa y añadirla como posición (acciones y coste
    medio, este opcional) o a la watchlist; quitar; guardar. Se llega desde Overview ("Edit"),
    Analysis, Watchlist, Community y More.
  - **Account** (`account.tsx`): quién ha entrado, salir, **lo que se guarda** tal como está
    ahora (nombre, email, forma de entrar, posiciones, watchlist, cartera compartida, apuestas y
    comentarios, como en `/account/` de la web), enlace a la página de privacidad, **cambiar la
    contraseña** (solo cuentas de email; `PUT /api/auth/password` con el token) y **borrar la
    cuenta** (lo pide Apple a toda app con cuentas), con confirmación.
- **Sesión** (`src/lib/session.tsx`, `api.ts`, `storage.ts`): la app manda email y contraseña a
  `POST /api/app/auth/password`, recibe un token y lo guarda en el llavero del teléfono
  (`expo-secure-store`); lo envía en cada petición como `Authorization: Bearer`. Al abrirse pide
  uno nuevo (`/api/app/auth/renew`), así que un móvil que se usa no vuelve a pedir la contraseña;
  sin usarla 30 días, sí. Si el portal rechaza el token, la app vuelve a la pantalla de entrada
  (salvo en una petición marcada `stays`: el 401 de "esa no es tu contraseña actual" habla de lo
  enviado, no del token).
  Sin conexión se queda con el token guardado y las pantallas dicen que no llegan al portal.
- **Aspecto**: el del portal. Colores de `global.css` en `src/lib/theme.ts`, IBM Plex Sans y Mono
  (`@expo-google-fonts`), secciones bajo una raya y sin cajas, verde y rojo solo para un movimiento.
  El gráfico y las marcas se dibujan con `react-native-svg` (`src/components/`).
- **Comprobado del primer tramo** (2026-10-07): `make check` en verde (tipos, lint y `expo-doctor`, 21 de 21), y
  `npx expo export` compila los paquetes de iPhone y de Android sin errores. En la
  vista de navegador (`make web`, 375 px) contra el portal en local con cifras de ejemplo y la
  cuenta de demostración: contraseña equivocada (sale el mensaje del portal), entrar, Overview
  entero, buscar "johnson" y seguir JNJ, guardar (el `PUT` pasa con el token y sin `Origin` propio
  del portal), quitar, el aviso de "faltan las acciones" sin enviar nada, recargar la página y
  seguir dentro, salir y que `/portfolio` ya no se alcance.
- **Comprobado de Analysis, Watchlist y Community** (2026-10-07): `make check` en verde y los dos
  paquetes nativos compilan. En la vista de navegador (375 px) contra el portal en local con cifras
  de ejemplo: Analysis entera; Watchlist en lista y en mapa, encender las posiciones, abrir una
  acción desde el mapa, su gráfico y su lectura completa (con consenso de analistas); Community con
  el ranking y la competición (cuenta atrás, podio, gráfico del mes, clasificación, reglas);
  añadir acciones a la apuesta y ver cómo se reparten los pesos; More y abrir el editor de la
  cartera desde ahí.
- **Comprobado del 2026-10-08**: `make check` en verde y los dos paquetes nativos compilan. En la
  vista de navegador (375 px) contra el portal en local (registro abierto, sin captcha): crear una
  cuenta (contraseña corta: sale el mensaje del portal; buena: entra en My Hub), Account con una
  cuenta vacía y con la de demostración, cambiar la contraseña (actual equivocada: mensaje y la
  sesión sigue; buena: cambia), el volumen bajo el gráfico de AAPL, y las noticias en Overview
  (con las de ejemplo, quitando un momento el filtro que las esconde).
- **Sin probar del 2026-10-08**: **el captcha en el WebView** (solo existe en el teléfono y contra
  un portal con Turnstile, o sea el público ya desplegado), las noticias con titulares de verdad
  y su marca de tono, y el icono y el arranque en un teléfono (Expo Go enseña los suyos).
- **Sin probar**: **nada de lo anterior en un teléfono** (el usuario sí vio en su iPhone, con
  Expo Go, el primer tramo y el login con Google): gestos, teclado, zonas seguras y rendimiento
  del gráfico de velas a dos años. Tampoco: enviar o retirar la apuesta, compartir la cartera,
  comentar y borrar comentarios (las rutas están cubiertas por los tests del portal, pero no se
  pulsaron los botones), "Follow" desde Watchlist, y las frases del modelo (en local no hay
  clave). Borrar la cuenta desde la pantalla.
- **Lo que la web tiene y la app todavía no**: en Overview, las tarjetas de herramientas (están
  en More); en Watchlist, el muro de varias gráficas a la vez y la tabla ordenable (en un móvil
  hay una gráfica por pantalla); en Account, descargar los datos en JSON.

## Cómo probarlo en el móvil (Expo Go)

1. Instalar **Expo Go** en el teléfono. Teléfono y ordenador en la misma wifi.
2. `make start` y escanear el QR (iPhone: con la cámara; Android: desde Expo Go).
3. Entrar con Google (solo con `make start TUNNEL=1`, ver abajo) o con una cuenta de email y
   contraseña de themarkethub.app, o crear una ahí mismo.

En Windows el puerto 8000 puede estar ocupado por otro proyecto: el workspace tiene
`mobile-api-windows` (portal en el 8010) y `mobile-web-windows` en `.claude/launch.json`. El
`LAN_IP` del `Makefile` solo se calcula en macOS: en Windows, `make start LOCAL=1 LAN_IP=<ip>`.

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
- **Crear cuenta con email** (2026-10-08) se hace en la app. La pantalla de entrada lee
  `/api/config`: con `registration: "closed"` no ofrece crear cuenta; con `"open"` (un portal en
  local) manda el formulario sin más; con `"captcha"` (el público) enseña el widget de Turnstile
  en un WebView (`components/captcha.tsx`, `react-native-webview`, que viene en Expo Go). El
  widget solo funciona en una página del dominio de su clave, así que el portal sirve una con el
  widget y nada más, **`GET /api/app/captcha`**, que pasa el token a la app
  (`ReactNativeWebView.postMessage`); la app lo manda con el nombre, el email y la contraseña a
  **`POST /api/app/auth/register`**, que hace las mismas comprobaciones que el registro de la web
  y devuelve un token en vez de poner cookie. El token del captcha vale una vez: tras un rechazo
  la app vuelve a dibujar el widget. Un enlace tocado dentro del widget se abre en el navegador.
  Las dos rutas están en producción desde el 2026-10-08 (comprobado: la página del captcha
  responde con el widget, y un registro sin captcha da 400 con el mensaje del portal).
- **Apple** pedirá "Sign in with Apple" al ofrecer el de Google, y una dirección con la política
  de privacidad; la del portal tendrá que decir lo que guarda la app (hoy, nada nuevo en el
  servidor).
- **Identificadores de la app** (`ios.bundleIdentifier`, `android.package`): sin poner. Son para
  siempre una vez publicada: los elige el usuario en el paso 4.
- **Icono y pantalla de arranque** (2026-10-08): la marca del portal (la línea del cero y un
  movimiento a su derecha) en la tinta del portal sobre su fondo. Los dibuja
  `scripts/draw-icons.mjs` (`make icons`), sin dependencias: `icon.png` (1024, sin
  transparencia, para iPhone), las tres capas de Android (la marca dentro de la zona que ningún
  recorte quita), `splash-icon.png` (la marca sola; `app.json` la pone a 76 de ancho sobre el
  fondo) y el favicon de la vista de navegador. Se quitó `assets/expo.icon` (el icono de Icon
  Composer de la plantilla, con el logo de Expo) y `ios.icon`: iPhone usa `icon.png`. Si se
  quiere el icono por capas de iOS 26, se hace en Icon Composer (macOS) y se vuelve a poner.
- **Las herramientas** (Fundamentals Lab, Earnings Radar) comparten sesión con la web por cookie de
  dominio; la app no tiene esa cookie. Abrirlas desde la app pedirá login otra vez hasta que se
  haga un puente (pendiente de decidir cómo).
- **La vista web** (`make web`) es solo para desarrollar: guarda el token en `localStorage`, que no
  es sitio para una cuenta de verdad. No se publica.
- La plantilla de Expo traía `.claude/settings.json` activando el plugin `expo` de Claude Code; se
  quitó para no activar nada sin que el usuario lo pida. Si se quiere, se vuelve a poner.
