FROM alpine:3.5

MAINTAINER "Serban Teodorescu <teodorescu.serban@gmail.com>"

ARG TAG

ENV NPM_CONFIG_PROGRESS=false \
    NPM_CONFIG_SPIN=false

#COPY . /src/

RUN mkdir -p /src /srv/www && \
    apk add --update-cache \
        git \
        nodejs-lts \
        nginx && \
    git clone --branch $TAG /src && \
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
    npm uninstall -g \
        bower \
        grunt-cli && \
    npm cache clean && \
    apk del \
        git \
        nodejs-lts && \
    cd / && \
    rm -rf /src && \
    rm -rf /tmp/* && \
    rm -rf /root/.cache && \
    rm -rf /var/cache/apk/*
