import { useEffect, useState, useRef } from 'react';
import {
  buildPartnerCatalog, filterPartners, doSearch, scrollToEl,
  loadMyPromos, renderFavourites, filterMyPromo, filterFavorites,
  showPartner, backToPartners, filterByCat, RECEIPTS, getFavouritesCount,
} from '../../utils/dashboard-logic.js';
import { PARTNERS } from '../../utils/partners.js';

export default function MainContent({ activeTab, switchTab, openModal }) {
  const [activeCat, setActiveCat] = useState('all');
  const [monthsView, setMonthsView] = useState('list');
  const [monthData, setMonthData] = useState(null);
  const partnerSearchRef = useRef(null);

  useEffect(() => {
    buildPartnerCatalog(PARTNERS);
    loadMyPromos();
    if (getFavouritesCount() > 0) {
      renderFavourites();
    }
    const badge = document.querySelector('#tabReceipts .tab-badge');
    if (badge) badge.textContent = getFavouritesCount() || '';

    // Поиск магазина из главной страницы
    try {
      const shop = sessionStorage.getItem('gdekod_shop');
      if (shop) {
        sessionStorage.removeItem('gdekod_shop');
        setTimeout(() => showPartner(shop), 100);
      }
      const scrollTo = sessionStorage.getItem('gdekod_scroll');
      if (scrollTo) {
        sessionStorage.removeItem('gdekod_scroll');
        setTimeout(() => {
          switchTab('support');
          setTimeout(() => scrollToEl(document.getElementById(scrollTo)), 150);
        }, 200);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (activeTab === 'receipts') renderFavourites();
  }, [activeTab]);

  const handleCatFilter = (cat) => {
    setActiveCat(cat);
    switchTab('all');
    setTimeout(() => filterByCat(cat), 80);
  };

  const handleMonthClick = (key) => {
    const data = RECEIPTS[key];
    if (data) {
      setMonthData(data);
      setMonthsView('detail');
    }
  };

  const handleOpenReceipt = (r) => {
    document.getElementById('ofdDate').textContent = r.date + ', ' + r.time;
    document.getElementById('ofdSum').textContent = r.sum;
    document.getElementById('ofdFiscal').textContent = r.fiscal;
    document.getElementById('ofdKkt').textContent = r.kkt;
    openModal('receiptModal');
  };

  const submitSupport = (e) => {
    const name = document.getElementById('supportName').value.trim();
    const email = document.getElementById('supportEmail').value.trim();
    const text = document.getElementById('supportText').value.trim();
    if (!name || !email || !text) {
      alert('Пожалуйста, заполните все поля.');
      return;
    }
    document.getElementById('supportName').value = '';
    document.getElementById('supportEmail').value = '';
    document.getElementById('supportText').value = '';
    const btn = e.currentTarget;
    btn.textContent = 'Отправлено ✓';
    btn.style.background = 'var(--green)';
    setTimeout(() => { btn.textContent = 'Отправить'; btn.style.background = ''; }, 3000);
  };

  return (
    <main className="main-content">
      <div className="page-title">Мои <em>промокоды</em></div>

      <div className="search-block">
        <div className="search-block-title">Найти <em>промокод</em></div>
        <div className="search-row">
          <div className="search-wrap">
            <span className="search-ico">🔍</span>
            <input
              className="search-input"
              id="mainSearch"
              type="text"
              placeholder="Wildberries, Lamoda, Ozon..."
              onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }}
            />
          </div>
          <button className="search-btn" onClick={doSearch}>Найти</button>
        </div>
        <div className="cat-row">
          {[['all', 'Все'], ['eda', '🍕 Еда'], ['odezhda', '👗 Одежда'], ['elektronika', '📱 Электроника'], ['travel', '✈️ Путешествия'], ['krasota', '💄 Красота']].map(([k, label]) => (
            <span
              key={k}
              className={`cat-chip ${activeCat === k ? 'active' : ''}`}
              onClick={() => handleCatFilter(k)}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="main-tabs">
        <button className={`main-tab ${activeTab === 'all' ? 'active' : ''}`} id="tabAll" onClick={() => switchTab('all')}>
          🗂 Все промокоды
        </button>
        <button className={`main-tab ${activeTab === 'promo' ? 'active' : ''}`} id="tabPromo" onClick={() => switchTab('promo')}>
          🎟 Мои промокоды <span className="tab-badge" id="badgePromo" style={{ display: 'none' }}></span>
        </button>
        <button className={`main-tab ${activeTab === 'receipts' ? 'active' : ''}`} id="tabReceipts" onClick={() => switchTab('receipts')}>
          ❤️ Избранное <span className="tab-badge"></span>
        </button>
      </div>

      {/* ВКЛАДКА: ВСЕ ПРОМОКОДЫ */}
      <div id="panelAll" style={{ display: activeTab === 'all' ? 'block' : 'none' }}>
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, opacity: 0.4 }}>🔍</span>
          <input
            ref={partnerSearchRef}
            className="search-input"
            id="partnerSearch"
            type="text"
            placeholder="Поиск по магазину..."
            onInput={(e) => filterPartners(e.target.value)}
            style={{ paddingLeft: 44 }}
          />
        </div>

        <div className="alpha-nav" id="alphNav"></div>

        <div id="partnerList"></div>

        <div id="partnerPromos" style={{ display: 'none' }}>
          <button onClick={backToPartners} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', marginBottom: 20, padding: 0 }}>
            ← Все магазины
          </button>
          <div className="section-head">
            <div className="section-title" id="partnerTitle"></div>
          </div>
          <div className="promo-grid" id="partnerPromoGrid"></div>
        </div>
      </div>

      {/* ВКЛАДКА: МОИ ПРОМОКОДЫ */}
      <div id="panelPromo" style={{ display: activeTab === 'promo' ? 'block' : 'none' }}>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, opacity: 0.4 }}>🔍</span>
          <input className="search-input" type="text" placeholder="Поиск по магазину..." style={{ paddingLeft: 44 }} onInput={(e) => filterMyPromo(e.target.value)} />
        </div>

        <div id="myPromoEmpty" className="empty-state" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎟</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Промокодов пока нет</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>Нажмите «Скопировать» на любом промокоде — он появится здесь.</div>
          <a href="#" onClick={(e) => { e.preventDefault(); switchTab('all'); setTimeout(() => scrollToEl(document.getElementById('panelAll')), 80); }} style={{ display: 'inline-block', background: 'var(--gold)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>Перейти к каталогу →</a>
        </div>

        <div id="myPromoList" style={{ display: 'none' }}>
          <div className="section-head">
            <div className="section-title">Скопированные <em>промокоды</em></div>
          </div>
          <div className="promo-grid" id="myPromoItems"></div>
        </div>
      </div>

      {/* ВКЛАДКА: ИЗБРАННОЕ */}
      <div id="panelReceipts" style={{ display: activeTab === 'receipts' ? 'block' : 'none' }}>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, opacity: 0.4 }}>🔍</span>
          <input className="search-input" id="favSearch" type="text" placeholder="Поиск по магазину..." style={{ paddingLeft: 44 }} onInput={(e) => filterFavorites(e.target.value)} />
        </div>
        <div id="favContent"></div>
      </div>

      {/* ПАНЕЛЬ: МОИ ЧЕКИ */}
      <div id="panelChecks" style={{ display: activeTab === 'checks' ? 'block' : 'none' }}>
        <div className="section-head">
          <div className="section-title">Кассовые <em>чеки</em></div>
        </div>

        {monthsView === 'list' ? (
          <div id="checksMonths">
            <div className="months-grid">
              <div className="month-card" onClick={() => handleMonthClick('may2026')}>
                <div className="month-name">Май 2026</div>
                <div className="month-count">6 чеков</div>
                <div className="month-sum">210 ₽</div>
              </div>
              <div className="month-card" onClick={() => handleMonthClick('apr2026')}>
                <div className="month-name">Апрель 2026</div>
                <div className="month-count">30 чеков</div>
                <div className="month-sum">1 050 ₽</div>
              </div>
              <div className="month-card" onClick={() => handleMonthClick('mar2026')}>
                <div className="month-name">Март 2026</div>
                <div className="month-count">31 чек</div>
                <div className="month-sum">1 085 ₽</div>
              </div>
            </div>
          </div>
        ) : (
          <div id="checksDetail">
            <button onClick={() => setMonthsView('list')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', marginBottom: 20, padding: 0 }}>
              ← Все периоды
            </button>
            <div className="section-title" style={{ marginBottom: 16, fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600 }}>{monthData?.title}</div>
            <div className="receipts-list">
              {monthData?.items.map((r, i) => (
                <div key={i} className="receipt-item">
                  <div className="receipt-date">
                    <div className="receipt-date-main">{r.date}</div>
                    <div className="receipt-date-time">{r.time}</div>
                  </div>
                  <div className="receipt-amount">{r.sum}</div>
                  <div className="receipt-fiscal">
                    <div className="receipt-fiscal-row">Фискальный признак: <span>{r.fiscal}</span></div>
                    <div className="receipt-fiscal-row">Номер ККТ: <span>{r.kkt}</span></div>
                  </div>
                  <a href="#" className="receipt-link" onClick={(e) => { e.preventDefault(); handleOpenReceipt(r); }}>Чек ОФД →</a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ПАНЕЛЬ: ПОДДЕРЖКА */}
      <div id="panelSupport" style={{ display: activeTab === 'support' ? 'block' : 'none' }}>
        <div className="page-title" style={{ marginBottom: 28 }}>Поддержка <em>и документы</em></div>

        <div className="section-head"><div className="section-title">Документы</div></div>
        <div className="docs-grid">
          <a href="#" className="doc-card" onClick={(e) => { e.preventDefault(); openModal('ofertaModal'); }}>
            <div className="doc-icon">📄</div>
            <div className="doc-name">Оферта</div>
            <div className="doc-arrow">→</div>
          </a>
          <a href="#" className="doc-card" onClick={(e) => { e.preventDefault(); openModal('privacyModal'); }}>
            <div className="doc-icon">🔒</div>
            <div className="doc-name">Политика конфиденциальности</div>
            <div className="doc-arrow">→</div>
          </a>
          <a href="#" className="doc-card" onClick={(e) => { e.preventDefault(); openModal('contactsModal'); }}>
            <div className="doc-icon">📞</div>
            <div className="doc-name">Контакты</div>
            <div className="doc-arrow">→</div>
          </a>
          <a href="#" className="doc-card" onClick={(e) => { e.preventDefault(); scrollToEl(document.getElementById('faqSection')); }}>
            <div className="doc-icon">❓</div>
            <div className="doc-name">Частые вопросы</div>
            <div className="doc-arrow">→</div>
          </a>
        </div>

        <FaqList />

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, marginTop: 36, boxShadow: 'var(--shadow-sm)' }}>
          <div className="section-title" style={{ marginBottom: 6 }}>Остались вопросы?</div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, fontWeight: 300 }}>Напишите нам — ответим в течение рабочего дня.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input className="modal-input" type="text" id="supportName" placeholder="Ваше имя" style={{ marginBottom: 0 }} />
            <input className="modal-input" type="email" id="supportEmail" placeholder="Email для ответа" style={{ marginBottom: 0 }} />
            <textarea className="modal-input" id="supportText" rows="5" placeholder="Опишите ваш вопрос подробно..." style={{ resize: 'vertical', marginBottom: 0 }}></textarea>
          </div>
          <button className="modal-btn gold" style={{ marginTop: 16 }} onClick={submitSupport}>Отправить</button>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.5 }}>
            Отправляя форму, вы соглашаетесь с <a href="#" onClick={(e) => { e.preventDefault(); openModal('privacyModal'); }} style={{ color: 'var(--gold)' }}>политикой конфиденциальности</a>.
          </p>
        </div>
      </div>
    </main>
  );
}

function FaqList() {
  const items = [
    ['Как отключить подписку?', 'Нажмите кнопку «Отключить сервис» в левом меню. Списания остановятся сразу. Доступ прекратится по окончании оплаченного периода.'],
    ['Как поменять метод оплаты?', 'В левом меню в разделе «Подписка» выберите нужный метод — баланс оператора, карта или СБП. Нажмите на кнопку «Изменить способ оплаты». Подтвердите владение картой/счётом. Изменение применится к следующему списанию.'],
    ['Почему промокод скрыт?', 'Полный код доступен только для активных подписчиков. Убедитесь что подписка активна, и нажмите «Показать» на карточке.'],
    ['Как восстановить пароль?', 'Нажмите «Забыл пароль» на странице входа. Введите email или номер телефона — придёт временный пароль. Войдите и смените его в разделе «Сменить пароль».'],
    ['Какие операторы поддерживаются?', 'Мегафон, Теле2 и билайн.'],
    ['Как часто обновляются промокоды?', 'Каждые несколько часов. На каждой карточке видно время последней проверки. Коды старше 6 часов временно скрываются до перепроверки.'],
  ];
  return (
    <>
      <div className="section-head" id="faqSection" style={{ marginTop: 36 }}><div className="section-title">Частые <em>вопросы</em></div></div>
      <div className="faq-list">
        {items.map(([q, a], i) => (
          <FaqItem key={i} q={q} a={a} />
        ))}
      </div>
    </>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
      <div className="faq-q">{q} <span className="faq-arrow">↓</span></div>
      <div className="faq-a">{a}</div>
    </div>
  );
}
