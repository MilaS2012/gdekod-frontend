#!/usr/bin/env bash
# =============================================================================
# deploy-yandex.sh — деплой собранного фронта на Yandex Object Storage.
#
# Что делает:
#   1. Проверяет yc CLI и переменные окружения.
#   2. Запускает build.sh (если флаг --skip-build не задан).
#   3. Загружает dist/ в bucket с правильными Cache-Control:
#        - assets/* (JS/CSS с хешем)        → 1 год, immutable
#        - прочие top-level файлы           → 1 день
#        - index.html                       → no-cache (грузится последним)
#   4. Инвалидирует CDN-кеш, если YC_CDN_RESOURCE_ID задан.
#   5. Печатает публичные URL.
#
# Порядок загрузки (assets первыми, index.html последним) важен: пользователи,
# попавшие на сайт между шагами, либо получат старый index.html со старыми
# хешами (которые ещё лежат рядом с новыми), либо новый index.html со всеми
# уже загруженными новыми хешами. Промежуточного «битого» состояния нет.
# =============================================================================

set -euo pipefail

if [ -t 1 ]; then
    BOLD=$(printf '\033[1m'); GREEN=$(printf '\033[32m'); RED=$(printf '\033[31m'); YELLOW=$(printf '\033[33m'); BLUE=$(printf '\033[34m'); RESET=$(printf '\033[0m')
else
    BOLD=""; GREEN=""; RED=""; YELLOW=""; BLUE=""; RESET=""
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$PROJECT_ROOT/dist"

# -----------------------------------------------------------------------------
# Аргументы CLI
# -----------------------------------------------------------------------------
SKIP_BUILD=0
for arg in "$@"; do
    case "$arg" in
        --skip-build) SKIP_BUILD=1 ;;
        -h|--help)
            cat <<EOF
Usage: $(basename "$0") [--skip-build]

  --skip-build    Не пересобирать, использовать существующий dist/.
                  Полезно для повторного деплоя без изменений в коде.

Required env:
  YC_BUCKET_NAME       Имя bucket в Yandex Object Storage.
  YC_FOLDER_ID         ID каталога в Yandex Cloud (b1g...).

Optional env:
  YC_CDN_RESOURCE_ID   Если задан — инвалидируем кеш CDN после деплоя.
  YC_TOKEN             OAuth-токен (если не используешь yc config с активным профилем).
EOF
            exit 0
            ;;
        *) echo "${RED}Неизвестный аргумент: $arg${RESET}" >&2; exit 1 ;;
    esac
done

# -----------------------------------------------------------------------------
# 1. Проверка yc CLI
# -----------------------------------------------------------------------------
if ! command -v yc >/dev/null 2>&1; then
    cat >&2 <<EOF
${RED}✗ yc CLI не установлен.${RESET}

Установка (macOS / Linux):
    curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash

После установки перезапусти shell или:
    source "\$HOME/yandex-cloud/path.bash.inc"

Затем настрой профиль:
    yc init
EOF
    exit 1
fi

# -----------------------------------------------------------------------------
# 2. Загрузка переменных окружения
# -----------------------------------------------------------------------------
# Поддерживаем deploy/.env (локальный, в .gitignore). Не валимся, если его нет.
if [ -f "$SCRIPT_DIR/.env" ]; then
    # shellcheck disable=SC1091
    set -a; . "$SCRIPT_DIR/.env"; set +a
fi

: "${YC_BUCKET_NAME:?YC_BUCKET_NAME не задана. См. deploy/.env.example}"
: "${YC_FOLDER_ID:?YC_FOLDER_ID не задана. См. deploy/.env.example}"

# Аутентификация: либо YC_TOKEN, либо активный профиль yc config.
if [ -z "${YC_TOKEN:-}" ]; then
    ACTIVE_PROFILE=$(yc config profile list 2>/dev/null | grep ACTIVE | awk '{print $1}' || true)
    if [ -z "$ACTIVE_PROFILE" ]; then
        echo "${RED}✗ Не задан YC_TOKEN и нет активного yc-профиля.${RESET}" >&2
        echo "  Запусти 'yc init' либо установи YC_TOKEN в deploy/.env" >&2
        exit 1
    fi
    echo "${BLUE}ℹ Используется yc-профиль: $ACTIVE_PROFILE${RESET}"
else
    export YC_TOKEN
fi

echo "${BLUE}ℹ Bucket:    $YC_BUCKET_NAME${RESET}"
echo "${BLUE}ℹ Folder ID: $YC_FOLDER_ID${RESET}"
echo ""

# -----------------------------------------------------------------------------
# 3. Сборка
# -----------------------------------------------------------------------------
if [ "$SKIP_BUILD" -eq 0 ]; then
    "$SCRIPT_DIR/build.sh"
else
    echo "${YELLOW}⚠ --skip-build: используем существующий $DIST_DIR${RESET}"
    if [ ! -f "$DIST_DIR/index.html" ]; then
        echo "${RED}✗ $DIST_DIR/index.html отсутствует — нечего деплоить.${RESET}" >&2
        exit 1
    fi
fi

# -----------------------------------------------------------------------------
# 4. Загрузка в bucket
# -----------------------------------------------------------------------------
S3_URI="s3://$YC_BUCKET_NAME"

echo ""
echo "${BOLD}▸ Загрузка assets/ (Cache-Control: 1 год, immutable)${RESET}"
if [ -d "$DIST_DIR/assets" ]; then
    yc storage cp \
        --recursive \
        "$DIST_DIR/assets" \
        "$S3_URI/assets" \
        --cache-control "public, max-age=31536000, immutable"
else
    echo "${YELLOW}  (нет dist/assets — пропуск)${RESET}"
fi

echo ""
echo "${BOLD}▸ Загрузка прочих top-level файлов (Cache-Control: 1 день)${RESET}"
# Перебираем top-level файлы dist/, исключая index.html (его грузим последним)
# и подкаталог assets/ (уже залит выше).
for f in "$DIST_DIR"/*; do
    name=$(basename "$f")
    if [ -f "$f" ] && [ "$name" != "index.html" ]; then
        yc storage cp \
            "$f" \
            "$S3_URI/$name" \
            --cache-control "public, max-age=86400"
    fi
done

echo ""
echo "${BOLD}▸ Загрузка index.html (Cache-Control: no-cache, must-revalidate)${RESET}"
# Грузится ПОСЛЕДНИМ — после того, как все новые assets/* уже доступны.
yc storage cp \
    "$DIST_DIR/index.html" \
    "$S3_URI/index.html" \
    --cache-control "no-cache, must-revalidate"

# -----------------------------------------------------------------------------
# 5. Инвалидация CDN
# -----------------------------------------------------------------------------
if [ -n "${YC_CDN_RESOURCE_ID:-}" ]; then
    echo ""
    echo "${BOLD}▸ Инвалидация CDN (resource: $YC_CDN_RESOURCE_ID)${RESET}"
    # Чистим только index.html — assets/* immutable, их трогать смысла нет.
    yc cdn cache purge \
        --resource-id "$YC_CDN_RESOURCE_ID" \
        --path "/index.html" \
        --path "/"
else
    echo ""
    echo "${YELLOW}ℹ YC_CDN_RESOURCE_ID не задан — инвалидация CDN пропущена.${RESET}"
fi

# -----------------------------------------------------------------------------
# 6. Финал
# -----------------------------------------------------------------------------
echo ""
echo "${GREEN}✓ Деплой завершён${RESET}"
echo ""
echo "Публичные URL:"
echo "  Object Storage: ${BLUE}https://storage.yandexcloud.net/$YC_BUCKET_NAME/${RESET}"
echo "  Website hosting: ${BLUE}https://$YC_BUCKET_NAME.website.yandexcloud.net/${RESET}"
if [ -n "${YC_CDN_RESOURCE_ID:-}" ]; then
    echo "  CDN: посмотри CNAME в консоли YC → CDN → ресурс $YC_CDN_RESOURCE_ID"
fi
