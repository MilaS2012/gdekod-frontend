import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isLoggedIn } from '../../utils/auth.js';
import { renderPartialCode } from '../../utils/codes.js';

const CARDS = {
  eda: [
    { id: 'code-eda-1', shop: 'Яндекс Еда', cat: 'Доставка еды', domain: 'eda.yandex.ru', letter: 'E', disc: '−20%', desc: 'На первые 3 заказа в приложении', verified: '14 ч', expires: 'Действует сегодня', code: 'EDA20NEW' },
    { id: 'code-eda-2', shop: 'Delivery Club', cat: 'Доставка еды', domain: 'deliveryclub.ru', letter: 'D', disc: '−300 ₽', desc: 'На первый заказ от 800 ₽', verified: '3 ч', expires: 'Осталось 23 дн.', code: 'DC300FIR' },
    { id: 'code-eda-3', shop: 'Самокат', cat: 'Быстрая доставка', domain: 'samokat.ru', letter: 'S', disc: '−15%', desc: 'На первые 2 заказа', verified: '1 ч', expires: 'Осталось 39 дн.', code: 'SAM15OFF' },
  ],
  odezhda: [
    { id: 'code-1', shop: 'Lamoda', cat: 'Одежда и обувь', domain: 'lamoda.ru', letter: 'L', disc: '−15%', desc: 'На первый заказ · Без ограничений', verified: '5 ч', expires: 'Осталось 39 дн.', code: 'LAMODA15' },
    { id: 'code-wb-od', shop: 'Wildberries', cat: 'Маркетплейс', domain: 'wildberries.ru', letter: 'W', disc: '−500 ₽', desc: 'На заказ от 3 000 ₽', verified: '2 ч', expires: 'Осталось 24 дн.', code: 'WB500RUB' },
    { id: 'code-zara', shop: 'Zara', cat: 'Одежда', domain: 'zara.com', letter: 'Z', disc: '−10%', desc: 'На новую коллекцию от 5 000 ₽', verified: '6 ч', expires: 'Осталось 25 дн.', code: 'ZARA10SS' },
  ],
  elektronika: [
    { id: 'code-2', shop: 'М.Видео', cat: 'Электроника', domain: 'mvideo.ru', letter: 'M', disc: '−3 000 ₽', desc: 'На технику от 30 000 ₽', verified: '1 ч', expires: 'Осталось 13 дн.', code: 'MVIDEO3K' },
    { id: 'code-citi', shop: 'Ситилинк', cat: 'Электроника', domain: 'citilink.ru', letter: 'C', disc: '−5%', desc: 'На весь заказ от 10 000 ₽', verified: '4 ч', expires: 'Осталось 18 дн.', code: 'CITI5PCT' },
    { id: 'code-dns', shop: 'DNS', cat: 'Цифровая техника', domain: 'dns-shop.ru', letter: 'D', disc: '−2 000 ₽', desc: 'На ноутбуки от 50 000 ₽', verified: '8 ч', expires: 'Осталось 34 дн.', code: 'DNS2000N' },
  ],
  travel: [
    { id: 'code-avia', shop: 'Авиасейлс', cat: 'Авиабилеты', domain: 'aviasales.ru', letter: 'A', disc: '−500 ₽', desc: 'На первую покупку билетов', verified: '2 ч', expires: 'Осталось 24 дн.', code: 'AVIA500R' },
  ],
  krasota: [
    { id: 'code-gold', shop: 'Золотое Яблоко', cat: 'Косметика', domain: 'goldapple.ru', letter: 'G', disc: '−10%', desc: 'На первый заказ онлайн', verified: '3 ч', expires: 'Действует сегодня', code: 'GOLD10NW' },
  ],
};

const TABS = [
  { key: 'eda', icon: '🍕', name: 'Еда' },
  { key: 'odezhda', icon: '👗', name: 'Одежда' },
  { key: 'elektronika', icon: '📱', name: 'Электроника' },
  { key: 'travel', icon: '✈️', name: 'Путешествия' },
  { key: 'krasota', icon: '💄', name: 'Красота' },
];

export default function Catalog({ activeCat, setActiveCat, openPopup }) {
  const navigate = useNavigate();

  useEffect(() => {
    Object.values(CARDS).flat().forEach((c) => renderPartialCode(c.code, c.id));
    renderPartialCode('WB500RUB', 'code-hero');
  }, [activeCat]);

  const handleReveal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoggedIn()) navigate('/lk');
    else openPopup();
    return false;
  };

  const toggleHeart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const btn = e.currentTarget;
    const card = btn.closest('.promo-card');
    const isNowActive = !btn.classList.contains('active');
    btn.classList.toggle('active');
    btn.innerHTML = isNowActive ? '♥' : '♡';
    if (!isLoggedIn()) return false;

    const shop = card.querySelector('.card-shop-name')?.textContent?.trim() || '';
    const category = card.querySelector('.card-shop-cat')?.textContent?.trim() || '';
    const discount = card.querySelector('.card-discount')?.textContent?.trim() || '';
    const desc = card.querySelector('.card-desc')?.textContent?.trim() || '';
    const verified = card.querySelector('.verified-lbl')?.textContent?.trim() || '';
    const codeEl = card.querySelector('.partial-code');
    const code = codeEl?.dataset?.code || codeEl?.textContent?.replace(/\s/g, '') || '';

    let favs = [];
    try { favs = JSON.parse(localStorage.getItem('gdekod_favourites') || '[]'); } catch (er) {}
    if (isNowActive) {
      if (!favs.find((f) => f.shop === shop && f.discount === discount)) {
        favs.push({ shop, category, discount, desc, verified, code, savedAt: Date.now() });
        localStorage.setItem('gdekod_favourites', JSON.stringify(favs));
      }
    } else {
      favs = favs.filter((f) => !(f.shop === shop && f.discount === discount));
      localStorage.setItem('gdekod_favourites', JSON.stringify(favs));
    }
    return false;
  };

  const handleViewAll = (e) => {
    e.preventDefault();
    if (isLoggedIn()) navigate('/lk');
    else openPopup();
  };

  return (
    <section className="catalog-section" id="catalog">
      <div className="section-inner">
        <div className="catalog-header">
          <div>
            <div className="section-label">Каталог</div>
            <div className="catalog-title">Актуальные<br /><em>промокоды</em></div>
          </div>
          <a href="#" className="view-all" onClick={handleViewAll}>Все промокоды →</a>
        </div>

        <div className="cat-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`cat-tab ${activeCat === t.key ? 'active' : ''}`}
              onClick={() => setActiveCat(t.key)}
            >
              <span className="cat-tab-icon">{t.icon}</span> {t.name}
            </button>
          ))}
        </div>

        {TABS.map((t) => (
          <div
            key={t.key}
            className="catalog-grid cat-panel"
            id={`cat-${t.key}`}
            style={{ display: activeCat === t.key ? 'grid' : 'none' }}
          >
            {CARDS[t.key].map((c) => (
              <div className="promo-card" key={c.id}>
                <div className="card-top">
                  <div className="card-shop">
                    <div className="card-ico">
                      <img
                        src={`https://logo.clearbit.com/${c.domain}`}
                        width="32"
                        height="32"
                        style={{ borderRadius: 8, objectFit: 'contain' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex'; }}
                        alt=""
                      />
                      <div style={{ display: 'none', width: 32, height: 32, borderRadius: 8, background: '#C8A96E', color: '#fff', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, fontFamily: 'Arial,sans-serif', flexShrink: 0 }}>
                        {c.letter}
                      </div>
                    </div>
                    <div>
                      <div className="card-shop-name">{c.shop}</div>
                      <div className="card-shop-cat">{c.cat}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span className="status-pill">Проверено</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--gold)' }}>{c.expires}</span>
                  </div>
                </div>
                <div className="card-discount">{c.disc}</div>
                <div className="card-desc">{c.desc}</div>
                <div className="card-code-row">
                  <span className="partial-code" id={c.id}></span>
                  <button type="button" className="reveal-btn" onClick={handleReveal}>Показать</button>
                </div>
                <div className="card-footer">
                  <span className="verified-lbl">✓ Проверено {c.verified} назад</span>
                </div>
                <button type="button" className="card-heart" onClick={toggleHeart} title="В избранное">♡</button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
