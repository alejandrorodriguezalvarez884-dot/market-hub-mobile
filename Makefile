# Everything is started from here, by hand. Nothing runs on a timer.
#
#   make                 list the targets
#   make start           the app for Expo Go, talking to the public portal (scan the QR with the phone)
#   make api             the portal's API on this machine, for the app to talk to instead
#   make start LOCAL=1   the app for Expo Go, talking to that local portal
#   make start TUNNEL=1  the same app, reached through a tunnel instead of the local network
#   make apk             the app as a file to install on an Android phone, built by EAS
#   make aab             the bundle Google Play takes, built by EAS (uploading it is done by hand)
#   make ipa             the app for iPhone, built by EAS, for TestFlight and the App Store
#   make testflight      send the latest iPhone build to App Store Connect, where TestFlight takes it

SHELL := /bin/bash
.DEFAULT_GOAL := help
.PHONY: help install start web api demo icons art apk aab ipa testflight sim check

# The portal's repo, a sibling folder in the market-hub workspace.
PORTAL ?= ../market-hub-landing
# This machine's address on the local network: a phone cannot reach "localhost".
LAN_IP ?= $(shell ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
LOCAL_API := http://$(LAN_IP):8000

help: ## List the targets
	@grep -E '^[a-z]+:.*## ' $(MAKEFILE_LIST) | awk -F ':.*## ' '{printf "  make %-9s %s\n", $$1, $$2}'

install: ## Install the app's dependencies
	npm ci

start: ## Run the app for Expo Go (scan the QR with the phone). LOCAL=1: against `make api` on this machine. TUNNEL=1: when the phone cannot reach this machine over the wifi
	$(if $(LOCAL),EXPO_PUBLIC_API_URL=$(LOCAL_API)) npx expo start $(if $(TUNNEL),--tunnel)

web: ## Look at the app in a browser at http://localhost:8090, against `make api` (development only)
	EXPO_PUBLIC_API_URL=http://localhost:8000 npx expo start --web --port 8090

api: ## Run the portal's API on this machine, open to the local network, port 8000. SAMPLE=1: sample figures, no network
	cd $(PORTAL) && MARKETHUB_OPEN_REGISTRATION=1 MARKETHUB_INSECURE_COOKIES=1 MARKETHUB_ALLOWED_ORIGINS=http://localhost:8090 \
		$(if $(SAMPLE),MARKETHUB_SAMPLE_MARKETS=1 MARKETHUB_SAMPLE_NEWS=1) \
		uv run uvicorn markethub.api:create_app --factory --host 0.0.0.0 --port 8000

demo: ## Make the demo account (see scripts/seed-local.sh) on the portal `make api` is running
	./scripts/seed-local.sh http://localhost:8000

icons: ## Draw the app's icon, its Android layers, the launch screen's mark and Google Play's pictures again (scripts/draw-icons.mjs)
	node scripts/draw-icons.mjs

art: ## Draw the App Store's header and its search picture again, with Chrome (scripts/draw-store-art.sh)
	./scripts/draw-store-art.sh

# EAS builds in Expo's cloud, with the Expo account of whoever is logged in (`npx eas-cli@latest
# login`, and `npx eas-cli@latest init` once). Each build is asked for here, by hand.
EAS := npx eas-cli@latest

apk: ## Build an APK with EAS, to install on an Android phone without Expo Go
	$(EAS) build --platform android --profile preview

aab: ## Build the bundle Google Play takes, with EAS. Publishing it is the owner's decision, version by version
	$(EAS) build --platform android --profile production

# Both ask for the Apple account of whoever runs them, in the terminal: EAS makes the signing
# certificate and the profile there, and never from this repo.
ipa: ## Build the app for iPhone with EAS, signed for TestFlight and the App Store
	$(EAS) build --platform ios --profile production

testflight: ## Send the latest iPhone build to App Store Connect, for TestFlight. Sending a version to review is the owner's decision
	$(EAS) submit --platform ios --latest

# No Apple account is asked for: a simulator's build is not signed. It talks to `make api` on this
# machine (the simulator shares its localhost), so the demo account works in it.
sim: ## Build the app for the iOS simulator with EAS: the real app, with its icon and its native modules, which Expo Go does not have
	$(EAS) build --platform ios --profile simulator

check: ## Type check, lint and Expo's own checks of the project
	npx tsc --noEmit
	npx expo lint
	npx expo-doctor
