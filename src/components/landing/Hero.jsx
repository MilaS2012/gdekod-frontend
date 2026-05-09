import { useNavigate } from 'react-router-dom';
import { isLoggedIn } from '../../utils/auth.js';

export default function Hero({ openPopup }) {
  const navigate = useNavigate();
  const handleSearch = () => {
    if (isLoggedIn()) navigate('/lk');
    else openPopup();
  };

  return (
    <section className="hero">
      <div className="hero-bg-circle c1"></div>
      <div className="hero-bg-circle c2"></div>
      <div className="hero-inner">
        <div className="hero-left">
          <div className="hero-label">
            <span className="dot"></span>
            Проверяем промокоды каждые несколько часов
          </div>
          <h1>Скидки, которые<br /><em>реально</em> работают</h1>
          <div className="hero-search-wrap">
            <span className="hero-search-icon">🔍</span>
            <input className="hero-search-input" type="text" placeholder="Найдите промокод: Wildberries, Lamoda, Ozon..." />
            <button className="hero-search-btn" onClick={handleSearch}>Найти</button>
          </div>
          <p className="hero-sub">
            База актуальных промокодов с датой последней проверки.
            Подписка 35 ₽/день или 499 ₽/мес — неограниченный доступ к каталогу промокодов.
          </p>
          <div className="hero-cta">
            <a href="#" className="btn-large" onClick={(e) => { e.preventDefault(); openPopup(); }}>Получить действующий промокод</a>
          </div>
        </div>
        <div className="hero-visual">
          <div className="float-card fc1">
            <div className="float-label">Проверено</div>
            <div className="float-val g">2 часа назад</div>
          </div>
          <div className="promo-card-hero">
            <div className="shop-row">
              <div className="shop-logo">🛒</div>
              <div className="shop-info">
                <div className="shop-name">Wildberries</div>
                <div className="shop-meta">Одежда и обувь</div>
              </div>
              <span className="verified-badge">Проверено</span>
            </div>
            <div className="discount-big">−500 ₽</div>
            <div className="discount-label">На заказ от 3 000 ₽ · Все категории · До 31 мая</div>
            <div className="code-row">
              <span className="partial-code" id="code-hero"></span>
              <div className="code-blur">
                <button className="unlock-btn" onClick={() => openPopup()}>Показать код</button>
              </div>
            </div>
            <div className="card-meta">
              <span>📅 Проверено 2 часа назад</span>
              <span>👁 847 раскрытий</span>
            </div>
          </div>
          <div className="float-card fc2">
            <div className="float-label">Новых сегодня</div>
            <div className="float-val a">+24 кода</div>
          </div>
        </div>
      </div>
    </section>
  );
}
