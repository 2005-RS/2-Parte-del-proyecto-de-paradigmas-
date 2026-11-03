FROM node:22-bookworm-slim
WORKDIR /app
ARG INSECURE_TLS=false
ENV DATABASE_URL=postgresql://auth:auth@localhost:5432/auth
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN set -eux; \
    if [ "$INSECURE_TLS" = "true" ]; then npm config set strict-ssl false; export NODE_TLS_REJECT_UNAUTHORIZED=0; fi; \
    npm install --no-audit --no-fund; \
    npx prisma generate; \
    npm run build
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh
ENV NODE_ENV=production
EXPOSE 3001
CMD ["./docker-entrypoint.sh"]
