FROM alpine:3.5

MAINTAINER "Serban Teodorescu <teodorescu.serban@gmail.com>"

ENV DST_DIR=/srv/www \
    NPM_CONFIG_PROGRESS=false \
    NPM_CONFIG_SPIN=false

WORKDIR /src

#COPY . /src/

RUN mkdir -p /srv/www && \
    apk add --update-cache \
        git \
        nodejs-lts \
        nginx && \
    mkdir -p /run/nginx && \
    mv /src/env/etc/nginx/conf.d/default.conf /etc/nginx/conf.d/ && \
    npm install -g \
        bower \
        grunt-cli && \
    cd /src && \
    npm install && \
    bower --allow-root install && \
    grunt default-no-tests && \
    mv bin/* /srv/www/ && \
    cd / && \
    rm -rf ${SRC_DIR} && \
    npm uninstall -g \
        bower \
        grunt-cli && \
    npm cache clean && \
    apk del \
        git \
        nodejs-lts && \
    rm -rf /src && \
    rm -rf /tmp/* && \
    rm -rf /root/.cache && \
    rm -rf /var/cache/apk/*
