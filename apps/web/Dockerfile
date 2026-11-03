FROM node:22-bookworm-slim AS build
WORKDIR /app
ARG INSECURE_TLS=false
COPY package.json package-lock.json ./
RUN set -eux; \
    if [ "$INSECURE_TLS" = "true" ]; then npm config set strict-ssl false; export NODE_TLS_REJECT_UNAUTHORIZED=0; fi; \
    npm install --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
