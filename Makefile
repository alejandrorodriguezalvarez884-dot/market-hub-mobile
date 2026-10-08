# Everything is started from here, by hand. Nothing runs on a timer.
#
#   make                 list the targets
#   make start           the app for Expo Go, talking to the public portal (scan the QR with the phone)
#   make api             the portal's API on this machine, for the app to talk to instead
#   make start LOCAL=1   the app for Expo Go, talking to that local portal
#   make start TUNNEL=1  the same app, reached through a tunnel instead of the local network

SHELL := /bin/bash
.DEFAULT_GOAL := help
.PHONY: help install start web api demo icons check

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

icons: ## Draw the app's icon, its Android layers and the launch screen's mark again (scripts/draw-icons.mjs)
	node scripts/draw-icons.mjs

check: ## Type check, lint and Expo's own checks of the project
	npx tsc --noEmit
	npx expo lint
	npx expo-doctor
