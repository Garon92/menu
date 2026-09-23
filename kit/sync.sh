#!/usr/bin/env bash
# Vendor the g92 kit into apps:  bash menu/kit/sync.sh <app> [<app>...]   |   bash menu/kit/sync.sh --all
# Copies menu/kit/ → ~/AI/garon92-pages/<app>/src/kit/ (rsync --delete) and writes src/kit/VENDORED.md.
# Options:  --dest <dir>   sync into an arbitrary directory instead (testing)
#           --react        force-include kit/react/ (TSX typings); auto when the app's package.json has "react"
# Env:      G92_ROOT       parent dir of the app repos (default: the dir containing menu/)
set -euo pipefail

KIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MENU_DIR="$(dirname "$KIT_DIR")"
ROOT="${G92_ROOT:-$(dirname "$MENU_DIR")}"
ALL_APPS=(matematika cestina anglictina tanky ryby komari spojovacka dots)

targets=()
dest_override=""
force_react=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --all) targets+=("${ALL_APPS[@]}") ;;
    --dest) dest_override="$2"; shift ;;
    --react) force_react=1 ;;
    -h|--help) sed -n '2,7p' "$0"; exit 0 ;;
    -*) echo "unknown option $1" >&2; exit 2 ;;
    *) targets+=("$1") ;;
  esac
  shift
done

if [[ -n "$dest_override" && ${#targets[@]} -eq 0 ]]; then targets=("custom"); fi
if [[ ${#targets[@]} -eq 0 ]]; then
  echo "usage: bash menu/kit/sync.sh <app> [<app>...] | --all | --dest <dir>" >&2
  exit 2
fi

hash="$(git -C "$MENU_DIR" rev-parse --short HEAD 2>/dev/null || echo unknown)"
dirty=""
if [[ -n "$(git -C "$MENU_DIR" status --porcelain -- kit 2>/dev/null)" ]]; then dirty=" (+ uncommitted changes)"; fi
version="$(sed -nE "s/.*KIT_VERSION = '([^']+)'.*/\1/p" "$KIT_DIR/version.ts")"

for app in "${targets[@]}"; do
  if [[ -n "$dest_override" ]]; then
    dest="$dest_override"
    pkg=""
  else
    [[ -d "$ROOT/$app" ]] || { echo "✗ $app: $ROOT/$app does not exist" >&2; exit 1; }
    dest="$ROOT/$app/src/kit"
    pkg="$ROOT/$app/package.json"
  fi
  react=$force_react
  if [[ -n "$pkg" && -f "$pkg" ]] && grep -qE '"react"\s*:' "$pkg"; then react=1; fi

  excludes=(--exclude 'sync.sh' --exclude 'READY' --exclude 'README.md' --exclude 'CHANGELOG.md'
            --exclude 'scripts/' --exclude '*.test.ts' --exclude 'VENDORED.md' --exclude '.DS_Store')
  if [[ $react -eq 0 ]]; then excludes+=(--exclude 'react/'); fi

  mkdir -p "$dest"
  rsync -a --delete "${excludes[@]}" "$KIT_DIR/" "$dest/"
  if [[ $react -eq 0 && -d "$dest/react" ]]; then rm -rf "$dest/react"; fi
  cat > "$dest/VENDORED.md" <<MD
# g92 kit (vendored copy)

synced from menu/kit @ ${hash}${dirty} — kit v${version} — $(date '+%Y-%m-%d %H:%M')

**Do not edit here.** Change \`menu/kit/\` in the menu repo and re-run
\`bash ~/AI/garon92-pages/menu/kit/sync.sh <app>\`. Docs: menu/kit/README.md, style guide: /menu/kit.html
MD
  echo "✓ kit v${version} @ ${hash}${dirty} → ${dest}$([[ $react -eq 1 ]] && echo ' (+react typings)')"
done
