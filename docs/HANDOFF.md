# Estado del proyecto y cómo continuar

Última actualización: 2026-10-15.

## Qué se pidió

Una app de móvil para iPhone y Android con la funcionalidad de My Hub (el área privada de
https://themarkethub.app), publicada en las dos tiendas. Decisiones del usuario (2026-10-07):
**Expo (React Native) + EAS Build**, y estar en las tiendas (no una PWA).

## El plan, por pasos

| Paso | Qué | Estado |
|---|---|---|
| 1 | Repo `market-hub-mobile` con Expo y TypeScript, submódulo del workspace | Hecho (repo público en GitHub, submódulo de `market-hub`) |
| 2 | Sesión por token en la API del portal, con sus tests | Hecho y **desplegado** (2026-10-07, revisión `market-hub-00023-q6q`) |
| 3 | Entrar con email y contraseña, Overview y Portfolio, probados en el móvil con Expo Go | Hecho; probado en la vista de navegador y, el 2026-10-13, en el simulador de iPhone |
| 3b | Entrar con Google desde la app, por el navegador del teléfono | Hecho y **desplegado** (2026-10-07, revisión `market-hub-00025-gj8`; la URI de vuelta ya está en el cliente OAuth). **Falta** que el usuario lo pruebe en el teléfono |
| 4a | Crear cuenta con email desde la app, con el captcha en un WebView | Hecho (2026-10-08), probado en la vista de navegador sin captcha, y el portal **desplegado** (revisión `market-hub-00027-wcg`). **Falta probar el captcha en un teléfono** |
| 4b | Icono y pantalla de arranque de Market Hub | Hecho (2026-10-08); se ven en una compilación, no en Expo Go |
| 4c | Identificadores y configuración de EAS | Hecho (2026-10-08): `app.themarkethub.hub` en las dos plataformas, `eas.json`, `make apk` y `make aab`. `eas init` hecho el 2026-10-13: proyecto `@alejandrorodriguezalvarez884/market-hub` en Expo, con su id en `app.json`; `make ipa` y `make testflight` para iPhone |
| 4d | Login con Apple | Escrito (2026-10-13) en la app y en el portal, con sus tests, y el portal **desplegado** (revisión `market-hub-00035-w65`); **sin probar con Apple de verdad** (Expo Go no lleva el módulo: hace falta una compilación, y esa pide la cuenta de Apple Developer, que el usuario aún no tiene) |
| 5 | Analysis, Watchlist y Community | Hecho (2026-10-07); probado en la vista de navegador y, el 2026-10-13, en el simulador de iPhone |
| 5b | Lo que la web tenía y la app no: noticias en Overview, volumen en la ficha, lo guardado y cambiar contraseña en Account | Hecho (2026-10-08) y probado en la vista de navegador |
| 6a | Google Play: ficha, gráficos, formularios y privacidad | **En espera** (decisión del usuario, 2026-10-08): no tiene teléfono Android, y Google lo exige para verificar una cuenta personal nueva; también hace falta para instalar el APK y sacar las capturas. Se retoma cuando tenga uno. Preparado (2026-10-08) en `store/google-play/LISTING.md`, que lleva los pasos y quién hace cada uno. La página de privacidad del portal ya lo dice, desplegada. **Faltan** la cuenta de Play (personal: 12 testers 14 días antes de producción) y las capturas |
| 6b | App Store y TestFlight | **Enviada a revisión** por el usuario el 2026-10-13 a las 20:50: versión 1.0.0, **build 4**, estado "Waiting for Review". Si Apple la aprueba, sale sola a la tienda (decisión del usuario). Todo lo que se puso en la ficha y por qué está en `store/app-store/LISTING.md`. Si la rechaza, el motivo llega al correo del usuario y a App Store Connect (App Review) |

## Dónde estamos

- **2026-10-15: la ficha de valor del portal, en la app, y Options Lab** (a petición del usuario).
  **Versión 1.1.0, build 5, compilada y subida a App Store Connect para TestFlight** el mismo día
  (`eas build --platform ios --profile production --auto-submit` desde Windows con `npx.cmd`, porque
  PowerShell no deja correr `npx.ps1`; el usuario entró en EAS y en su cuenta de Apple, con el código
  de dos pasos, en la terminal). **No se ha enviado a revisión**: eso lo decide el usuario. La 1.1.0
  porque la 1.0.0 (build 4) estaba en revisión. Build de EAS `2d7de5cf-3026-49c6-9d3c-149c9b2ce39f`. La pantalla de una acción
  o un fondo (`stock/[ticker].tsx`) lleva, debajo de "How it stands", lo nuevo de `/quote/` del
  portal (`components/quote-more.tsx`, de `GET /api/public/quote/more`): frente al S&P 500 (1, 3
  y 5 años), año a año, caídas desde máximos con volatilidad, beta y mejor/peor día; para una
  empresa, ingresos y beneficio (años o trimestres), la empresa y sus cifras; para un fondo, top
  posiciones (cada una abre su ficha), sectores, su ficha (comisión, patrimonio, yield…) y la mezcla
  de activos. Si el portal no responde, la pantalla queda como antes. El buscador marca los fondos
  ("ETF", "Mutual fund") y un fondo se puede seguir (el portal lo acepta desde el 2026-10-15).
  **Options Lab** se añade a las herramientas de More (`lib/tools.ts`, icono el de la web). Tipos en
  `lib/types.ts` (`QuoteMore`, copia de `site/src/lib/market.ts` del portal). Comprobado: `tsc` y
  lint en verde; `expo-doctor` 20/21 (5 paquetes con un parche más nuevo, como antes de este
  cambio). Visto en la vista de navegador (375 px) contra el portal en local con Yahoo de verdad
  (`mobile-api-live-windows` en `.claude/launch.json` del workspace): SCHD y AAPL con todas sus
  secciones, buscar "vfiax" y seguirlo. **No se pudo ver** abrir Options Lab dentro de la app (el
  WebView no existe en la vista de navegador): queda para el simulador o el teléfono.

- **Estado al cerrar el 2026-10-13**: la app de iPhone está **en revisión en Apple** (1.0.0,
  build 4). Lo que queda, por orden de lo que más importa:
  1. **Esperar a Apple.** Aprobada, se publica sola en 175 países, gratis. Rechazada: leer el
     motivo, arreglar, `make ipa` + `make testflight` (o `eas build --auto-submit`), elegir la
     build nueva en la versión y volver a enviar.
  2. **Sin probar con Apple de verdad**: borrar una cuenta de Apple desde la build 4 (que el
     iPhone pida confirmar y que la app desaparezca de "Iniciar sesión con Apple"). El usuario
     dijo que la build 3 iba bien (entrar con Apple y Google, las herramientas dentro de la app).
  3. **La Digital Services Act** está "In Review" en App Store Connect (Business): mientras no
     se verifique puede retrasar la UE.
  4. **Cabos menores**: las capturas siguen también en el apartado "iMessage App" de la versión
     (sobran); la clave de la API de App Store Connect que hizo EAS es ADMIN (basta
     APP_MANAGER); el `.p8` de Sign in with Apple quedó en las Descargas del usuario; en el
     mapa de Watchlist las etiquetas se pisan con muchas acciones; la cuenta de demostración
     del revisor tiene una contraseña fácil (decisión del usuario).
  5. **Android** sigue en espera de un teléfono Android (`store/google-play/LISTING.md`, con los
     textos ya al día).

- **Expo SDK 57**, React Native 0.86, React 19, `expo-router` (rutas en `src/app/`), TypeScript
  estricto. Sin carpetas `ios/` ni `android/`: las genera Expo al compilar.
- **Pantallas**: `sign-in` (en un iPhone, el botón de Apple; "Continue with Google" y, debajo, email y contraseña, para entrar o
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
    app), las cuatro herramientas (Fundamentals Lab, Earnings Radar, Peer Map y Playground), que
    se abren **dentro de la app**, las secciones públicas (Markets, News, Opinion, Media) y Help
    (Contact, Terms), que se abren en el navegador.
  - **Una herramienta** (`tool/[key].tsx`, 2026-10-13): la web de la herramienta en una página de
    la app (`react-native-webview`), con la sesión de quien ha entrado en la app y sin el menú
    web de My Hub.
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
- **Comprobado del 2026-10-13, en el simulador de iPhone** (iPhone 18 Pro, iOS 27, Xcode 27, con
  Expo Go, contra el portal en local con cifras de ejemplo y la cuenta de demostración; lo abre
  la configuración `mobile-ios` de `.claude/launch.json` del workspace, con `mobile-api`
  arrancado antes). Entrar con email y contraseña (campos vacíos: el aviso), Overview, Analysis,
  Watchlist en lista y en mapa, la ficha de una acción con velas a 6 meses y a 2 años, buscar
  otra acción ("Look") y seguirla ("Follow", guardado en el portal), compartir la cartera con un
  nombre, la competición entera, armar una apuesta de tres acciones, mover un peso, enviarla y
  retirarla, comentar y borrar el comentario, More, el editor de la cartera (añadir, poner
  acciones, guardar, quitar), Account con lo guardado, y cambiar la contraseña con la actual
  equivocada (el mensaje sale y la sesión sigue). Cerrar Metro y volver a abrir la app: sigue
  dentro. Tres fallos que solo se veían en nativo, arreglados ese día:
  - al desplazar una pestaña, el contenido pasaba por debajo de la hora y la batería (`Screen`
    en `components/ui.tsx`: el hueco de la barra de estado es del marco, no del contenido);
  - "Save and open the overview" volvía a la pantalla desde la que se abrió el editor (More,
    por ejemplo) en vez de a Overview (`router.dismissTo("/")`);
  - en Analysis un sector largo ("Consumer Defensive") salía cortado: ahora ocupa dos líneas.
  Los cinco paquetes de Expo que iban un parche por detrás del SDK 57 se subieron
  (`npx expo install --fix`); `make check` en verde, 21 de 21.
- **La app de verdad en el simulador** (2026-10-13, tarde): `make sim` compila en EAS una app para
  simulador (perfil `simulator` de `eas.json`: sin firmar, sin cuenta de Apple, y hablando con
  `make api` de este equipo), que se instala en el simulador; es la app con su icono, su arranque
  y sus módulos nativos, que Expo Go no tiene. Visto: la pantalla de arranque con la marca, el
  botón blanco "Continue with Apple" encima del de Google, y que al pulsarlo sale la hoja del
  sistema (en el simulador pide entrar en una cuenta de Apple en Ajustes: no se siguió). Y el
  **teclado en pantalla**, que sale tras reiniciar el simulador, con tres fallos, arreglados:
  - los resultados de una búsqueda salían bajo el campo, tapados por el teclado (Watchlist, el
    editor de la cartera, la apuesta), y lo mismo el botón que envía un formulario (comentar,
    compartir, cambiar la contraseña, entrar). Ahora la pantalla se desplaza lo justo para que
    queden a la vista (`useClearOfKeyboard` y `keeps` de `Field` en `components/ui.tsx`);
  - en la pantalla de entrada el teclado tapaba medio campo de la contraseña y el botón: el
    `KeyboardAvoidingView` no hacía nada ahí, y se cambió por lo mismo que usan las demás;
  - nada quitaba el teclado, que tapa las pestañas: ahora se va al arrastrar la página.
  Los arreglos se vieron en Expo Go (búsqueda, comentario, entrada y cambiar la contraseña) y
  van, con More > Help, en la **build 2** (1.0.0, subida a App Store Connect ese mismo día con
  `eas build --auto-submit --non-interactive`: con las credenciales ya guardadas en EAS no pide
  la cuenta de Apple). La build 1 no los lleva.
- **Capturas para el App Store** (2026-10-13): `store/app-store/screenshots/`, cinco. Cómo se
  repiten: `make sim` (la app de verdad, que habla con el portal de este equipo), instalada en
  el simulador **iPhone 18 Pro** (1206 × 2622, el tamaño que pide el recuadro de App Store
  Connect; las del Pro Max, 1320 × 2868, las rechaza); el portal en local con precios de Yahoo y sin claves de pago
  (`mobile-api-live` de `.claude/launch.json` del workspace); una cuenta local con una cartera
  variada; `xcrun simctl status_bar … override --time 9:41` y `xcrun simctl io … screenshot`.
  `simctl` las da con canal alfa y Apple no lo admite: se quitó con `sips`.
  Visto de paso: en el mapa de Watchlist, con muchas acciones, las etiquetas se pisan (COST y
  AAPL, LLY y AMZN); la captura va con solo las cuatro de la watchlist. Sin arreglar.
  Y en la pantalla de entrada, con el teclado abierto en un iPhone de este tamaño, la marca
  subía hasta pisar la hora: arreglado (el hueco de la barra de estado es del marco), para la
  compilación siguiente a la build 3.
- **Cabecera e imagen de búsqueda del App Store** (2026-10-13): `store/app-store/art/`, dos
  páginas HTML (`header.html`, `search.html`, con `art.css`) que Chrome pinta a PNG
  (`make art`, `scripts/draw-store-art.sh`), con la tipografía de la app (`node_modules`) y sus
  capturas. Son opcionales en App Store Connect. Apple no publica en su guía los márgenes que
  recorta: el texto va al centro por eso, y cómo quedan en la tienda no se ha visto. Si se
  repiten las capturas, `make art` después.
- **Los textos de las tiendas, con el enfoque de la IA** (2026-10-13, lo pidió el usuario): el
  titular es la cartera leída por IA ("Your portfolio, read by AI."), no "Your stocks,
  described". Reescritos el texto promocional, la descripción (con "AI readings", "AI tools" y
  un "About the AI" que dice qué recibe el modelo), las palabras clave y las notas al revisor
  (dónde se usa la IA y qué se le manda), en inglés y en español, en
  `store/app-store/LISTING.md`, y los de `store/google-play/LISTING.md` a juego. Solo se dice lo
  que la app hace: las frases las escribe un modelo y las cifras las calcula el código; la IA
  no aconseja. Las capturas no se tocaron (se sacaron en local sin clave del modelo: sus frases
  son las del código).
- **Sin probar en el simulador** (2026-10-13; el teclado ya sí, arriba): **el teclado en pantalla** (el simulador escribe
  con el teclado del Mac y no lo saca: falta ver que no tape el campo ni los resultados de una
  búsqueda al pie de la pantalla, como la de Watchlist), el captcha y el login con Google (van
  contra el portal público y los teclea el usuario), borrar la cuenta, y el icono y el arranque
  (Expo Go enseña los suyos; hace falta una compilación, y para hacerla en local, CocoaPods).
- **Sin probar del 2026-10-08**: **el captcha en el WebView** (solo existe en el teléfono y contra
  un portal con Turnstile, o sea el público ya desplegado), las noticias con titulares de verdad
  y su marca de tono, y el icono y el arranque en un teléfono (Expo Go enseña los suyos).
- **Sin probar en un teléfono de verdad**: casi todo (el usuario sí vio en su iPhone, con Expo
  Go, el primer tramo y el login con Google). El simulador va con la potencia del Mac: el
  rendimiento del gráfico de velas a dos años hay que verlo en el teléfono. Tampoco las frases
  del modelo (en local no hay clave).
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
- **Entrar con Apple** (`src/lib/apple.ts`, 2026-10-13; `expo-apple-authentication`, con su
  plugin y `ios.usesAppleSignIn` en `app.json`). La app pide un `nonce` al portal
  (`/api/app/auth/apple/begin`), se lo pasa al inicio de sesión del iPhone y manda al portal el
  token que Apple firma, con el nombre (Apple lo da solo la primera vez, y a la app, no en el
  token): `/api/app/auth/apple` devuelve la sesión. Quien comprueba el token es el portal
  (`market-hub-landing/src/markethub/applesignin.py`). El botón es el de Apple, blanco, encima del
  de Google, y solo sale en un iPhone, con el módulo presente y contra un portal que dice
  `apple_sign_in` en `/api/config`.
  - **En Expo Go no sale**: Expo Go no lleva el módulo (`isAvailableAsync` da falso; visto en el
    simulador el 2026-10-13). Tampoco en Android ni en la vista de navegador. Se prueba en una
    compilación: TestFlight, o `npx expo run:ios` en este Mac, que pide CocoaPods.
  - El portal solo toma tokens hechos para `app.themarkethub.hub`.
  - **Borrar una cuenta de Apple** (2026-10-13; `tellAppleBeforeDeleting` en `lib/apple.ts`): el
    iPhone pide confirmar con Apple otra vez y lo que da va al portal, que hace que Apple revoque
    el token (`market-hub-landing/src/markethub/applerevoke.py`). No se guarda nada. Si el usuario
    cierra la hoja de Apple, no se borra nada y se le dice; si Apple o el portal no pueden, la
    cuenta se borra igual. Solo se hace si el portal dice `apple_revocation`. Va en la build 4.
    **Sin probar**: pide una cuenta de Apple de verdad y la clave del desarrollador en el portal.
  - **Pendiente**: una cuenta de Apple no tiene cómo entrar en la web.
- **Denunciar y bloquear** (2026-10-13; `components/thread.tsx`, `lib/community.ts`): cada
  comentario ajeno lleva "Report" y "Block", con su confirmación. Denunciado o bloqueado, deja de
  verse. En Account and data, la fila "Blocked" enseña a quién se bloqueó, con "Unblock". Lo
  hace el portal (`market-hub-landing/src/markethub/opinion.py`); la app solo pinta lo que le
  llega (`hidden` en cada comentario). Visto en el simulador con dos cuentas de prueba. La app
  no tiene la revisión del dueño: esa está en `/account/` de la web.
- **App Store** (2026-10-13): `store/app-store/LISTING.md`, como el de Play. Lo que no estaba
  previsto y sale de leer las reglas de Apple: **la 1.2** pide, a una app con contenido de
  usuarios, un filtro, poder denunciar un contenido y bloquear a un usuario (hecho, arriba), y
  **un contacto publicado**: `/contact/` del portal, desde el 2026-10-13. `ios.config.usesNonExemptEncryption: false` en `app.json` (la app solo usa HTTPS).
- **Identificadores de la app**: `app.themarkethub.hub` en `ios.bundleIdentifier` y en
  `android.package`, elegido por el usuario (2026-10-08). Son para siempre una vez publicada.
- **Google Play** (2026-10-08; el usuario quería ir publicando ahí primero, con cuenta personal;
  **lo dejó en espera ese mismo día hasta tener un teléfono Android**, que Google pide para
  verificar la cuenta. No se abrió la cuenta ni se lanzó ninguna compilación).
  Todo lo que Play Console pide está en `store/google-play/LISTING.md`: los pasos en orden, los
  textos de la ficha en inglés y en español (dentro de los límites de Play), y las respuestas a
  los formularios (acceso, anuncios, clasificación, público, Data safety, funciones
  financieras), escritas de lo que la app hace hoy. Los gráficos (icono de 512 y feature graphic
  de 1024 × 500, este sin alfa) los dibuja `make icons`.
  - **EAS** (`eas.json`): `preview` da una APK para instalar a mano (`make apk`), `production` el
    `.aab` de Play (`make aab`) con el número de versión llevado por EAS (`appVersionSource:
    remote`, `autoIncrement`). En este equipo no hay Android SDK ni Java: se compila en la nube
    de Expo, con la cuenta de Expo del usuario. `eas-cli` no tiene sesión: **el usuario hace
    `npx eas-cli@latest login` y `npx eas-cli@latest init`** (este escribe `extra.eas.projectId`
    en `app.json`, que se commitea). No se ha lanzado ninguna compilación.
  - **Permisos**: generado el proyecto de Android una vez (`expo prebuild`, borrado después): el
    manifiesto lleva `INTERNET`, `VIBRATE` y `SYSTEM_ALERT_WINDOW` (los dos últimos, de la
    plantilla); los de almacenamiento se quitan con `android.blockedPermissions`.
  - **Sin hacer**: las capturas (del APK instalado), la cuenta de revisores, y vaciar
    `MARKETHUB_APP_REDIRECTS` antes de producción.
- **Icono y pantalla de arranque** (2026-10-08): la marca del portal (la línea del cero y un
  movimiento a su derecha) en la tinta del portal sobre su fondo. Los dibuja
  `scripts/draw-icons.mjs` (`make icons`), sin dependencias: `icon.png` (1024, sin
  transparencia, para iPhone), las tres capas de Android (la marca dentro de la zona que ningún
  recorte quita), `splash-icon.png` (la marca sola; `app.json` la pone a 76 de ancho sobre el
  fondo) y el favicon de la vista de navegador. Se quitó `assets/expo.icon` (el icono de Icon
  Composer de la plantilla, con el logo de Expo) y `ios.icon`: iPhone usa `icon.png`. Si se
  quiere el icono por capas de iOS 26, se hace en Icon Composer (macOS) y se vuelve a poner.
- **Las herramientas dentro de la app** (2026-10-13; `src/app/(hub)/tool/[key].tsx`,
  `src/lib/tools.ts`). Son webs aparte que solo admiten a quien trae la cookie de sesión del
  portal, y la app tiene un token, no una cookie. La página empieza en el portal
  (`/api/app/web/enter?to=<herramienta>`) con el token en la cabecera de esa única petición; el
  portal pone la cookie y sigue a la herramienta
  (`market-hub-landing/src/markethub/appweb.py`). Lo que hay que saber:
  - La página se abre **sin almacén** (`incognito`): la cookie vive lo que la página, y al salir
    no queda nada en el teléfono. Cada vez que se abre una herramienta se pasa por el puente.
  - **El menú web de My Hub se esconde** con un estilo que la app inyecta antes de pintar
    (`header:has(nav[aria-label="My Hub"])` y lo mismo con `aside`): depende de que las
    herramientas sigan marcando así su menú (`HubNav.astro`). Si una lo cambia, vuelve a verse.
  - Un enlace que sale de la herramienta se abre en el navegador del teléfono; el icono de la
    cabecera abre ahí la página en la que se está. El botón atrás de Android retrocede dentro de
    la herramienta antes de salir.
  - Qué herramientas hay lo dice el portal (`tools` en `/api/config`).
  - **Visto** en el simulador de iPhone con Expo Go: Fundamentals Lab corriendo en este equipo
    detrás del login del portal local (`mobile-api` y `mobile-tool` de `.claude/launch.json`),
    abierta desde More, con sesión, sin el menú, y navegando dentro. Va en la **build 3**, con el
    puente del portal ya desplegado (`market-hub-00037-cbm`). **Sin ver**: el puente en producción
    con una cuenta de verdad (falta probar la build 3 en un teléfono), las otras tres
    (misma cookie; Peer Map y Playground no están en este workspace), cómo queda cada una a
    ancho de teléfono, y Android.
- **La vista web** (`make web`) es solo para desarrollar: guarda el token en `localStorage`, que no
  es sitio para una cuenta de verdad. No se publica.
- La plantilla de Expo traía `.claude/settings.json` activando el plugin `expo` de Claude Code; se
  quitó para no activar nada sin que el usuario lo pida. Si se quiere, se vuelve a poner.
