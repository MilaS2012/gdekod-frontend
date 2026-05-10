// =============================================================================
// freshnessBadge.js — мягкая абстракция «когда мы в последний раз проверяли».
//
// Вместо точного «N часов назад» отдаём один из четырёх вариантов:
//   1) <4 часов:                       «✓ Проверено N часов назад»
//   2) ≥4 часов и тот же календарный день:  «✓ Проверено сегодня»
//   3) вчерашний календарный день:     «✓ Проверено вчера»
//   4) старее:                         «✓ Действующий промокод»
//
// Цвет бейджа: зелёный для 1–3, золотой для 4 (см. freshnessBadge → color).
// =============================================================================
//
// Примеры (now ≈ 12:00 текущих суток):
//
//   formatFreshness(now - 1ч)           → "✓ Проверено 1 час назад"
//   formatFreshness(now - 2ч)           → "✓ Проверено 2 часа назад"
//   formatFreshness(now - 3ч 30мин)     → "✓ Проверено 3 часа назад"
//   formatFreshness(now - 4ч)           → "✓ Проверено сегодня"
//   formatFreshness(now - 11ч 59мин)    → "✓ Проверено сегодня" (если тот же день)
//   formatFreshness(now - 14ч)          → "✓ Проверено вчера"   (если now=12:00,
//                                                                то 22:00 вчера)
//   formatFreshness(now - 30ч)          → "✓ Проверено вчера"
//   formatFreshness(now - 60ч)          → "✓ Действующий промокод"
//   formatFreshness(null)               → "✓ Действующий промокод" (graceful)
//   formatFreshness("not-a-date")       → "✓ Действующий промокод"
//   formatFreshness(now + 1мин)         → "✓ Проверено 1 час назад" (clock skew)
//
//   Склонения: 1 час, 2/3 часа, 5+ часов, 11–14 → часов.
// =============================================================================

const HOUR_MS = 3600 * 1000;

function pluralizeHours(n) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 14) return 'часов';
    if (mod10 === 1) return 'час';
    if (mod10 >= 2 && mod10 <= 4) return 'часа';
    return 'часов';
}

function sameCalendarDay(a, b) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth()    === b.getMonth()
        && a.getDate()     === b.getDate();
}

export function formatFreshness(lastCheckedAt) {
    if (lastCheckedAt == null) return '✓ Действующий промокод';

    const checked = lastCheckedAt instanceof Date
        ? lastCheckedAt
        : new Date(lastCheckedAt);
    if (Number.isNaN(checked.getTime())) return '✓ Действующий промокод';

    const now = new Date();
    const diffMs = now.getTime() - checked.getTime();
    // clock skew (в будущем) — трактуем как «1 час назад»
    const diffHours = diffMs < 0 ? 1 : Math.floor(diffMs / HOUR_MS);

    // 1) <4 часов — точное число
    if (diffHours < 4) {
        const h = Math.max(1, diffHours);
        return `✓ Проверено ${h} ${pluralizeHours(h)} назад`;
    }

    // 2) тот же календарный день
    if (sameCalendarDay(checked, now)) {
        return '✓ Проверено сегодня';
    }

    // 3) вчерашний календарный день
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (sameCalendarDay(checked, yesterday)) {
        return '✓ Проверено вчера';
    }

    // 4) всё, что старше
    return '✓ Действующий промокод';
}

/**
 * Возвращает { text, color } — text как formatFreshness, color = 'green' | 'gold'.
 * Золото только для «Действующий промокод», остальные — зелёные.
 */
export function freshnessBadge(lastCheckedAt) {
    const text = formatFreshness(lastCheckedAt);
    return {
        text,
        color: text === '✓ Действующий промокод' ? 'gold' : 'green',
    };
}
