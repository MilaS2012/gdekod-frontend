// =============================================================================
// feedback.js — глобальный toast и модал жалобы (vanilla DOM).
//
// Делаем DOM-helpers (а не React-компоненты), чтобы переиспользовать
// одинаково из vanilla-кода dashboard-logic.js и из React-кода Catalog.jsx.
//
// CSS — в landing.css и dashboard.css (классы gdk-toast, gdk-complaint-*).
// =============================================================================

let toastEl = null;
let toastHideTimer = null;

/**
 * Показывает toast внизу экрана. Если уже виден — заменяет текст и
 * сбрасывает таймер автоскрытия.
 */
export function showToast(message, { duration = 3000 } = {}) {
    if (toastEl) {
        toastEl.textContent = message;
        if (toastHideTimer) clearTimeout(toastHideTimer);
    } else {
        toastEl = document.createElement('div');
        toastEl.className = 'gdk-toast';
        toastEl.setAttribute('role', 'status');
        toastEl.setAttribute('aria-live', 'polite');
        toastEl.textContent = message;
        document.body.appendChild(toastEl);
        // Force reflow, чтобы класс show с transition сработал как fade-in.
        // eslint-disable-next-line no-unused-expressions
        toastEl.offsetHeight;
        toastEl.classList.add('gdk-toast-show');
    }

    toastHideTimer = setTimeout(() => {
        const el = toastEl;
        toastEl = null;
        toastHideTimer = null;
        if (!el) return;
        el.classList.remove('gdk-toast-show');
        // ждём transition fade-out (300ms), потом удаляем
        setTimeout(() => el.remove(), 320);
    }, duration);
}

const COMPLAINT_REASONS = [
    { value: 'rejected',      label: 'Магазин не принял код' },
    { value: 'expired',       label: 'Срок действия истёк' },
    { value: 'wrong_product', label: 'Не подходит к моему товару' },
    { value: 'other',         label: 'Другое' },
];

/**
 * Открывает модал жалобы. Возвращает Promise, разрешающийся в
 *   { reason: 'rejected' | 'expired' | 'wrong_product' | 'other', otherText: string|null }
 * при отправке, или в `null` если модал закрыт без отправки.
 */
export function openComplaintModal() {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'gdk-complaint-overlay';
        overlay.innerHTML = `
            <div class="gdk-complaint-modal" role="dialog" aria-modal="true" aria-labelledby="gdk-complaint-title">
                <button type="button" class="gdk-complaint-close" aria-label="Закрыть">✕</button>
                <div id="gdk-complaint-title" class="gdk-complaint-title">Что не так с промокодом?</div>
                <form class="gdk-complaint-form">
                    ${COMPLAINT_REASONS.map((r, i) => `
                        <label class="gdk-complaint-option">
                            <input type="radio" name="reason" value="${r.value}" ${i === 0 ? 'checked' : ''}>
                            <span>${r.label}</span>
                        </label>
                    `).join('')}
                    <textarea class="gdk-complaint-other"
                              placeholder="Опишите подробнее, что произошло…"
                              rows="3"
                              style="display:none;"></textarea>
                    <button type="submit" class="gdk-complaint-submit">Отправить</button>
                </form>
            </div>
        `;
        document.body.appendChild(overlay);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        // force reflow для transition
        // eslint-disable-next-line no-unused-expressions
        overlay.offsetHeight;
        overlay.classList.add('gdk-complaint-open');

        const form     = overlay.querySelector('.gdk-complaint-form');
        const textarea = overlay.querySelector('.gdk-complaint-other');

        form.addEventListener('change', (e) => {
            if (e.target.name === 'reason') {
                const isOther = e.target.value === 'other';
                textarea.style.display = isOther ? 'block' : 'none';
                if (isOther) textarea.focus();
            }
        });

        const onKey = (e) => {
            if (e.key === 'Escape') close(null);
        };

        function close(result) {
            document.removeEventListener('keydown', onKey);
            overlay.classList.remove('gdk-complaint-open');
            document.body.style.overflow = prevOverflow;
            setTimeout(() => overlay.remove(), 220);
            resolve(result);
        }

        overlay.querySelector('.gdk-complaint-close')
            .addEventListener('click', () => close(null));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close(null);
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const reason = form.querySelector('input[name="reason"]:checked')?.value;
            if (!reason) return;
            const otherText = textarea.value.trim();
            if (reason === 'other' && !otherText) {
                textarea.focus();
                return;
            }
            close({ reason, otherText: reason === 'other' ? otherText : null });
        });

        document.addEventListener('keydown', onKey);
    });
}
