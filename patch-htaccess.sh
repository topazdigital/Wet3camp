#!/bin/bash
# ============================================================
# Quick .htaccess patch — adds bot UA proxy for OG previews
# Run this ON your server via SSH:
#   bash /home/admin/wet3camp-build/patch-htaccess.sh
# ============================================================

WEB_ROOT="/home/admin/domains/wet3.camp/public_html"

cat > "$WEB_ROOT/.htaccess" << 'HTACCESS'
Options -Indexes

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
</IfModule>

<FilesMatch "\.(html)$">
  Header set Cache-Control "no-cache, no-store, must-revalidate"
  Header set Pragma "no-cache"
  Header set Expires "0"
</FilesMatch>

<FilesMatch "\.(js|css|mjs)$">
  Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>

<FilesMatch "\.(woff2?|ttf|eot|otf)$">
  Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>

<FilesMatch "\.(jpg|jpeg|png|gif|webp|svg|ico)$">
  Header set Cache-Control "public, max-age=2592000"
</FilesMatch>

<FilesMatch "\.(json|xml|webmanifest)$">
  Header set Cache-Control "public, max-age=3600"
</FilesMatch>

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Step 1: Proxy social-media bots to Node.js FIRST (before static file check)
  # Must come first so / (a directory) is also proxied instead of serving index.html.
  # Node.js OG middleware handles bot requests and passes through for non-HTML paths.
  RewriteCond %{HTTP_USER_AGENT} "(facebookexternalhit|facebot|WhatsApp|TelegramBot|LinkedInBot|Twitterbot|Slackbot|Discordbot|Applebot|Googlebot|Bingbot|YandexBot|DuckDuckBot|ia_archiver|SemrushBot|AhrefsBot)" [NC]
  RewriteRule ^ http://localhost:8080%{REQUEST_URI} [P,L,QSA]

  # Step 2: Serve real static files/dirs directly for regular browser users
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Step 3: Proxy /api/* and known server routes to Node.js
  RewriteCond %{REQUEST_URI} ^/api [NC,OR]
  RewriteCond %{REQUEST_URI} ^/sitemap [NC,OR]
  RewriteCond %{REQUEST_URI} ^/google [NC]
  RewriteRule ^ http://localhost:8080%{REQUEST_URI} [P,L,QSA]

  # Step 4: SPA fallback for regular browser users on non-file routes
  RewriteRule ^ index.html [L]
</IfModule>
HTACCESS

echo "✅ .htaccess updated at $WEB_ROOT"
echo "   Bot UA check is now FIRST — homepage and all profile pages will get OG previews."
echo ""
echo "Test:"
echo "  curl -A 'WhatsApp/2.23.20.0' https://wet3.camp/ | grep og:image"
echo "  curl -A 'WhatsApp/2.23.20.0' 'https://wet3.camp/@betty' | grep -E 'og:image|og:title'"
