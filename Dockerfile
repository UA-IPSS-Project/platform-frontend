# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

ARG VITE_KEYCLOAK_URL=/kc
ARG VITE_KEYCLOAK_REALM=florinhas
ARG VITE_KEYCLOAK_CLIENT_ID=florinhas-frontend
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL
ENV VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM
ENV VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=build /app/build ./
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf

# Criar diretório para certificados SSL e gerar self-signed como fallback
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
      -keyout /etc/nginx/ssl/key.pem \
      -out /etc/nginx/ssl/cert.pem \
      -subj "/CN=localhost" \
      -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
