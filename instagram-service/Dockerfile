FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    wget curl gnupg \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 libgbm1 \
    libasound2 libpango-1.0-0 libcairo2 \
    libglib2.0-0 libdbus-1-3 libx11-6 libx11-xcb1 \
    libxcb1 libxext6 libxfixes3 libxi6 libxrender1 \
    libxtst6 fonts-liberation fonts-noto-color-emoji \
    xvfb ca-certificates \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN playwright install chromium

COPY main.py .

EXPOSE 8080

CMD Xvfb :99 -screen 0 1280x900x24 -nolisten tcp & sleep 1 && DISPLAY=:99 python main.py
