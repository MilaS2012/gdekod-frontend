// =============================================================================
// voting.js — локальный store состояния голосования по промокодам.
//
// Бэкенда нет — пока сохраняем выбор пользователя в localStorage. Когда
// появится API (этап 6) — заменим getVote/setVote на вызовы /confirm и
// /complaint, а localStorage будет писаться только как оптимистичный кеш.
// =============================================================================

const KEY = 'gdekod_voted_coupons';

/**
 * @typedef {'confirmed' | 'complained' | null} VoteValue
 */

function readAll() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

function writeAll(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

/** @returns {VoteValue} */
export function getVote(couponId) {
    if (!couponId) return null;
    const v = readAll()[couponId];
    return v === 'confirmed' || v === 'complained' ? v : null;
}

export function setVote(couponId, value) {
    if (!couponId) return;
    const all = readAll();
    if (value == null) delete all[couponId];
    else all[couponId] = value;
    writeAll(all);
}

export function hasVoted(couponId) {
    return getVote(couponId) !== null;
}
