#!/usr/bin/env bash
# =============================================================================
# build.sh — production-сборка React-фронта.
# Вызывается напрямую (`./deploy/build.sh`) или из deploy-yandex.sh.
# Запускать из корня проекта, где лежит package.json.
# =============================================================================

set -euo pipefail

# Цветной вывод (ANSI). При не-TTY отключаем, чтобы логи в CI оставались чистыми.
if [ -t 1 ]; then
    BOLD=$(printf '\033[1m'); GREEN=$(printf '\033[32m'); RED=$(printf '\033[31m'); YELLOW=$(printf '\033[33m'); RESET=$(printf '\033[0m')
else
    BOLD=""; GREEN=""; RED=""; YELLOW=""; RESET=""
fi

# Корень проекта определяем относительно расположения этого скрипта,
# чтобы можно было вызвать build.sh из любой директории.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$PROJECT_ROOT/dist"

cd "$PROJECT_ROOT"

if [ ! -f package.json ]; then
    echo "${RED}✗ package.json не найден в $PROJECT_ROOT${RESET}" >&2
    exit 1
fi

echo "${BOLD}▸ npm run build${RESET}"
npm run build

# Sanity-check: dist/ должна появиться, и index.html обязателен.
if [ ! -d "$DIST_DIR" ]; then
    echo "${RED}✗ Сборка не создала $DIST_DIR${RESET}" >&2
    exit 1
fi

if [ ! -f "$DIST_DIR/index.html" ]; then
    echo "${RED}✗ $DIST_DIR/index.html отсутствует — что-то сломалось при сборке${RESET}" >&2
    exit 1
fi

# Размер dist/ — sanity-check на «адекватность» сборки.
# Слишком большая (> 50 МБ) или подозрительно маленькая (< 50 КБ) — сигнал.
DIST_SIZE_HUMAN=$(du -sh "$DIST_DIR" | cut -f1)
DIST_BYTES=$(find "$DIST_DIR" -type f -exec stat -f%z {} + | awk '{s+=$1} END {print s+0}')
FILE_COUNT=$(find "$DIST_DIR" -type f | wc -l | tr -d ' ')

echo ""
echo "${GREEN}✓ Сборка готова${RESET}"
echo "  путь:       $DIST_DIR"
echo "  размер:     $DIST_SIZE_HUMAN ($DIST_BYTES байт)"
echo "  файлов:     $FILE_COUNT"
echo ""

if [ "$DIST_BYTES" -lt 51200 ]; then
    echo "${YELLOW}⚠ Сборка меньше 50 КБ — подозрительно. Проверь, всё ли скопировалось.${RESET}" >&2
fi
if [ "$DIST_BYTES" -gt 52428800 ]; then
    echo "${YELLOW}⚠ Сборка больше 50 МБ — для SPA много. Проверь, не залезли ли исходники/sourcemaps.${RESET}" >&2
fi
