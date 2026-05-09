import { useNavigate } from 'react-router-dom';
import { isLoggedIn } from '../../utils/auth.js';

const SHOPS = [
  { name: 'Wildberries', count: '12 промокодов', bg: '#7B2D8B', fg: '#fff', label: 'WB' },
  { name: 'AliExpress', count: '9 промокодов', bg: '#E62E04', fg: '#fff', label: 'Ali' },
  { name: 'Lamoda', count: '7 промокодов', bg: '#1a1a1a', fg: '#fff', label: 'La' },
  { name: 'М.Видео', count: '5 промокодов', bg: '#D62027', fg: '#fff', label: 'МВ' },
  { name: 'Ozon', count: '11 промокодов', bg: '#005BFF', fg: '#fff', label: 'Oz' },
  { name: 'Яндекс Еда', count: '4 промокода', bg: '#FC3F1D', fg: '#fff', label: 'ЯЕ' },
  { name: 'Золотое Яблоко', count: '6 промокодов', bg: '#BF1F2E', fg: '#fff', label: 'ЗЯ' },
  { name: 'Авиасейлс', count: '3 промокода', bg: '#01A4E4', fg: '#fff', label: 'AS' },
  { name: 'Яндекс Маркет', count: '8 промокодов', bg: '#FFCC00', fg: '#1a1a1a', label: 'ЯМ' },
];

export default function ShopsStrip({ openPopup }) {
  const navigate = useNavigate();

  const handleShop = (e, shopName) => {
    e.preventDefault();
    if (isLoggedIn()) {
      try { sessionStorage.setItem('gdekod_shop', shopName); } catch (e) {}
      navigate('/lk');
    } else {
      openPopup();
    }
    return false;
  };

  return (
    <div className="shops-strip">
      <div className="shops-strip-label">Популярные магазины</div>
      <div className="shops-strip-row">
        {SHOPS.map((s) => (
          <a key={s.name} href="#" className="shop-chip" onClick={(e) => handleShop(e, s.name)}>
            <div className="shop-chip-icon">
              <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, color: s.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'Arial,sans-serif', flexShrink: 0 }}>
                {s.label}
              </div>
            </div>
            <div>
              <div className="shop-chip-name">{s.name}</div>
              <div className="shop-chip-cnt">{s.count}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
