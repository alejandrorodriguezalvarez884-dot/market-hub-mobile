# App Store: la ficha y los formularios

Lo que App Store Connect pide para publicar Market Hub en iPhone, ya escrito para copiar y pegar,
como `store/google-play/LISTING.md` hace con Play. Los textos van en inglés (el idioma de la app)
y en español. **Si la app cambia (un SDK nuevo, un dato nuevo), se revisan antes de subir esa
versión.**

Identificador: `app.themarkethub.hub` (para siempre). Solo iPhone (`ios.supportsTablet` no está
puesto: en un iPad corre como app de iPhone y no hacen falta capturas de iPad).

Las reglas de Apple citadas aquí se leyeron en su web el 2026-10-13.

## 1. Pasos, en orden

| # | Qué | Quién | Estado |
|---|---|---|---|
| 1 | Apuntarse al Apple Developer Program (99 € al año, como persona) | Usuario | **Hecho**: inscrito y pagado el 2026-10-13, activa desde el 2026-10-14 (Individual, Team ID `J44H9U6HLW`, se renueva el 2027-10-14) |
| 2 | `npx eas-cli@latest init` en este repo (crea el proyecto en Expo y escribe su id en `app.json`) | Agente | Hecho (2026-10-13) |
| 3 | Publicar un contacto en el portal (apartado 6, regla 1.2, y la Support URL) | Usuario dice cuál, agente lo pone | **Hecho** (2026-10-13): `https://themarkethub.app/contact/`, con el email que eligió el usuario; la app lo enlaza desde More > Help (en la compilación siguiente a la build 1) |
| 4 | Desplegar el portal con las rutas de "Sign in with Apple" y con denunciar y bloquear (`make deploy` en `market-hub-landing`) | Agente, con permiso | Hecho (2026-10-13, revisión `market-hub-00035-w65`) |
| 5 | Primera compilación de iPhone con EAS (`make ipa`) y subida a TestFlight (`make testflight`). EAS pide entrar con la cuenta de Apple en la terminal y crea el certificado y el perfil, con "Sign in with Apple" activado en el identificador. Puede que la app tenga que existir antes en App Store Connect (paso 8) | Usuario, en su terminal | **Hecho** (2026-10-13): versión 1.0.0, build 1, subida a App Store Connect (app `6822290220`). EAS creó la app allí con el nombre de `app.json`, "Market Hub", que estaba cogido: quedó como "Market Hub (0f4413)" y el usuario lo cambió ese día en App Store Connect por **"The Market Hub"**, con categoría Finance (apartado 2). La clave de la API de App Store Connect la generó EAS con rol ADMIN y la guarda en sus servidores; basta APP_MANAGER, y se cambia en Users and Access > Integrations. Grupo de TestFlight "Team (Expo)" |
| 6 | Probar en el iPhone, desde TestFlight (la **build 2**, subida el 2026-10-13 con los arreglos del teclado): "Sign in with Apple" (no se puede probar antes: Expo Go no lleva el módulo), Google, el captcha al crear cuenta, el teclado, el icono y el arranque | Usuario | Pendiente |
| 7 | Clave de "Sign in with Apple" (.p8) y revocar el token al borrar la cuenta (apartado 6) | Usuario crea la clave, agente escribe el código | Pendiente |
| 8 | Crear la app en App Store Connect y rellenar la ficha (apartados 2 y 3), la privacidad (4) y la revisión (5) | Agente deja los campos, usuario guarda | **Casi** (2026-10-13). Guardado por el usuario: la página de la versión entera (textos, capturas, cabecera e imagen de búsqueda, build 3, cuenta de demostración y contacto) y la clasificación por edades (13+). En borrador: App Privacy (falta "Publish"). **Falta, y es del usuario**: Content Rights (la app enseña precios y titulares de terceros; los precios salen de Yahoo Finance por una librería no oficial), la declaración de la Digital Services Act (comerciante o no), confirmar el precio (0,00) y elegir los países, y decidir si la versión se publica sola al aprobarse (así está) o a mano |
| 9 | Capturas del simulador (apartado 3) | Agente | **Hecho** (2026-10-13): cinco, en `store/app-store/screenshots/` |
| 10 | Antes de enviar: vaciar `MARKETHUB_APP_REDIRECTS` en el portal y desplegar | Agente, con permiso | Pendiente |
| 11 | Enviar a revisión. **Publicar es decisión del usuario, versión a versión** | Usuario | Pendiente |

## 2. La ficha

### English (U.S.), el idioma principal

**Name** (30 como mucho). Elegido por el usuario y guardado en App Store Connect el 2026-10-13
("Market Hub" a secas estaba cogido).

```
The Market Hub
```

**Subtitle** (30 como mucho). También elegido por el usuario y guardado ese día.

```
AI-based portfolio tracker
```

**Promotional text** (170 como mucho; se puede cambiar sin enviar versión)

```
Your portfolio and any US stock, read back to you by AI in plain words. AI tools for a company's numbers and its results. It describes; it never tells you what to do.
```

**Keywords** (100 como mucho, separadas por comas, sin repetir las del nombre)

```
stocks,watchlist,investing,holdings,sp500,nasdaq,charts,fundamentals,earnings,analysis,finance
```

**Description** (4000 como mucho)

```
The Market Hub is a private page for your own stocks, read back to you by AI. Add what you hold, or just the stocks you follow, and a language model puts the figures into plain words: what your portfolio is made of, how it has moved and how it stands against the indices.

The AI describes. It never tells you to buy, sell or hold, it makes no predictions and it sets no price targets. The app does not connect to any broker and it cannot trade.

AI READINGS
• Your portfolio read back in plain sentences: how it stands against the index, how concentrated it is, its sectors and how it moves
• A reading of every stock you follow, aspect by aspect: trend, momentum, 52-week range, volume, what analysts estimate and its valuation
• The same reading for any other US stock you look up

AI TOOLS
• Fundamentals Lab: every number of a company, its valuation against its own history, its technical picture, and an AI reading of what the numbers show
• Earnings Radar: what a company's latest results release says, read by AI: guidance, demand, margins and themes
• Playground: a board of charts and tables, put together by asking for it in a chat
• Peer Map: a company next to its peers

YOUR PORTFOLIO
• Its value, today's move and your gain or loss against your own average cost
• Today's holdings next to the S&P 500, the Nasdaq 100, the Dow and the Russell 2000
• What it is made of: by sector, country, volatility and company size
• News on the companies you hold or follow

WATCHLIST
• Each stock on one line: price, trend, and where it stands against its own averages and against the index
• A chart per stock, as candles or as a line, with its 20, 50 and 200-day averages and volume
• All your stocks on one map

COMMUNITY
• Share your portfolio's mix if you choose to: tickers and weights only, under a name you pick. Never your name, your amounts or what you paid
• A monthly competition among members, with its standings and its discussion

YOUR ACCOUNT
• Sign in with Apple, with Google, or with an email and a password
• The same account as themarkethub.app: what you add here is there too
• See everything that is kept about you, and delete your account and all of it from the app at any time
• No ads and no tracking

ABOUT THE AI
The figures are computed by the app; the AI only puts them into words. To read your portfolio it is sent your tickers, each one's share of the portfolio and their returns. Never your name, your email, how many shares you hold or what you paid. Text written by AI can be wrong.

The Market Hub covers companies listed in the United States. Market data comes from third-party providers and may be delayed or incomplete. Nothing in the app is investment advice.
```

### Spanish (Spain), traducción

**Nombre**

```
The Market Hub
```

**Subtítulo**

```
Tu cartera, leída por IA
```

**Texto promocional**

```
Tu cartera y cualquier acción de EE. UU., contadas por IA en palabras sencillas. Herramientas de IA para las cifras y resultados de una empresa. Nunca te dice qué hacer.
```

**Palabras clave**

```
acciones,bolsa,inversión,valores,seguimiento,sp500,nasdaq,gráficos,fundamentales,resultados,análisis
```

**Descripción**

```
The Market Hub es una página privada para tus acciones, leída por IA. Añade lo que tienes, o solo las acciones que sigues, y un modelo de lenguaje pone las cifras en palabras sencillas: de qué está hecha tu cartera, cómo se ha movido y cómo va frente a los índices.

La IA describe. Nunca te dice que compres, vendas o mantengas, no hace predicciones ni da precios objetivo. La app no se conecta a ningún bróker y no puede operar.

LECTURAS CON IA
• Tu cartera contada en frases sencillas: cómo va frente al índice, cuánto se concentra, sus sectores y cómo se mueve
• Una lectura de cada acción que sigues, aspecto por aspecto: tendencia, impulso, rango de 52 semanas, volumen, lo que estiman los analistas y su valoración
• La misma lectura para cualquier otra acción de EE. UU. que busques

HERRAMIENTAS DE IA
• Fundamentals Lab: todas las cifras de una empresa, su valoración frente a su propia historia, su cuadro técnico y una lectura con IA de lo que muestran las cifras
• Earnings Radar: lo que dice el último comunicado de resultados de una empresa, leído por IA: previsiones, demanda, márgenes y temas
• Playground: un tablero de gráficos y tablas que se compone pidiéndolo en un chat
• Peer Map: una empresa junto a sus comparables

TU CARTERA
• Su valor, el movimiento de hoy y tu ganancia o pérdida frente a tu propio coste medio
• Lo que tienes hoy junto al S&P 500, el Nasdaq 100, el Dow y el Russell 2000
• De qué está hecha: por sector, país, volatilidad y tamaño de empresa
• Noticias de las empresas que tienes o sigues

SEGUIMIENTO
• Cada acción en una línea: precio, tendencia y dónde está frente a sus medias y frente al índice
• Un gráfico por acción, en velas o en línea, con sus medias de 20, 50 y 200 sesiones y el volumen
• Todas tus acciones en un mapa

COMUNIDAD
• Comparte la composición de tu cartera si quieres: solo tickers y pesos, con el nombre que elijas. Nunca tu nombre, tus importes ni lo que pagaste
• Una competición mensual entre miembros, con su clasificación y su debate

TU CUENTA
• Entra con Apple, con Google, o con un email y una contraseña
• La misma cuenta que en themarkethub.app: lo que añades aquí está allí
• Mira todo lo que se guarda de ti, y borra tu cuenta y todo ello desde la app cuando quieras
• Sin anuncios y sin rastreo

SOBRE LA IA
Las cifras las calcula la app; la IA solo las pone en palabras. Para leer tu cartera recibe tus tickers, el peso de cada uno y sus rentabilidades. Nunca tu nombre, tu email, cuántas acciones tienes ni lo que pagaste. Un texto escrito por IA puede equivocarse.

The Market Hub cubre empresas cotizadas en Estados Unidos. La app está en inglés. Los datos de mercado vienen de proveedores externos y pueden llegar con retraso o incompletos. Nada en la app es asesoramiento de inversión.
```

## 3. Gráficos y datos de la ficha

| Qué | Archivo o valor | Estado |
|---|---|---|
| Icono | El de la app (`assets/images/icon.png`, 1024 × 1024, sin transparencia): va dentro de la compilación | Hecho (`make icons`) |
| Capturas de iPhone: de 1 a 10, PNG o JPEG sin transparencia | `store/app-store/screenshots/`: cinco PNG de **1206 × 2622** sin transparencia, del simulador **iPhone 18 Pro**. Es el tamaño del recuadro que App Store Connect enseña y exige, "iPhone with Dynamic Island (medium display)", que solo toma 1179 × 2556 o 1206 × 2622: las primeras se sacaron a 1320 × 2868 (Pro Max) y las rechazó por "File dimensions are invalid". Van en ese recuadro, no en "Header and Search Results", que es otro, opcional y de otro tamaño. Son: Overview, Analysis, Watchlist, la ficha de una acción y el mapa de Watchlist. Con precios de verdad (Yahoo, del 2026-10-13) y una cartera inventada, de una cuenta local ("Alex"); la hora, 9:41. Community no va: en local solo hay un par de carteras | Hecho (2026-10-13) |
| Cabecera de la página ("Header"), opcional: una imagen de 3840 × 1646 o 5244 × 2950 | `store/app-store/art/header-3840x1646.png`: la marca, "Your portfolio, read by AI." y una línea, centrados (la tienda pone encima el nombre y los botones y recorta los bordes) | Hecho (2026-10-13, `make art`) |
| Imagen para los resultados de búsqueda ("Search Results"), opcional: 3840 × 2560, 1920 × 1280 o 5244 × 2950. Sin ella, la tienda enseña las capturas | `store/app-store/art/search-3840x2560.png`: lo mismo dicho a la izquierda y dos capturas de la app a la derecha | Hecho (2026-10-13, `make art`) |
| Categoría | Finance | |
| Copyright | `2026 <el nombre del titular de la cuenta>` | **Pendiente** |
| Support URL | `https://themarkethub.app/contact/` | Hecho (2026-10-13) |
| Marketing URL (opcional) | `https://themarkethub.app` | |
| Privacy Policy URL | `https://themarkethub.app/privacy/` | Dice lo de Apple cuando se despliegue el portal (paso 4) |
| Precio y países | Gratis; los países los elige el usuario | **Pendiente** |
| Cifrado (export compliance) | La app solo usa HTTPS: `ios.config.usesNonExemptEncryption: false` en `app.json`, y App Store Connect no lo pregunta en cada subida | Hecho |

## 4. App Privacy (las etiquetas de privacidad)

- **¿Recoge datos?**: sí. **¿Se usan para rastrear (tracking)?**: no. La app no lleva ningún SDK
  de analítica, de fallos ni de anuncios, y no pide ningún permiso del teléfono.
- Todo lo de la tabla va **ligado al usuario** ("linked to you") y con un solo fin: **App
  Functionality**.

| Tipo de dato (según Apple) | Qué es aquí |
|---|---|
| Contact Info > Name | El nombre de la cuenta |
| Contact Info > Email Address | El email de la cuenta (con Apple puede ser uno de sus relays) |
| Identifiers > User ID | El id de la cuenta (el de Google, el de Apple o uno propio) |
| Financial Info > Other Financial Info | Tickers, número de acciones y coste medio que el usuario escribe |
| User Content > Other User Content | Comentarios, apuestas de la competición y el nombre con que se comparte la cartera |

**A decidir por el usuario**, como en Play: al crear una cuenta con email, el captcha de
Cloudflare ve la IP y datos del navegador para esa comprobación y el portal no guarda nada de
ello; aquí no se ha marcado.

**Puesto en App Store Connect el 2026-10-13** (borrador, sin publicar: "Publish" lo pulsa el
usuario): la URL de la política y los cinco tipos de la tabla, cada uno con App Functionality,
ligado al usuario y sin rastreo.

**Clasificación por edades** (cuestionario de Apple, respondido el 2026-10-13; da **13+**):

| Pregunta | Respuesta | Por qué |
|---|---|---|
| Parental Controls, Age Assurance | No | La app no tiene ninguno |
| Unrestricted Web Access | No | La página de dentro de la app solo enseña las herramientas del portal; un enlace a otro sitio se abre en el navegador del teléfono |
| User-Generated Content | **Sí** | Los comentarios de la competición y las carteras compartidas con un nombre |
| Social Media | No | Es un hilo de comentarios entre miembros, no un feed que reparte contenido. **A juicio del usuario** |
| Messaging and Chat | No | Los comentarios y sus respuestas son públicos para los miembros; no hay mensajes directos. **A juicio del usuario** |
| Advertising | No | |
| Lenguaje, terror, alcohol y drogas, médico, sexo, violencia | None / No | |
| Simulated Gambling, Gambling, Loot Boxes | None / No | La competición es elegir una cartera, sin dinero ni premios |
| Contests | **Frequent** | La competición mensual: los miembros compiten por una clasificación, y es una sección fija |

Apple deja subirla a mano ("Override to Higher Age Rating"); no se tocó. No está pensada para niños.

## 5. App Review Information

- **Sign-in required**: sí. Apple pide una **cuenta de demostración** (regla 2.1): una de email y
  contraseña creada en themarkethub.app, con una cartera pequeña ya puesta. **Creada por el
  usuario el 2026-10-13** ("Demo user"), con cinco posiciones y tres acciones en la watchlist. Sus datos se escriben
  en App Store Connect, **no en este repo**. El portal tiene que estar en marcha durante la
  revisión.
- **Contacto**: nombre, teléfono y email del usuario, en App Store Connect.
- **Notes** (para copiar, en inglés):

```
The Market Hub is the phone version of the private area of https://themarkethub.app. It shows the stocks a user types in (tickers, number of shares, average cost) valued at market prices from third-party data providers, and describes them. It gives no advice, makes no predictions, does not connect to any broker and cannot place orders or move money.

Sign in with the demo account above (email and password). Sign in with Apple and with Google also work. The demo account already has a small portfolio and a watchlist.

Where AI is used: the sentences that read a portfolio or a stock back to the user ("Your portfolio, read back" on Overview, "How it stands" on a stock) are written by a language model (Anthropic) on our server, and so are the readings in Fundamentals Lab and Earnings Radar and the chat of the Playground. The figures are computed by our code; the model only words them. For a portfolio the server sends the model the tickers, each one's share in percent and their returns, with no name, email, account id, share counts or costs; for a stock, that one ticker and its public market figures. This is on our privacy page (https://themarkethub.app/privacy/). The model gives no advice, predictions or price targets.

The analysis tools under More (Fundamentals Lab, Earnings Radar, Peer Map, Playground) are our own web tools, shown inside the app and signed in with the same account; everything else in the app is native.

Account deletion: More > Account and data > Delete my account. It deletes the account and everything kept about it at once.

Members can write comments in Community > Monthly competition > Discussion. Under every comment that is not your own there is "Report" and "Block". A reported comment is hidden from whoever reported it at once, and from everybody once two members have reported it, until we review it; we remove comments that break the rules. Blocking a member hides everything they write from you; More > Account and data lists who you blocked, with "Unblock". Comments with slurs or abusive language are not accepted. Contact: https://themarkethub.app/contact/ (alejandrorodriguezalvarez884@gmail.com), also linked in the app under More > Help.
```

## 6. Las reglas de Apple que tocan a esta app

| Regla | Qué pide | Cómo está |
|---|---|---|
| 4.8 Login Services | Quien ofrece el login de Google ofrece además, como opción equivalente, uno que solo recoja nombre y email y deje esconder el email | **Hecho** (2026-10-13): "Sign in with Apple", con el botón de Apple, encima del de Google. Sin probar hasta TestFlight |
| 5.1.1(v) Borrar la cuenta | Borrarla entera desde la app, en un sitio fácil de encontrar | **Hecho**: More > Account and data > Delete my account |
| Borrar una cuenta de Apple | "Apps that support Sign in with Apple should use the Sign in with Apple REST API to revoke user tokens" | **Código hecho** (2026-10-13), sin guardar nada: al borrar, el iPhone pide confirmar con Apple y el portal revoca en el momento. La clave está en Secret Manager y el portal desplegado (`market-hub-00039-fgv`); va en la **build 4**, subida ese día. Falta probarlo con una cuenta de Apple de verdad |
| 1.2 User-Generated Content | Una app con contenido de usuarios lleva: un filtro de lo inaceptable, una forma de **denunciar** un contenido, poder **bloquear** a un usuario, y un contacto publicado | **Hecho** (2026-10-13) el filtro, "Report" y "Block", en portal, web y app; el dueño revisa lo denunciado en `/account/` de la web, y Apple espera respuesta pronta ("timely responses"): nada le avisa, tiene que mirarlo. El contacto está publicado en `/contact/` desde ese día |
| 3.2.1(viii) Apps financieras | "Apps used for financial trading, investing, or money management should be submitted by the financial institution performing such services" | **Riesgo, no certeza**: la app no opera, no guarda dinero y no asesora, solo enseña cifras; pero un revisor puede leerla como "investing". Las notas para el revisor (apartado 5) lo dicen claro. Es el mismo riesgo que en Play con la cuenta personal |
| 2.1 App completa | Versión final, sin textos de relleno, con cuenta de demostración y el servicio en marcha | Las capturas y la revisión se hacen contra el portal público, con cifras de verdad |
