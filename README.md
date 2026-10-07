# Market Hub (mobile)

The phone app of [Market Hub](https://themarkethub.app), for iPhone and Android: My Hub, the
portal's private area. Built with Expo (React Native). It has no server of its own: it talks to
the portal's API ([market-hub-landing](https://github.com/alejandrorodriguezalvarez884-dot/market-hub-landing)).

It describes a portfolio; it never says what to do with a stock.

## Try it on a phone

1. Install **Expo Go** on the phone (App Store or Google Play). Phone and computer on the same Wi-Fi.
2. `make install`
3. `make start` and scan the QR code (iPhone: with the camera; Android: from Expo Go).

To run it against the portal on your own machine instead of the public one: `make api` in one
terminal, `make demo` once (it makes a demo account), and `make start LOCAL=1` in another.

`make` lists every target. State and next steps: [docs/HANDOFF.md](docs/HANDOFF.md).
