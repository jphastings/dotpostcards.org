#!/bin/sh
# Regenerates src/lib/cards.json from the card files. Re-run whenever static/cards changes.
set -eu
cd "$(dirname "$0")/.."
for f in static/cards/*.postcard.webp; do
	name=$(basename "$f" .postcard.webp)
	postcards info --json "$f" | jq --arg n "$name" '{($n): .}'
done | jq -s 'add' > src/lib/cards.json
