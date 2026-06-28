#!/bin/bash
# =============================================================
# auto-push.sh — Push changed files to GitHub via Contents API
# Uses curl + GitHub REST API (no git push — works in Replit sandbox).
# Called automatically by post-merge.sh after every agent merge.
# Can also be run manually from the Replit shell.
# =============================================================

REPO="topazdigital/Wet3camp"
BRANCH="${1:-main}"

# Accept token under either name
if [ -z "$GITHUB_TOKEN" ] && [ -n "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
  GITHUB_TOKEN="$GITHUB_PERSONAL_ACCESS_TOKEN"
fi

if [ -z "$GITHUB_TOKEN" ]; then
  echo "[auto-push] ⚠️  No GitHub token found (set GITHUB_TOKEN in Replit Secrets)."
  exit 0
fi

echo "[auto-push] Syncing changed files to GitHub (branch: ${BRANCH})..."

# Get list of files changed vs origin/main
CHANGED=$(git --no-optional-locks diff --name-only origin/main HEAD 2>/dev/null)
if [ -z "$CHANGED" ]; then
  echo "[auto-push] Nothing to push — working tree matches origin/main."
  exit 0
fi

ERRORS=0
PUSHED=0

for FILE in $CHANGED; do
  [ -f "$FILE" ] || continue  # skip deleted files for now

  CONTENT=$(base64 -w 0 "$FILE" 2>/dev/null)
  if [ -z "$CONTENT" ]; then
    echo "[auto-push] Skipping binary/empty: $FILE"
    continue
  fi

  # Get current SHA on GitHub (empty if new file)
  SHA=$(curl -s \
    -H "Authorization: token $GITHUB_TOKEN" \
    "https://api.github.com/repos/${REPO}/contents/${FILE}?ref=${BRANCH}" \
    | node -e "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{ try{const r=JSON.parse(d); console.log(r.sha||'')}catch(e){console.log('')} })" 2>/dev/null)

  # Build JSON payload
  MSG="chore: sync ${FILE} via Replit auto-push"
  if [ -n "$SHA" ]; then
    PAYLOAD="{\"message\":\"$MSG\",\"content\":\"$CONTENT\",\"sha\":\"$SHA\",\"branch\":\"$BRANCH\"}"
  else
    PAYLOAD="{\"message\":\"$MSG\",\"content\":\"$CONTENT\",\"branch\":\"$BRANCH\"}"
  fi

  RESULT=$(curl -s -X PUT \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Content-Type: application/json" \
    "https://api.github.com/repos/${REPO}/contents/${FILE}" \
    -d "$PAYLOAD" \
    | node -e "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{ try{const r=JSON.parse(d); console.log(r.commit?'ok:'+r.commit.sha.slice(0,8):'err:'+JSON.stringify(r.message))}catch(e){console.log('err:parse')} })" 2>/dev/null)

  if [[ "$RESULT" == ok:* ]]; then
    echo "[auto-push] ✅ $FILE (${RESULT#ok:})"
    PUSHED=$((PUSHED+1))
  else
    echo "[auto-push] ❌ $FILE — ${RESULT#err:}"
    ERRORS=$((ERRORS+1))
  fi
done

echo "[auto-push] Done — ${PUSHED} file(s) pushed, ${ERRORS} error(s)."
if [ "$PUSHED" -gt 0 ]; then
  echo "[auto-push] GitHub Actions will now deploy to wet3.camp automatically."
fi
[ "$ERRORS" -eq 0 ]
