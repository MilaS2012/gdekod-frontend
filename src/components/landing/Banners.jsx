import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { isLoggedIn } from '../../utils/auth.js';

const BANNERS = [
  { name: 'Wildberries', bg: '#7B2D8B', letter: 'W', ad: true },
  { name: 'Lamoda', bg: '#1a1a1a', letter: 'L', ad: true },
  { name: 'Яндекс Еда', bg: '#FC3F1D', letter: 'Е', ad: true },
  { name: 'Авиасейлс', bg: '#01A4E4', letter: 'А', ad: false },
  { name: 'Золотое Яблоко', bg: '#BF1F2E', letter: 'З', ad: true },
  { name: 'Ozon', bg: '#005BFF', letter: 'O', ad: false },
  { name: 'М.Видео', bg: '#D62027', letter: 'М', ad: true },
  { name: 'Самокат', bg: '#E63946', letter: 'С', ad: false },
  { name: 'DNS', bg: '#1A1A2E', letter: 'D', ad: false },
  { name: 'AliExpress', bg: '#E62D10', letter: 'A', ad: true },
];

export default function Banners({ openPopup }) {
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const scrollBy = (dir) => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 520, behavior: 'smooth' });
  };

  const handleClick = (shopName) => {
    if (isLoggedIn()) {
      try { sessionStorage.setItem('gdekod_shop', shopName); } catch (e) {}
      navigate('/lk');
    } else {
      openPopup();
    }
  };

  return (
    <section className="banners-section">
      <div className="section-inner">
        <div className="banners-header">
          <div className="banners-title">Магазины со <em>скидками</em></div>
        </div>
        <div className="banners-scroll-wrap">
          <button className="banners-arrow left" onClick={() => scrollBy(-1)} aria-label="Назад">←</button>
          <div className="banners-scroll" id="bannersScroll" ref={scrollRef}>
            {BANNERS.map((b) => (
              <div className="banner-card" key={b.name} onClick={() => handleClick(b.name)}>
                <div className="banner-img" style={{ background: b.bg }}>
                  <div className="banner-img-placeholder">{b.letter}</div>
                  {b.ad && <span className="banner-ad">Реклама</span>}
                </div>
                <div className="banner-name">{b.name}</div>
              </div>
            ))}
          </div>
          <button className="banners-arrow right" onClick={() => scrollBy(1)} aria-label="Вперёд">→</button>
        </div>
      </div>
    </section>
  );
}
