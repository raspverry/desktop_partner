FROM python:3.11-slim

WORKDIR /app

# 시스템 의존성 설치 (Rhubarb Lipsync 포함)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Rhubarb Lipsync 설치
RUN wget https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v1.13.0/rhubarb-lip-sync-1.13.0-linux.zip \
    && unzip rhubarb-lip-sync-1.13.0-linux.zip \
    && mv rhubarb /usr/local/bin/ \
    && rm rhubarb-lip-sync-1.13.0-linux.zip

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY . .

# 포트 노출
EXPOSE 8003

# 애플리케이션 실행
CMD ["python", "main.py"] 