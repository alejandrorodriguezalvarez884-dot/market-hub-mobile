#!/usr/bin/env bash
# Makes a demo account, with a small portfolio, on a portal running on this machine (`make api`),
# to sign in to the app with. It only works where accounts are made without a captcha
# (MARKETHUB_OPEN_REGISTRATION=1): never on the public portal.
#
#   ./scripts/seed-local.sh [http://localhost:8000]
set -euo pipefail

API="${1:-http://localhost:8000}"
# A local account, good for nothing but a developer's machine.
EMAIL="demo@markethub.test"
PASSWORD="market hub local demo"

case "$API" in
  http://localhost:*|http://127.0.0.1:*|http://192.168.*|http://10.*) ;;
  *) echo "seed-local: $API is not a portal on this machine or this network" >&2; exit 1 ;;
esac

jar=$(mktemp)
trap 'rm -f "$jar"' EXIT
post() { curl -sS -o /dev/null -w '%{http_code}' -c "$jar" -b "$jar" -H "origin: $API" -H 'content-type: application/json' -X "$1" "$API$2" -d "$3"; }

made=$(post POST /api/auth/register "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"Demo Reader\"}")
if [ "$made" != 200 ]; then
  # Already there from an earlier run: sign in to it.
  entered=$(post POST /api/auth/password "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
  [ "$entered" = 200 ] || { echo "seed-local: could not make or enter the demo account ($made, $entered). Is the portal running with MARKETHUB_OPEN_REGISTRATION=1?" >&2; exit 1; }
fi
saved=$(post PUT /api/portfolio '{"positions":[{"ticker":"AAPL","shares":12,"avg_cost":171.5},{"ticker":"MSFT","shares":5,"avg_cost":402},{"ticker":"KO","shares":40,"avg_cost":58.2},{"ticker":"NVDA","shares":20,"avg_cost":null}],"watchlist":["GOOGL","JPM","SPY"]}')
[ "$saved" = 200 ] || { echo "seed-local: the portfolio was not saved ($saved)" >&2; exit 1; }
echo "seed-local: demo account ready on $API. Its email and password are at the top of scripts/seed-local.sh"
