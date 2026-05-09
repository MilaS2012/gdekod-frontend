// Логика дашборда — портирована из оригинального gdekod-lk.html
import { PARTNERS, brandAvatar, isExpired, expiresText, catLabel } from './partners.js';
import { renderCode, revealCode, copyCode } from './codes.js';

// ── Избранное (localStorage) ──
let favourites = [];
try {
  const stored = JSON.parse(localStorage.getItem('gdekod_favourites') || '[]');
  if (Array.isArray(stored)) favourites = stored;
} catch (e) {}

function saveFavouritesToStorage() {
  try { localStorage.setItem('gdekod_favourites', JSON.stringify(favourites)); } catch (e) {}
}

// ── Скролл с учётом высоты навбара ──
export function scrollToEl(el) {
  if (!el) return;
  const navH = document.querySelector('nav')?.offsetHeight || 70;
  const top = el.getBoundingClientRect().top + window.scrollY - navH - 8;
  window.scrollTo({ top, behavior: 'smooth' });
}

// ── Восстановление сердечек ──
export function restoreHearts(container) {
  if (!container) return;
  container.querySelectorAll('.card-heart').forEach((btn) => {
    const card = btn.closest('.promo-card');
    if (!card) return;
    const shop = card.querySelector('.card-shop-name')?.textContent?.trim() || '';
    const discount = card.querySelector('.card-discount')?.textContent?.trim() || '';
    const isFav = favourites.some((f) => f.shop === shop && f.discount === discount);
    if (isFav) {
      btn.classList.add('active');
      btn.innerHTML = '♥';
    }
  });
}

// ── Каталог партнёров (алфавитная навигация) ──
export function buildPartnerCatalog(list) {
  const activeList = list.filter((p) => p.promos.some((pr) => !isExpired(pr.expires)));
  const grouped = {};
  activeList.forEach((p) => {
    const letter = p.name[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(p);
  });

  const usedLetters = Object.keys(grouped);
  const navEl = document.getElementById('alphNav');
  if (navEl) {
    navEl.innerHTML = usedLetters.sort((a, b) => a.localeCompare(b, 'ru')).map((l) =>
      `<button class="alpha-btn has" data-letter="${l}">${l}</button>`
    ).join('');
    navEl.querySelectorAll('.alpha-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const letter = btn.getAttribute('data-letter');
        scrollToEl(document.getElementById(`sec-${letter}`));
      });
    });
  }

  const listEl = document.getElementById('partnerList');
  if (!listEl) return;
  listEl.innerHTML = Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'ru')).map((letter) => `
    <div class="alpha-section" id="sec-${letter}">
      <div class="alpha-letter">${letter}</div>
      <div class="partner-grid">
        ${grouped[letter].map((p) => {
          const activeCount = p.promos.filter((pr) => !isExpired(pr.expires)).length;
          return `
          <div class="partner-card" data-name="${p.name.replace(/"/g, '&quot;')}">
            <div class="partner-logo">${brandAvatar(p.domain, 28)}</div>
            <div>
              <div class="partner-name">${p.name}</div>
              <div class="partner-count">${activeCount} промокод${activeCount === 1 ? '' : activeCount < 5 ? 'а' : 'ов'}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `).join('');

  listEl.querySelectorAll('.partner-card').forEach((card) => {
    card.addEventListener('click', () => {
      const name = card.getAttribute('data-name');
      showPartner(name);
    });
  });
}

// ── Поиск по партнёрам ──
export function filterPartners(q) {
  if (!q.trim()) {
    buildPartnerCatalog(PARTNERS);
    const nav = document.getElementById('alphNav');
    if (nav) nav.style.display = 'flex';
    return;
  }
  const filtered = PARTNERS.filter((p) =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.domain.toLowerCase().includes(q.toLowerCase())
  );
  if (filtered.length === 0) {
    const nav = document.getElementById('alphNav');
    if (nav) nav.style.display = 'none';
    document.getElementById('partnerList').innerHTML = `
      <div style="text-align:center;padding:48px 20px;color:var(--text-muted);">
        <div style="font-size:48px;margin-bottom:16px;">🔍</div>
        <div style="font-size:18px;font-weight:600;color:var(--text);margin-bottom:8px;">Магазин не найден</div>
        <div style="font-size:14px;margin-bottom:20px;">Промокодов для «${q}» пока нет в нашей базе.</div>
        <div style="font-size:13px;">Попробуйте другой запрос или <a href="#" id="resetPartnerSearch" style="color:var(--gold);">посмотрите весь каталог</a></div>
      </div>`;
    document.getElementById('resetPartnerSearch')?.addEventListener('click', (e) => {
      e.preventDefault();
      const inp = document.getElementById('partnerSearch');
      if (inp) inp.value = '';
      filterPartners('');
    });
  } else {
    const nav = document.getElementById('alphNav');
    if (nav) nav.style.display = 'flex';
    buildPartnerCatalog(filtered);
  }
}

// ── Показ конкретного партнёра ──
export function showPartner(name) {
  const partner = PARTNERS.find((p) => p.name === name);
  if (!partner) return;
  const partnerListEl = document.getElementById('partnerList');
  const alphNav = document.getElementById('alphNav');
  const partnerSearch = document.getElementById('partnerSearch');
  const partnerPromos = document.getElementById('partnerPromos');
  if (partnerListEl) partnerListEl.style.display = 'none';
  if (alphNav) alphNav.style.display = 'none';
  if (partnerSearch && partnerSearch.parentElement) partnerSearch.parentElement.style.display = 'none';
  if (partnerPromos) partnerPromos.style.display = 'block';
  scrollToEl(partnerPromos);
  const partnerTitle = document.getElementById('partnerTitle');
  if (partnerTitle) partnerTitle.innerHTML = `Промокоды <em>${partner.name}</em>`;

  const activePromos = partner.promos.filter((pr) => !isExpired(pr.expires));
  const grid = document.getElementById('partnerPromoGrid');
  if (!grid) return;
  if (activePromos.length === 0) {
    grid.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:var(--text-muted);">
        <div style="font-size:40px;margin-bottom:12px;">⏰</div>
        <div style="font-size:16px;font-weight:600;color:var(--text);margin-bottom:8px;">Нет актуальных промокодов</div>
        <div style="font-size:13px;">Все промокоды этого магазина истекли. Скоро добавим новые.</div>
      </div>`;
    return;
  }
  let html = '';
  activePromos.forEach((pr, i) => {
    const cid = `ppartner-${i}`;
    html += `
      <div class="promo-card">
        <div class="card-top">
          <div class="card-shop">
            <div class="card-ico">${brandAvatar(partner.domain)}</div>
            <div><div class="card-shop-name">${partner.name}</div></div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
            <span class="status-pill">Проверено</span>
            <span style="font-size:11px;font-weight:500;color:var(--gold);">${expiresText(pr.expires)}</span>
          </div>
        </div>
        <div class="card-discount">${pr.disc}</div>
        <div class="card-desc">${pr.desc}</div>
        <div class="card-code-row">
          <span class="partial-code" id="${cid}"></span>
          <button class="reveal-btn" data-cid="${cid}" data-code="${pr.code}">Показать</button>
        </div>
        <div class="card-footer">
          <span class="verified-lbl">✓ Проверено ${pr.verified} назад</span>
        </div>
        <button class="card-heart" title="В избранное">♡</button>
      </div>`;
  });
  grid.innerHTML = html;
  activePromos.forEach((pr, i) => renderCode(`ppartner-${i}`, pr.code));
  bindRevealButtons(grid);
  bindHeartButtons(grid);
  restoreHearts(grid);
}

export function backToPartners() {
  const list = document.getElementById('partnerList');
  const nav = document.getElementById('alphNav');
  const search = document.getElementById('partnerSearch');
  const promos = document.getElementById('partnerPromos');
  if (list) list.style.display = 'block';
  if (nav) nav.style.display = 'flex';
  if (search && search.parentElement) search.parentElement.style.display = 'block';
  if (promos) promos.style.display = 'none';
  setTimeout(() => scrollToEl(document.querySelector('.main-content')), 50);
}

// ── Поиск (главная строка) ──
export function doSearch() {
  const q = document.getElementById('mainSearch').value.trim().toLowerCase();
  if (!q) return;
  const found = PARTNERS.filter((p) => p.name.toLowerCase().includes(q) || p.domain.toLowerCase().includes(q));
  if (found.length === 0) {
    document.getElementById('partnerList').innerHTML = `
      <div style="text-align:center;padding:48px 20px;color:var(--text-muted);">
        <div style="font-size:48px;margin-bottom:16px;">🔍</div>
        <div style="font-size:18px;font-weight:600;color:var(--text);margin-bottom:8px;">Магазин не найден</div>
        <div style="font-size:14px;margin-bottom:20px;">Промокодов для «${document.getElementById('mainSearch').value.trim()}» пока нет в нашей базе.</div>
        <div style="font-size:13px;">Попробуйте другой запрос или <a href="#" id="clearSearchLink" style="color:var(--gold);">посмотрите весь каталог</a></div>
      </div>`;
    document.getElementById('alphNav').style.display = 'none';
    const inpWrap = document.getElementById('partnerSearch');
    if (inpWrap && inpWrap.parentElement) inpWrap.parentElement.style.display = 'none';
    document.getElementById('clearSearchLink')?.addEventListener('click', (e) => { e.preventDefault(); clearSearch(); });
  } else {
    buildPartnerCatalog(found);
  }
  scrollToEl(document.getElementById('panelAll'));
}

export function clearSearch() {
  document.getElementById('mainSearch').value = '';
  buildPartnerCatalog(PARTNERS);
  document.getElementById('alphNav').style.display = 'flex';
  const inpWrap = document.getElementById('partnerSearch');
  if (inpWrap && inpWrap.parentElement) inpWrap.parentElement.style.display = 'block';
  scrollToEl(document.getElementById('panelAll'));
}

// ── Reveal/Heart binders ──
export function bindRevealButtons(container) {
  container.querySelectorAll('.reveal-btn').forEach((btn) => {
    if (btn._bound) return;
    btn._bound = true;
    btn.addEventListener('click', (e) => {
      const cid = btn.getAttribute('data-cid');
      const code = btn.getAttribute('data-code');
      if (!cid || !code) return;
      revealCode(cid, code, btn);
    });
  });
}

export function bindHeartButtons(container) {
  container.querySelectorAll('.card-heart').forEach((btn) => {
    if (btn._bound) return;
    btn._bound = true;
    btn.addEventListener('click', () => toggleHeart(btn));
  });
}

// ── Toggle heart ──
export function toggleHeart(btn) {
  const card = btn.closest('.promo-card');
  const isFav = btn.classList.contains('active');
  if (isFav) {
    btn.classList.remove('active');
    btn.innerHTML = '♡';
    const shop = card.querySelector('.card-shop-name')?.textContent?.trim() || '';
    const discount = card.querySelector('.card-discount')?.textContent?.trim() || '';
    favourites = favourites.filter((f) => !(f.shop === shop && f.discount === discount));
    saveFavouritesToStorage();
  } else {
    btn.classList.add('active');
    btn.innerHTML = '♥';
    const shop = card.querySelector('.card-shop-name')?.textContent || 'Магазин';
    const discount = card.querySelector('.card-discount')?.textContent || '';
    const desc = card.querySelector('.card-desc')?.textContent || '';
    const verified = card.querySelector('.verified-lbl, .card-footer span')?.textContent || '';
    const codeEl = card.querySelector('.partial-code');
    const code = codeEl?.dataset.code || '';
    const partner = PARTNERS.find((p) => p.name === shop);
    if (!favourites.find((f) => f.shop === shop && f.discount === discount)) {
      favourites.push({ shop, category: '', discount, desc, verified, code, partner, savedAt: Date.now() });
      saveFavouritesToStorage();
      renderFavourites();
    }
  }
  updateFavBadge();
}

function updateFavBadge() {
  const badge = document.querySelector('#tabReceipts .tab-badge');
  if (badge) badge.textContent = favourites.length || '';
}

// ── Избранное (рендер) ──
export function renderFavourites() {
  const container = document.getElementById('favContent');
  if (!container) return;
  updateFavBadge();
  if (favourites.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:48px 20px;">
        <div style="font-size:48px;margin-bottom:16px;">❤️</div>
        <div style="font-size:18px;font-weight:600;color:var(--text);margin-bottom:8px;">Избранное пусто</div>
        <div style="font-size:14px;color:var(--text-muted);margin-bottom:20px;">Нажмите 🤍 на карточке промокода — он появится здесь.</div>
        <a href="#" id="favGoCatalog" style="display:inline-block;background:var(--gold);color:#fff;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:500;text-decoration:none;">Перейти к каталогу →</a>
      </div>`;
    container.querySelector('#favGoCatalog')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.__switchTab && window.__switchTab('all');
    });
    return;
  }
  let cards = '';
  const cids = [];
  favourites.forEach((f, idx) => {
    const partner = PARTNERS.find((p) => p.name === f.shop);
    const domain = partner?.domain || '';
    const promo = partner?.promos?.find((p) => p.disc === f.discount || p.code === f.code) || partner?.promos?.[0];
    const code = f.code || promo?.code || '';
    const disc = f.discount || promo?.disc || '';
    const desc = f.desc || promo?.desc || '';
    const verified = promo?.verified ? `${promo.verified} назад` : (f.verified?.replace(/^[✓\s]*(Проверено\s*)?/, '') || '');
    const expires = promo?.expires || null;
    const cid = `fav-${idx}`;
    cids.push({ cid, code });
    const expired_card = isExpired(expires);
    cards += `
      <div class="promo-card" style="${expired_card ? 'opacity:0.6;' : ''}">
        <div class="card-top">
          <div class="card-shop">
            <div class="card-ico">${brandAvatar(domain)}</div>
            <div>
              <div class="card-shop-name" data-go-partner="${f.shop.replace(/"/g, '&quot;')}" style="cursor:pointer;">${f.shop}</div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
            <span class="status-pill ${expired_card ? 'expired' : ''}">
              ${expired_card ? 'Истёк' : 'Проверено'}
            </span>
            ${!expired_card ? `<span style="font-size:11px;font-weight:500;color:var(--gold);">${expiresText(expires)}</span>` : ''}
          </div>
        </div>
        <div class="card-discount">${disc}</div>
        <div class="card-desc">${desc}</div>
        <div class="card-code-row">
          <span class="partial-code" id="${cid}"></span>
          <button class="reveal-btn" data-cid="${cid}" data-code="${code}">Показать</button>
        </div>
        <div class="card-footer">
          <span class="verified-lbl">✓ Проверено ${verified}</span>
        </div>
        <button class="card-heart active" data-fav-shop="${f.shop.replace(/"/g, '&quot;')}" data-fav-disc="${f.discount.replace(/"/g, '&quot;')}">♥</button>
      </div>`;
  });
  container.innerHTML = `
    <div class="section-head">
      <div class="section-title">Избранные <em>промокоды</em></div>
    </div>
    <div class="promo-grid">${cards}</div>`;

  cids.forEach(({ cid, code }) => { if (code) renderCode(cid, code); });
  bindRevealButtons(container);
  // Heart removal on favourites
  container.querySelectorAll('.card-heart').forEach((btn) => {
    btn.addEventListener('click', () => {
      const shop = btn.getAttribute('data-fav-shop');
      const disc = btn.getAttribute('data-fav-disc');
      removeFav(shop, disc);
    });
  });
  // Go to partner
  container.querySelectorAll('[data-go-partner]').forEach((el) => {
    el.addEventListener('click', () => {
      const name = el.getAttribute('data-go-partner');
      window.__switchTab && window.__switchTab('all');
      setTimeout(() => showPartner(name), 100);
    });
  });
}

function removeFav(shop, discount) {
  favourites = favourites.filter((f) => !(f.shop === shop && f.discount === discount));
  saveFavouritesToStorage();
  renderFavourites();
  updateFavBadge();
  document.querySelectorAll('.card-heart.active').forEach((h) => {
    const card = h.closest('.promo-card');
    const s = card?.querySelector('.card-shop-name')?.textContent?.trim();
    const d = card?.querySelector('.card-discount')?.textContent?.trim();
    if (s === shop && d === discount) {
      h.classList.remove('active');
      h.innerHTML = '♡';
    }
  });
}

// ── Мои промокоды (localStorage) ──
function saveMyPromos() {
  try {
    const items = document.getElementById('myPromoItems');
    if (!items) return;
    const promos = [];
    items.querySelectorAll('.promo-card').forEach((card) => {
      const shop = card.querySelector('.card-shop-name')?.textContent?.trim() || '';
      const code = card.querySelector('.partial-code')?.textContent?.trim() || '';
      const disc = card.querySelector('.card-discount')?.textContent?.trim() || '';
      const date = card.querySelector('.verified-lbl')?.textContent?.replace('✓ Скопировано ', '').trim() || '';
      if (code) promos.push({ shop, code, disc, date });
    });
    localStorage.setItem('gdekod_my_promos', JSON.stringify(promos));
  } catch (e) {}
}

export function loadMyPromos() {
  try {
    const saved = JSON.parse(localStorage.getItem('gdekod_my_promos') || '[]');
    if (!saved.length) return;
    const empty = document.getElementById('myPromoEmpty');
    const list = document.getElementById('myPromoList');
    const items = document.getElementById('myPromoItems');
    if (!items) return;
    if (empty) empty.style.display = 'none';
    if (list) list.style.display = 'block';
    saved.forEach((p) => {
      const partner = PARTNERS.find((x) => x.name === p.shop);
      const domain = partner?.domain || '';
      const promo = partner?.promos?.find((x) => x.code === p.code) || partner?.promos?.[0];
      const cat = promo?.desc || '';
      const disc = p.disc || promo?.disc || '';
      const cid = 'mypromo-ls-' + Math.random().toString(36).slice(2);
      const item = document.createElement('div');
      const isExp = isExpired(promo?.expires || null);
      item.className = 'promo-card';
      item.style.opacity = isExp ? '0.6' : '1';
      item.innerHTML = `
        <div class="card-top">
          <div class="card-shop">
            <div class="card-ico">${brandAvatar(domain)}</div>
            <div>
              <div class="card-shop-name">${p.shop}</div>
              <div class="card-shop-cat">${cat}</div>
            </div>
          </div>
          <span class="status-pill ${isExp ? 'expired' : ''}">
            ${isExp ? 'Истёк' : 'Скопирован'}
          </span>
        </div>
        <div class="card-discount">${disc}</div>
        <div class="card-code-row">
          <span class="partial-code" id="${cid}" style="font-family:var(--font-mono);font-size:13px;letter-spacing:0.06em;">${p.code}</span>
          <button class="reveal-btn copy" data-copy-code="${p.code}">Скопировать</button>
        </div>
        <div class="card-footer">
          <span class="verified-lbl">✓ Скопировано ${p.date}</span>
        </div>`;
      items.appendChild(item);
    });
    // Bind copy buttons
    items.querySelectorAll('.reveal-btn[data-copy-code]').forEach((btn) => {
      const c = btn.getAttribute('data-copy-code');
      btn.addEventListener('click', () => copyCode(c, btn));
    });
    const badge = document.getElementById('badgePromo');
    const cnt = items.children.length;
    if (badge) { badge.textContent = cnt; badge.style.display = cnt > 0 ? '' : 'none'; }
  } catch (e) {}
}

export function addToMyPromos(code, btn) {
  const card = btn.closest('.promo-card, .partner-card, .history-item');
  let shop = 'Магазин';
  let domain = '';
  if (card) {
    const shopEl = card.querySelector('.card-shop-name, .partner-name, .hist-shop');
    if (shopEl) shop = shopEl.textContent.trim();
  }
  const partner = PARTNERS.find((p) => p.name === shop);
  if (partner) domain = partner.domain;

  const now = new Date();
  const dateStr = now.toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const empty = document.getElementById('myPromoEmpty');
  const list = document.getElementById('myPromoList');
  const items = document.getElementById('myPromoItems');
  if (!items) return;

  if (empty) empty.style.display = 'none';
  if (list) list.style.display = 'block';

  const existing = Array.from(items.querySelectorAll('.partial-code')).map((el) => el.textContent.trim());
  if (existing.includes(code)) return;

  const cid = 'mypromo-' + Date.now();
  const addedPromo = partner?.promos?.find((p) => p.code === code) || partner?.promos?.[0];
  const isExpNow = isExpired(addedPromo?.expires || null);
  const item = document.createElement('div');
  item.className = 'promo-card';
  item.style.opacity = isExpNow ? '0.6' : '1';
  item.innerHTML = `
    <div class="card-top">
      <div class="card-shop">
        <div class="card-ico">${brandAvatar(domain)}</div>
        <div>
          <div class="card-shop-name">${shop}</div>
          <div class="card-shop-cat">${partner ? (addedPromo?.desc || '') : ''}</div>
        </div>
      </div>
      <span class="status-pill ${isExpNow ? 'expired' : ''}">
        ${isExpNow ? 'Истёк' : 'Скопирован'}
      </span>
    </div>
    <div class="card-discount">${partner ? (partner.promos.find((p) => p.code === code)?.disc || '') : ''}</div>
    <div class="card-desc">${partner ? (partner.promos.find((p) => p.code === code)?.desc || '') : ''}</div>
    <div class="card-code-row">
      <span class="partial-code" id="${cid}" style="font-family:var(--font-mono);font-size:13px;letter-spacing:0.06em;">${code}</span>
      <button class="reveal-btn copy" data-copy-code="${code}">Скопировать</button>
    </div>
    <div class="card-footer">
      <span class="verified-lbl">✓ Скопировано ${dateStr}</span>
    </div>
  `;
  items.insertBefore(item, items.firstChild);
  item.querySelector('.reveal-btn[data-copy-code]')?.addEventListener('click', (e) => {
    const t = e.currentTarget;
    copyCode(t.getAttribute('data-copy-code'), t);
  });

  const badge = document.getElementById('badgePromo');
  const cnt = items.children.length;
  if (badge) { badge.textContent = cnt; badge.style.display = cnt > 0 ? '' : 'none'; }

  saveMyPromos();
}

// Подвешиваем addToMyPromos в window для copyCode
if (typeof window !== 'undefined') {
  window.__addToMyPromos = addToMyPromos;
}

// ── Поиск в "Мои промокоды" ──
export function filterMyPromo(q) {
  const list = document.getElementById('myPromoItems');
  const empty = document.getElementById('myPromoEmpty');
  const myList = document.getElementById('myPromoList');
  if (!list) return;
  const items = list.querySelectorAll('.promo-card');
  let visible = 0;
  items.forEach((item) => {
    const name = item.querySelector('.card-shop-name')?.textContent?.toLowerCase() || '';
    const show = !q || name.includes(q.toLowerCase());
    item.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  if (q && visible === 0) {
    if (myList) myList.style.display = 'none';
    if (empty) {
      empty.style.display = 'block';
      empty.innerHTML = `
        <div style="text-align:center;padding:48px 20px;color:var(--text-muted);">
          <div style="font-size:48px;margin-bottom:16px;">🔍</div>
          <div style="font-size:18px;font-weight:600;color:var(--text);margin-bottom:8px;">Магазин не найден</div>
          <div style="font-size:14px;margin-bottom:20px;">Промокодов для «${q}» нет в вашей истории.</div>
          <div style="font-size:13px;">Попробуйте другой запрос или <a href="#" id="resetMyPromoSearch" style="color:var(--gold);">посмотрите всю историю</a></div>
        </div>`;
      document.getElementById('resetMyPromoSearch')?.addEventListener('click', (e) => {
        e.preventDefault();
        const inp = document.querySelector('#panelPromo .search-input');
        if (inp) inp.value = '';
        filterMyPromo('');
      });
    }
  } else {
    if (empty) empty.style.display = items.length === 0 ? 'block' : 'none';
    if (myList) myList.style.display = items.length > 0 ? 'block' : 'none';
  }
}

export function filterFavorites(q) {
  const list = document.getElementById('favContent');
  if (!list) return;
  const items = list.querySelectorAll('.promo-card');
  items.forEach((item) => {
    const name = item.querySelector('.card-shop-name')?.textContent?.toLowerCase() || '';
    const show = !q || name.includes(q.toLowerCase());
    item.style.display = show ? '' : 'none';
  });
}

// ── Фильтр по категории ──
export function filterByCat(cat) {
  const promos = document.getElementById('partnerPromos');
  const list = document.getElementById('partnerList');
  const nav = document.getElementById('alphNav');
  const srch = document.getElementById('partnerSearch');
  if (promos) promos.style.display = 'none';
  if (srch) {
    srch.value = '';
    if (srch.parentElement) srch.parentElement.style.display = 'none';
  }
  const filtered = cat === 'all' ? PARTNERS : PARTNERS.filter((p) => p.cat === cat);
  if (list) list.style.display = 'block';
  if (nav) nav.style.display = 'flex';
  buildPartnerCatalog(filtered);
  const panel = document.getElementById('panelAll');
  if (panel) scrollToEl(panel);
}

// ── Чеки ──
export const RECEIPTS = {
  may2026: {
    title: 'Май 2026',
    items: [
      { date: '6 мая 2026', time: '00:01', sum: '35 ₽', fiscal: '4821930571', kkt: '0006247812' },
      { date: '5 мая 2026', time: '00:01', sum: '35 ₽', fiscal: '3917462810', kkt: '0006247812' },
      { date: '4 мая 2026', time: '00:01', sum: '35 ₽', fiscal: '7204851930', kkt: '0006247812' },
      { date: '3 мая 2026', time: '00:01', sum: '35 ₽', fiscal: '5503920174', kkt: '0006247812' },
      { date: '2 мая 2026', time: '00:01', sum: '35 ₽', fiscal: '6619302847', kkt: '0006247812' },
      { date: '1 мая 2026', time: '00:01', sum: '35 ₽', fiscal: '2904716358', kkt: '0006247812' },
    ],
  },
  apr2026: {
    title: 'Апрель 2026',
    items: Array.from({ length: 5 }, (_, i) => ({
      date: `${30 - i} апреля 2026`, time: '00:01',
      sum: '35 ₽', fiscal: String(Math.floor(Math.random() * 9e9 + 1e9)), kkt: '0006247812',
    })),
  },
  mar2026: {
    title: 'Март 2026',
    items: Array.from({ length: 5 }, (_, i) => ({
      date: `${31 - i} марта 2026`, time: '00:01',
      sum: '35 ₽', fiscal: String(Math.floor(Math.random() * 9e9 + 1e9)), kkt: '0006247812',
    })),
  },
};

export function getFavouritesCount() {
  return favourites.length;
}
