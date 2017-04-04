FROM alpine:3.5

MAINTAINER "Serban Teodorescu <teodorescu.serban@gmail.com>"

COPY ./html /var/www/

RUN apk add --update-cache \
        nginx && \
    mkdir -p /run/nginx && \
    mv /src/env/etc/nginx/conf.d/default.conf /etc/nginx/conf.d/ && \
    rm -rf /var/cache/apk/*

ENTRYPOINT ["nginx", "-g", "daemon off;"]
