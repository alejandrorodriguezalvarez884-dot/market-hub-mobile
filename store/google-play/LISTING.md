# Google Play: la ficha y los formularios

Lo que Play Console pide para publicar Market Hub, ya escrito para copiar y pegar. Los textos de
la ficha van en inglés (el idioma de la app) y en español. Las respuestas a los formularios dicen
lo que la app hace hoy: **si la app cambia (un SDK nuevo, un dato nuevo), se revisan antes de
subir esa versión.**

Paquete: `app.themarkethub.hub` (para siempre). Cuenta de Play: personal.

## 1. Pasos, en orden

| # | Qué | Quién | Estado |
|---|---|---|---|
| 1 | Abrir la cuenta de Google Play Console (25 USD, personal) y verificar identidad | Usuario | Pendiente |
| 2 | `npx eas-cli@latest login` y `npx eas-cli@latest init` en este repo (crea el proyecto en Expo y escribe su id en `app.json`; ese cambio se commitea) | Usuario | Pendiente |
| 3 | `make apk`: una APK para instalar en un Android y ver la app fuera de Expo Go. De ahí salen las capturas | Usuario lanza, agente revisa | Pendiente |
| 4 | Crear la app en Play Console ("Create app": nombre, inglés (EE. UU.) por defecto, App, Free) | Usuario | Pendiente |
| 5 | Rellenar "App content" con el apartado 4 de este archivo, y la ficha con los apartados 2 y 3 | Usuario | Pendiente |
| 6 | `make aab` y subir el `.aab` a **Testing > Closed testing** | Usuario | Pendiente |
| 7 | **12 testers apuntados 14 días seguidos** a la prueba cerrada (lo exige Google a las cuentas personales creadas después del 13-11-2023; quien se sale y vuelve empieza de cero) | Usuario | Pendiente |
| 8 | "Apply for production" en el Dashboard: preguntas sobre la prueba, la app y si está lista (Google tarda hasta unos 7 días) | Usuario, con el agente para las respuestas | Pendiente |
| 9 | Antes de producción: vaciar `MARKETHUB_APP_REDIRECTS` en el portal y desplegar | Agente, con permiso | Pendiente |

La primera subida se hace a mano en Play Console. `eas submit` (perfil `production` de
`eas.json`: pista interna, como borrador) queda para después, y pide una clave de cuenta de
servicio de Google que **no va al repo**.

## 2. La ficha (Main store listing)

### English (United States), el idioma por defecto

**App name** (30 como mucho)

```
Market Hub: Portfolio Tracker
```

**Short description** (80 como mucho)

```
Your stocks on one private page: value, gains, and how they stand. No advice.
```

**Full description** (4000 como mucho)

```
Market Hub is a private page for your own stocks. Add what you hold, or just the stocks you follow, and see them described: what they are worth, how they moved, what the portfolio is made of and how it stands against the indices.

It describes. It never tells you to buy, sell or hold, it makes no predictions and it sets no price targets. It does not connect to any broker and it cannot trade.

OVERVIEW
• The value of your portfolio, today's move and your gain or loss against your own average cost
• Your portfolio read back in plain sentences
• Today's holdings next to the S&P 500, the Nasdaq 100, the Dow and the Russell 2000
• News on the companies you hold or follow

ANALYSIS
• What the portfolio is made of: by sector, country, volatility and company size
• How it moves and how concentrated it is
• Every position, sorted by the figure you choose

WATCHLIST
• Each stock on one line: price, trend, and where it stands against its own averages and against the index
• A chart per stock, as candles or as a line, with its 20, 50 and 200-day averages and volume
• A reading of each stock, aspect by aspect: trend, momentum, 52-week range, volume, what analysts estimate and its valuation
• All your stocks on one map

COMMUNITY
• Share your portfolio's mix if you choose to: tickers and weights only, under a name you pick. Never your name, your amounts or what you paid
• A monthly competition among members, with its standings and its discussion

YOUR ACCOUNT
• Sign in with Google, or with an email and a password
• The same account as themarkethub.app: what you add here is there too
• See everything that is kept about you, and delete your account and all of it from the app at any time
• No ads and no tracking

Market Hub covers companies listed in the United States. Market data comes from third-party providers and may be delayed or incomplete. Nothing in the app is investment advice.
```

### Español (España), traducción

**Nombre de la app**

```
Market Hub: tu cartera
```

**Descripción breve**

```
Tus acciones en una página privada: valor, ganancias y cómo van. Sin consejos.
```

**Descripción completa**

```
Market Hub es una página privada para tus acciones. Añade lo que tienes, o solo las acciones que sigues, y las verás descritas: cuánto valen, cómo se han movido, de qué está hecha la cartera y cómo va frente a los índices.

Describe. Nunca te dice que compres, vendas o mantengas, no hace predicciones ni da precios objetivo. No se conecta a ningún bróker y no puede operar.

RESUMEN
• El valor de tu cartera, el movimiento de hoy y tu ganancia o pérdida frente a tu propio coste medio
• Tu cartera contada en frases sencillas
• Lo que tienes hoy junto al S&P 500, el Nasdaq 100, el Dow y el Russell 2000
• Noticias de las empresas que tienes o sigues

ANÁLISIS
• De qué está hecha la cartera: por sector, país, volatilidad y tamaño de empresa
• Cómo se mueve y cuánto se concentra
• Todas las posiciones, ordenadas por la cifra que elijas

SEGUIMIENTO
• Cada acción en una línea: precio, tendencia y dónde está frente a sus medias y frente al índice
• Un gráfico por acción, en velas o en línea, con sus medias de 20, 50 y 200 sesiones y el volumen
• Una lectura de cada acción, aspecto por aspecto: tendencia, impulso, rango de 52 semanas, volumen, lo que estiman los analistas y su valoración
• Todas tus acciones en un mapa

COMUNIDAD
• Comparte la composición de tu cartera si quieres: solo tickers y pesos, con el nombre que elijas. Nunca tu nombre, tus importes ni lo que pagaste
• Una competición mensual entre miembros, con su clasificación y su debate

TU CUENTA
• Entra con Google, o con un email y una contraseña
• La misma cuenta que en themarkethub.app: lo que añades aquí está allí
• Mira todo lo que se guarda de ti, y borra tu cuenta y todo ello desde la app cuando quieras
• Sin anuncios y sin rastreo

Market Hub cubre empresas cotizadas en Estados Unidos. La app está en inglés. Los datos de mercado vienen de proveedores externos y pueden llegar con retraso o incompletos. Nada en la app es asesoramiento de inversión.
```

## 3. Gráficos y datos de la ficha

| Qué | Archivo o valor | Estado |
|---|---|---|
| Icono, 512 × 512, PNG de 32 bits | `icon-512.png` | Hecho (`make icons`) |
| Feature graphic, 1024 × 500, PNG sin alfa | `feature-graphic-1024x500.png` | Hecho (`make icons`) |
| Capturas de teléfono: entre 2 y 8, lado entre 320 y 3840 px, proporción hasta 2:1 | Del APK instalado: Overview, Analysis, Watchlist, la ficha de una acción, Community | **Pendiente** (paso 3) |
| Categoría | Finance | |
| Email de contacto (se ve en la ficha) | El que elija el usuario | **Pendiente** |
| Web | `https://themarkethub.app` | |
| Política de privacidad | `https://themarkethub.app/privacy/` | Dice lo de la app desde el 2026-10-08 (desplegado) |
| Precio y países | Gratis; los países los elige el usuario | **Pendiente** |

## 4. App content (los formularios)

**Privacy policy**: `https://themarkethub.app/privacy/`

**App access**: "All or some functionality is restricted". Hay que dar a los revisores una cuenta
de email y contraseña creada en themarkethub.app, con una cartera pequeña ya puesta. Sus datos
se escriben en Play Console, **no en este repo**.

**Ads**: No, la app no tiene anuncios.

**Content rating** (cuestionario IARC): categoría "Utility, Productivity, Communication, or
Other". Violencia, sexo, lenguaje, drogas, apuestas: no. "¿Los usuarios pueden interactuar o
intercambiar contenido?": **sí** (los comentarios de la competición, entre miembros con sesión).
"¿Comparte la ubicación?": no. "¿Compras digitales?": no.

**Target audience**: 18 años o más. No está pensada para niños.

**News app**: No (enseña titulares sobre las acciones del usuario, pero no es una app de noticias).

**Data safety**

- ¿Recoge o comparte datos de usuario?: **sí, recoge**. ¿Cifrados en tránsito?: **sí**. ¿Se puede
  pedir el borrado?: **sí**, desde la app (More > Account and data > Delete my account) y en
  `https://themarkethub.app/account/`.
- ¿Los comparte con terceros?: **no**. Lo que sale del servidor va a proveedores que trabajan
  para el portal (los tickers al de precios; tickers, pesos y rentabilidades al modelo que
  escribe las frases; nunca quién es el usuario), y eso para Google no es "compartir". Lo que el
  usuario decide enseñar en Community lo comparte él.

| Tipo de dato (según Google) | Qué es aquí | Recogido | Obligatorio | Para qué |
|---|---|---|---|---|
| Personal info > Name | El nombre de la cuenta | Sí | Sí | App functionality, Account management |
| Personal info > Email address | El email de la cuenta | Sí | Sí | App functionality, Account management |
| Personal info > User IDs | El id de la cuenta (el de Google, o uno propio) | Sí | Sí | App functionality, Account management |
| Financial info > Other financial info | Tickers, número de acciones y coste medio que el usuario escribe | Sí | Opcional | App functionality |
| App activity > Other user-generated content | Comentarios, apuestas de la competición y el nombre con que se comparte la cartera | Sí | Opcional | App functionality |

  Nada más: ni ubicación, ni contactos, ni fotos, ni archivos, ni identificadores del
  dispositivo, ni diagnósticos (la app no lleva ningún SDK de analítica, de fallos ni de
  anuncios). **A decidir por el usuario**: al crear una cuenta con email, el captcha de
  Cloudflare ve la IP y datos del navegador para esa comprobación y el portal no guarda nada de
  ello; Google no tiene una casilla clara para eso y aquí no se ha marcado.

**Advertising ID**: No, la app no lo usa (el manifiesto no pide el permiso `AD_ID`).

**Government apps**: No. **Health apps**: ninguna función de salud.

**Financial features**: la app no presta, no guarda dinero, no opera y no asesora: de la lista
que enseña el formulario, **ninguna** ("My app doesn't provide any financial features"). Leer
la lista en pantalla antes de marcar, porque Google la cambia.

**Permisos del APK**: `INTERNET`, `VIBRATE` y `SYSTEM_ALERT_WINDOW` (los dos últimos los trae
la plantilla de React Native; la app no los usa). Los de almacenamiento están quitados en
`app.json` (`blockedPermissions`).

## 5. Lo que preguntará "Apply for production"

Google pregunta, tras los 14 días: cómo se reclutó a los testers, si usaron todas las funciones,
qué dijeron y cómo se recogió; a quién va dirigida la app y qué aporta; cuántas instalaciones se
esperan el primer año; qué se cambió por la prueba y por qué se cree que está lista. Conviene
apuntar durante la prueba lo que digan los testers y lo que se arregle: las respuestas salen de
ahí, no se inventan.
