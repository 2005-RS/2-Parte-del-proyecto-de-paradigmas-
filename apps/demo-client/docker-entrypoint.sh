#!/bin/sh
set -e
cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = {
  authUrl: "${AUTH_URL}",
  activitiesUrl: "${ACTIVITIES_URL}",
  webUrl: "${WEB_URL}"
};
EOF
exec nginx -g 'daemon off;'
