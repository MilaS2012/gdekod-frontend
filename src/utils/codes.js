// Частичный показ промокода (3 случайных символа скрыты)
import { ensureVoteButtons } from './voteButtons.js';

export function seededPositions(code) {
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) & 0xffff;
  const chars = code.split('');
  const candidates = [];
  chars.forEach((c, i) => {
    if (i > 0 && i < chars.length - 1 && c !== '-' && c !== '_') candidates.push(i);
  });
  const picked = [];
  let pool = [...candidates];
  for (let k = 0; k < 3 && pool.length > 0; k++) {
    const idx = (h * (k + 7) + k * 13) % pool.length;
    const pos = pool[idx];
    picked.push(pos);
    pool = pool.filter((p) => Math.abs(p - pos) > 1);
    h = (h * 1664525 + 1013904223) & 0xffff;
  }
  return picked;
}

export function renderPartialCode(code, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const hidden = seededPositions(code);
  let html = '';
  code.split('').forEach((char, i) => {
    if (char === '-') {
      html += `<span class="pc" style="opacity:0.35;margin:0 1px">-</span>`;
    } else if (hidden.includes(i)) {
      html += `<span class="ph" title="Скрыто"></span>`;
    } else {
      html += `<span class="pc">${char}</span>`;
    }
  });
  el.innerHTML = html;
}

export function renderCode(id, code) {
  const el = document.getElementById(id);
  if (!el) return;
  const hidden = seededPositions(code);
  el.innerHTML = code
    .split('')
    .map((c, i) => (hidden.includes(i) ? `<span class="ph"></span>` : `<span class="pc">${c}</span>`))
    .join('');
}

export function revealCode(id, code, btn) {
  const el = document.getElementById(id);
  if (!el || !btn) return;
  el.innerHTML = code.split('').map((c) => `<span class="pc">${c}</span>`).join('');
  btn.textContent = 'Скопировать';
  btn.classList.add('copy');
  btn.onclick = () => copyCode(code, btn);
  // Блок голосования НЕ показываем здесь: «увидел символы» ещё не значит
  // «попробовал применить». Триггер — успешное копирование, см. copyCode.
}

export function copyCode(code, btn) {
  const orig = btn.textContent;

  function onCopied() {
    btn.textContent = '✓ Скопировано';
    btn.classList.add('copied');
    btn.classList.remove('copy');
    if (typeof window.__addToMyPromos === 'function') {
      window.__addToMyPromos(code, btn);
    }

    // Только теперь, после реального копирования, показываем блок
    // голосования. Условие data-coupon-id отсекает кнопки из «Мои
    // промокоды» (там copy-only, без reveal-flow и без data-coupon-id).
    const card = btn.closest('.promo-card');
    const couponId = btn.getAttribute('data-coupon-id');
    if (card && couponId) ensureVoteButtons(card, couponId);

    setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove('copied');
      if (orig === 'Скопировать') btn.classList.add('copy');
    }, 2200);
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(onCopied).catch(() => fallbackCopy(code, onCopied));
  } else {
    fallbackCopy(code, onCopied);
  }
}

function fallbackCopy(code, cb) {
  try {
    const ta = document.createElement('textarea');
    ta.value = code;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    cb();
  } catch (e) {}
}
