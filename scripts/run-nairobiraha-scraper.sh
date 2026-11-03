#!/usr/bin/env bash
set -euo pipefail

API_ENV="${API_ENV:-/home/admin/api-server/env}"
API_DIR="${API_DIR:-/home/admin/wet3camp-build/artifacts/api-server}"
UPLOADS_DIR="${UPLOADS_DIR:-$API_DIR/uploads}"

printf '=== NairobiRaha scraper started at %s ===\n' "$(date -Is)"

if [[ ! -r "$API_ENV" ]]; then
  echo "ERROR: scraper environment file is not readable: $API_ENV" >&2
  exit 1
fi

# Read only the database URL assignment. Never source the server env file:
# it may contain historical shell commands that must not run from cron.
DATABASE_URL=""
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line#"${line%%[![:space:]]*}"}"
  case "$line" in
    ""|\#*) continue ;;
    export\ *) line="${line#export }" ;;
  esac

  if [[ "$line" =~ ^DATABASE_URL=(.*)$ ]]; then
    value="${BASH_REMATCH[1]}"
    value="${value%$'\r'}"
    if [[ "$value" == \"* && "$value" == *\" ]]; then
      value="${value:1:${#value}-2}"
    elif [[ "$value" == \'* && "$value" == *\' ]]; then
      value="${value:1:${#value}-2}"
    fi
    DATABASE_URL="$value"
  fi
done < "$API_ENV"

if [[ -z "$DATABASE_URL" ]]; then
  echo "ERROR: DATABASE_URL assignment not found in $API_ENV" >&2
  exit 1
fi

if [[ ! -f "$API_DIR/scrape-escorts.mjs" ]]; then
  echo "ERROR: scraper not found in $API_DIR" >&2
  exit 1
fi

export DATABASE_URL UPLOADS_DIR
cd "$API_DIR"
exec /usr/bin/env node scrape-escorts.mjs --fast --source=nairobiraha "$@"
