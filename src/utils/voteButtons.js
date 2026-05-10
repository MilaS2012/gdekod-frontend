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
    block.innerHTML = `
        <div class="gdk-vote-result ${isOk ? 'gdk-vote-result-ok' : 'gdk-vote-result-grey'}">
            ${isOk ? RESULT_CONFIRMED : RESULT_COMPLAINED}
        </div>
    `;
}

function renderButtons(block, couponId) {
    block.innerHTML = `
        <button type="button" class="gdk-vote-btn gdk-vote-yes" data-coupon-id="${couponId}">
            <span class="gdk-vote-icon">✓</span> Сработал
        </button>
        <button type="button" class="gdk-vote-btn gdk-vote-no" data-coupon-id="${couponId}">
            <span class="gdk-vote-icon">✗</span> Не сработал
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
