#!/usr/bin/env bash
# =============================================================================
# setup-bucket.sh — однократная настройка bucket в Yandex Object Storage.
#
# Запускается ОДИН РАЗ перед первым деплоем. Что делает:
#   1. Создаёт bucket с указанным именем (или сообщает, что bucket уже есть).
#   2. Открывает анонимный read-доступ к объектам.
#   3. Включает static website hosting (index.html / 404.html).
#   4. Настраивает CORS: разрешает GET/HEAD с https://gde-code.ru
#      и https://www.gde-code.ru.
#   5. Печатает что делать дальше — привязка домена через CDN + DNS.
#
# Повторный запуск БЕЗОПАСЕН: bucket create вернёт ошибку «уже есть» и пойдём
# дальше; настройки website/CORS перезатрутся теми же значениями.
# =============================================================================

set -euo pipefail

if [ -t 1 ]; then
    BOLD=$(printf '\033[1m'); GREEN=$(printf '\033[32m'); RED=$(printf '\033[31m'); YELLOW=$(printf '\033[33m'); BLUE=$(printf '\033[34m'); RESET=$(printf '\033[0m')
else
    BOLD=""; GREEN=""; RED=""; YELLOW=""; BLUE=""; RESET=""
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# -----------------------------------------------------------------------------
# 1. Проверка yc CLI
# -----------------------------------------------------------------------------
if ! command -v yc >/dev/null 2>&1; then
    echo "${RED}✗ yc CLI не установлен. См. инструкцию в deploy/README.md${RESET}" >&2
    exit 1
fi

# -----------------------------------------------------------------------------
# 2. Загрузка переменных окружения
# -----------------------------------------------------------------------------
if [ -f "$SCRIPT_DIR/.env" ]; then
    # shellcheck disable=SC1091
    set -a; . "$SCRIPT_DIR/.env"; set +a
fi

: "${YC_BUCKET_NAME:?YC_BUCKET_NAME не задана. См. deploy/.env.example}"
: "${YC_FOLDER_ID:?YC_FOLDER_ID не задана. См. deploy/.env.example}"

# Имя bucket в YOS — глобально уникальное (как в S3). Подсказываем сразу.
case "$YC_BUCKET_NAME" in
    *[!a-z0-9.-]*|.*|*.|-*|*-)
        echo "${RED}✗ YC_BUCKET_NAME=\"$YC_BUCKET_NAME\" — некорректное имя.${RESET}" >&2
        echo "  Bucket name: только [a-z0-9.-], не начинаться/заканчиваться '.' или '-'." >&2
        exit 1
        ;;
esac

echo "${BLUE}ℹ Bucket:    $YC_BUCKET_NAME${RESET}"
echo "${BLUE}ℹ Folder ID: $YC_FOLDER_ID${RESET}"
echo ""

# -----------------------------------------------------------------------------
# 3. Создание bucket
# -----------------------------------------------------------------------------
echo "${BOLD}▸ Создание bucket${RESET}"
if yc storage bucket create \
        --name "$YC_BUCKET_NAME" \
        --folder-id "$YC_FOLDER_ID" \
        --default-storage-class standard \
        --max-size 1073741824 2>/dev/null; then
    echo "${GREEN}  ✓ bucket создан${RESET}"
else
    # Скорее всего, bucket уже есть — проверим явно.
    if yc storage bucket get --name "$YC_BUCKET_NAME" >/dev/null 2>&1; then
        echo "${YELLOW}  ⚠ bucket уже существует — пропуск${RESET}"
    else
        echo "${RED}  ✗ не удалось создать bucket (имя занято кем-то другим?)${RESET}" >&2
        exit 1
    fi
fi

# -----------------------------------------------------------------------------
# 4. Публичный read-доступ
# -----------------------------------------------------------------------------
echo ""
echo "${BOLD}▸ Открываем анонимный read-доступ${RESET}"
yc storage bucket update \
    --name "$YC_BUCKET_NAME" \
    --public-read

# -----------------------------------------------------------------------------
# 5. Static website hosting
# -----------------------------------------------------------------------------
echo ""
echo "${BOLD}▸ Включаем static website hosting${RESET}"

# 404.html в build пока нет — Vite его не создаёт. Если появится в dist/,
# можно вручную загрузить и обновить настройки. Для SPA error_document = index.html
# тоже валидный выбор — тогда роутинг на клиенте обработает «несуществующие» URL.
WEBSITE_TMP=$(mktemp)
cat > "$WEBSITE_TMP" <<'EOF'
index: index.html
error: index.html
EOF
yc storage bucket update \
    --name "$YC_BUCKET_NAME" \
    --website-settings-from-file "$WEBSITE_TMP"
rm -f "$WEBSITE_TMP"
echo "${GREEN}  ✓ index.html (entry) + index.html (error → SPA-роутинг)${RESET}"

# -----------------------------------------------------------------------------
# 6. CORS-политика
# -----------------------------------------------------------------------------
echo ""
echo "${BOLD}▸ Настройка CORS (https://gde-code.ru, https://www.gde-code.ru)${RESET}"

CORS_TMP=$(mktemp)
cat > "$CORS_TMP" <<'EOF'
cors_rules:
  - id: gdekod-prod
    allowed_methods:
      - get
      - head
    allowed_origins:
      - https://gde-code.ru
      - https://www.gde-code.ru
    allowed_headers:
      - "*"
    expose_headers:
      - ETag
      - Content-Length
    max_age_seconds: 3600
EOF
yc storage bucket update \
    --name "$YC_BUCKET_NAME" \
    --cors-rules-from-file "$CORS_TMP"
rm -f "$CORS_TMP"
echo "${GREEN}  ✓ CORS настроен${RESET}"

# -----------------------------------------------------------------------------
# 7. Что делать дальше
# -----------------------------------------------------------------------------
WEBSITE_URL="https://$YC_BUCKET_NAME.website.yandexcloud.net/"

cat <<EOF

${GREEN}${BOLD}✓ Bucket настроен.${RESET}

Прямой URL для проверки (после первого деплоя):
  ${BLUE}$WEBSITE_URL${RESET}

${BOLD}Что делать дальше:${RESET}

  1. Запустить первый деплой:
       ./deploy/deploy-yandex.sh

  2. Открыть ${BLUE}$WEBSITE_URL${RESET} — убедиться, что сайт открывается.

  3. Создать CDN-ресурс в Yandex Cloud:
       Console → CDN → Create resource
         Origin type:           Bucket
         Bucket:                $YC_BUCKET_NAME
         Personal domain (CNAME): gde-code.ru, www.gde-code.ru
         HTTPS:                 Yes (Let's Encrypt автоматически)
         Forward Host header:   custom — gde-code.ru
         Cache TTL:              по Cache-Control (override НЕ ставить)

  4. Скопировать ID созданного CDN-ресурса в deploy/.env:
       YC_CDN_RESOURCE_ID=bc8...

  5. В Cloudflare DNS поменять записи для gde-code.ru:
       gde-code.ru        CNAME  cl-xxxxxxxx.edgecdn.ru   (proxy: DNS only)
       www.gde-code.ru    CNAME  cl-xxxxxxxx.edgecdn.ru   (proxy: DNS only)

     Точное имя CDN-эндпоинта (cl-xxxxxxxx.edgecdn.ru) — на странице ресурса в YC.
     ВАЖНО: proxy в Cloudflare выключить, т.к. Yandex CDN сам выпускает SSL.

  6. Когда DNS прорастёт (~5–60 минут), повторный деплой
     запустит инвалидацию CDN автоматически:
       ./deploy/deploy-yandex.sh
EOF
