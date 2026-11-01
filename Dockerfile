FROM node:19.4.0-bullseye-slim

# bullseyeはサポート終了のため、パッケージの取得先をアーカイブに切り替える
# chromedriverはアプリが起動時に、インストール済みChromeに合わせてbin/へ自動ダウンロードする
RUN printf 'deb http://archive.debian.org/debian bullseye main\ndeb http://archive.debian.org/debian-security bullseye-security main\n' > /etc/apt/sources.list \
    && apt-get -o Acquire::Check-Valid-Until=false update \
    && apt-get install -y --no-install-recommends ca-certificates wget fonts-ipafont-gothic \
    && wget -q -O /tmp/chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && apt-get install -y --no-install-recommends /tmp/chrome.deb \
    && rm -rf /tmp/chrome.deb /var/lib/apt/lists/*

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