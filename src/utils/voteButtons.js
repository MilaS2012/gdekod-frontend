// =============================================================================
// voteButtons.js — DOM-инжектор кнопок «Сработал / Не сработал» для vanilla-
// карточек дашборда (которые рендерятся через innerHTML в dashboard-logic.js).
//
// Для React-карточек на лендинге аналогичная логика встроена прямо в
// Catalog.jsx через локальный state.
// =============================================================================

import { showToast, openComplaintModal } from './feedback.js';
import { getVote, setVote } from './voting.js';

const RESULT_CONFIRMED = '✓ Вы подтвердили что код работает';
const RESULT_COMPLAINED = 'Жалоба отправлена. Спасибо за помощь';

function renderResult(block, kind) {
    const isOk = kind === 'confirmed';
    // После голосования — тоже текст без визуала кнопки, в том же цвете,
    // что и соответствующая ссылка-триггер.
    block.innerHTML = `
        <span class="gdk-vote-result ${isOk ? 'gdk-vote-result-ok' : 'gdk-vote-result-grey'}">
            ${isOk ? RESULT_CONFIRMED : RESULT_COMPLAINED}
        </span>
    `;
}

function renderButtons(block, couponId) {
    // Семантически — это две интерактивных «ссылки» без перехода.
    // Используем <button> (а не <span> с role=button), чтобы получить
    // нативную клавиатурную доступность: Enter/Space срабатывают.
    // CSS-сбросом убираем визуал кнопки и оставляем только цветной текст.
    block.innerHTML = `
        <button type="button" class="gdk-vote-link gdk-vote-yes" data-coupon-id="${couponId}">
            ✓ Сработал
        </button>
        <span class="gdk-vote-sep" aria-hidden="true">·</span>
        <button type="button" class="gdk-vote-link gdk-vote-no" data-coupon-id="${couponId}">
            ✗ Не сработал
        </button>
    `;

    block.querySelector('.gdk-vote-yes').addEventListener('click', () => {
        setVote(couponId, 'confirmed');
        showToast('Спасибо за подтверждение');
        renderResult(block, 'confirmed');
        // TODO(этап 6): POST /api/coupons/{id}/confirm
    });

    block.querySelector('.gdk-vote-no').addEventListener('click', async () => {
        const result = await openComplaintModal();
        if (!result) return;
        setVote(couponId, 'complained');
        showToast('Спасибо, мы перепроверим в течение часа');
        renderResult(block, 'complained');
        // TODO(этап 6): POST /api/coupons/{id}/complaint с reason / otherText
    });
}

/**
 * Гарантирует, что под кодом карточки есть блок с кнопками или итогом.
 * Идемпотентна: повторный вызов на той же карточке ничего не делает.
 */
export function ensureVoteButtons(card, couponId) {
    if (!card || !couponId) return;
    if (card.querySelector('.gdk-vote-block')) return;

    const block = document.createElement('div');
    block.className = 'gdk-vote-block';
    block.dataset.couponId = couponId;

    const existing = getVote(couponId);
    if (existing === 'confirmed' || existing === 'complained') {
        renderResult(block, existing);
    } else {
        renderButtons(block, couponId);
    }

    // Вставляем сразу после строки с кодом, до card-footer.
    const codeRow = card.querySelector('.card-code-row');
    if (codeRow) {
        codeRow.insertAdjacentElement('afterend', block);
    } else {
        card.appendChild(block);
    }
}
