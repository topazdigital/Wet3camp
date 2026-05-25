# Wet3 Camp — Deployment Guide

**Server:** 157.250.205.180 · **Domain:** wet3.camp · **Panel:** DirectAdmin

---

## Prerequisites (one-time server setup)

SSH into your server and install Node.js + PM2:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2
```

---

## Option A — Manual deploy (SCP from your machine)

### 1. Build the web app

```bash
# In the project root on your machine / Replit:
pnpm --filter @workspace/wet3camp build
pnpm --filter @workspace/api-server build   # bundles to api-server/dist/index.js
```

### 2. Upload files

```bash
# Upload the static web app
scp -r artifacts/wet3camp/dist/*  user@157.250.205.180:/home/admin_betcheza/public_html/

# Upload the API server bundle
scp -r artifacts/api-server/dist/ artifacts/api-server/package.json \
    user@157.250.205.180:/home/admin_betcheza/api-server/

# Upload the SQL schema (first deploy only)
scp artifacts/api-server/sql/wet3camp_database.sql \
    user@157.250.205.180:/home/admin_betcheza/
```

### 3. Import the database (first deploy only)

```bash
ssh user@157.250.205.180
mysql -u admin_betcheza -p admin_wet3camp < ~/wet3camp_database.sql
```

### 4. Start the API server with PM2

```bash
ssh user@157.250.205.180
cd /home/admin_betcheza/api-server
npm install --omit=dev

# Set env vars (replace values as needed)
export DB_HOST=localhost
export DB_USER=admin_betcheza
export DB_PASS='<your_db_password>'
export DB_NAME=admin_wet3camp
export JWT_SECRET='<generate a 64-char random string>'
export PORT=8080

pm2 start dist/index.js --name wet3camp-api \
  --env DB_HOST=localhost \
  --env DB_USER=admin_betcheza \
  "--env DB_PASS=<your_db_password>" \
  --env DB_NAME=admin_wet3camp \
  "--env JWT_SECRET=<your_jwt_secret>" \
  --env PORT=8080

pm2 save
pm2 startup   # copy+run the command it prints to auto-start on reboot
```

### 5. Configure Apache in DirectAdmin

In DirectAdmin → Domains → wet3.camp → Custom Apache Config (or edit `.htaccess`):

```apache
# Proxy /api/* to the Node.js server
ProxyRequests Off
ProxyPass /api/ http://127.0.0.1:8080/api/
ProxyPassReverse /api/ http://127.0.0.1:8080/api/

# SPA fallback — send all other requests to index.html
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^api/ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

Enable SSL in DirectAdmin (Let's Encrypt) → done. ✅

---

## Option B — GitHub Actions (automated deploy on push)

### 1. Add repository secrets in GitHub

Go to **Settings → Secrets → Actions** and add:

| Secret | Value |
|---|---|
| `SSH_HOST` | `157.250.205.180` |
| `SSH_USER` | your DirectAdmin username |
| `SSH_PRIVATE_KEY` | contents of your `~/.ssh/id_rsa` |
| `DB_PASS` | your DirectAdmin DB password |
| `JWT_SECRET` | 64-char random string |

Generate a deploy key and copy it to the server:
```bash
ssh-keygen -t ed25519 -C "github-deploy"
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@157.250.205.180
```

### 2. Create `.github/workflows/deploy.yml`

```yaml
name: Deploy to wet3.camp

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with: { version: 9 }

      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }

      - run: pnpm install --frozen-lockfile

      - name: Build web app
        run: pnpm --filter @workspace/wet3camp build

      - name: Build API server
        run: pnpm --filter @workspace/api-server build

      - name: Deploy via rsync + SSH
        uses: easingthemes/ssh-deploy@v5
        with:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          REMOTE_HOST: ${{ secrets.SSH_HOST }}
          REMOTE_USER: ${{ secrets.SSH_USER }}
          SOURCE: "artifacts/wet3camp/dist/"
          TARGET: "/home/${{ secrets.SSH_USER }}/public_html/"

      - name: Deploy API server
        uses: easingthemes/ssh-deploy@v5
        with:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          REMOTE_HOST: ${{ secrets.SSH_HOST }}
          REMOTE_USER: ${{ secrets.SSH_USER }}
          SOURCE: "artifacts/api-server/dist/"
          TARGET: "/home/${{ secrets.SSH_USER }}/api-server/dist/"

      - name: Restart API via PM2
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd ~/api-server
            DB_PASS='${{ secrets.DB_PASS }}' JWT_SECRET='${{ secrets.JWT_SECRET }}' \
            pm2 restart wet3camp-api || \
            pm2 start dist/index.js --name wet3camp-api \
              --env DB_HOST=localhost --env DB_USER=admin_betcheza \
              "--env DB_PASS=${{ secrets.DB_PASS }}" --env DB_NAME=admin_wet3camp \
              "--env JWT_SECRET=${{ secrets.JWT_SECRET }}" --env PORT=8080
            pm2 save
```

Every `git push` to `main` will now automatically build and deploy to your server.

---

## Admin password setup

After first import, set the admin password via the API:

```bash
curl -X POST https://wet3.camp/api/auth/forgot-password \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@wet3.camp"}'
```

This sends a reset link. Or connect directly and run:

```sql
-- Generate a hash first: node -e "require('./dist/lib/crypto').hashPassword('YourNewPass').then(console.log)"
UPDATE users SET password_hash='<generated_hash>' WHERE email='admin@wet3.camp';
```

---

## Update an existing deployment

```bash
# Rebuild
pnpm --filter @workspace/wet3camp build
pnpm --filter @workspace/api-server build

# Re-upload
scp -r artifacts/wet3camp/dist/* user@157.250.205.180:/home/admin_betcheza/public_html/
scp -r artifacts/api-server/dist/ user@157.250.205.180:/home/admin_betcheza/api-server/

# Restart API
ssh user@157.250.205.180 "pm2 restart wet3camp-api"
```
