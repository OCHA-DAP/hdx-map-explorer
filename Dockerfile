FROM unocha/nodejs-builder:8.11.3 AS builder

WORKDIR /src

COPY . .

RUN apk add --update-cache \
        git \
        nodejs-lts && \
    npm install -g \
        bower \
        grunt-cli && \
    npm install && \
    bower --allow-root install && \
    grunt default-no-tests

FROM unocha/nginx:1.14

RUN apk add --update-cache \
        nginx && \
    rm -rv /var/cache/apk/* && \
    rm -rf /var/www && \
    mkdir -p /run/nginx

COPY --from=builder /src/bin /var/www/
COPY --from=builder /src/docker/default.conf /etc/nginx/conf.d/

VOLUME /var/log/nginx

# Volumes
# - Conf: /etc/nginx/conf.d (default.conf)
# - Cache: /var/cache/nginx
# - Logs: /var/log/nginx
# - Data: /var/www
