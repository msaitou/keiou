FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Node is installed from the official tarball (same version as production / mise.toml)
# chromedriver is downloaded into bin/ at app start to match the installed Chrome
ARG NODE_VERSION=26.13.0
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates wget xz-utils libatomic1 tzdata fonts-ipafont-gothic \
    && wget -q -O /tmp/node.tar.xz https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz \
    && tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1 \
    && wget -q -O /tmp/chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && apt-get install -y --no-install-recommends /tmp/chrome.deb \
    && rm -rf /tmp/node.tar.xz /tmp/chrome.deb /var/lib/apt/lists/*
WORKDIR /app
RUN mkdir -p /app/bin
COPY package*.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=docker
# 予約日の判定(toLocaleDateString)が、日本のWindows/ブラウザと同じ形式・時刻になるようにする
ENV TZ=Asia/Tokyo
ENV LANG=ja_JP.UTF-8

EXPOSE 3333
CMD ["npm", "run", "server"]