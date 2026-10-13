#!/usr/bin/env bash
# Draws the two pictures the App Store's product page takes besides the screenshots, its header
# and what stands for the app in a search, from the pages in store/app-store/art/. Chrome draws
# them, with the app's own type (node_modules) and its screenshots (store/app-store/screenshots/).
#
#   ./scripts/draw-store-art.sh        (or `make art`)
set -euo pipefail
cd "$(dirname "$0")/.."

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[ -x "$CHROME" ] || { echo "draw-store-art: Chrome is not at $CHROME (set CHROME)" >&2; exit 1; }
ART=store/app-store/art

draw() { # page, width, height
  local out="$ART/$1-$2x$3.png"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size="$2,$3" \
    --allow-file-access-from-files --virtual-time-budget=4000 --screenshot="$PWD/$out" "file://$PWD/$ART/$1.html" >/dev/null 2>&1
  # The store takes no clear pixel: Chrome writes none, but the channel is there.
  sips -s format jpeg -s formatOptions 100 "$out" --out "$out.jpg" >/dev/null && sips -s format png "$out.jpg" --out "$out" >/dev/null && rm "$out.jpg"
  echo "$out  $(sips -g pixelWidth -g pixelHeight "$out" | tail -2 | awk '{print $2}' | paste -sd x -)"
}

draw header 3840 1646
draw search 3840 2560
