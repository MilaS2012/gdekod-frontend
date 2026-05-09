import { useNavigate } from 'react-router-dom';
import { isLoggedIn } from '../../utils/auth.js';

export default function LandingNav({ openPopup, switchCat }) {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (isLoggedIn()) navigate('/lk');
    else openPopup();
  };

  const handleCat = (e, cat) => {
    e.preventDefault();
    switchCat(cat);
    setTimeout(() => {
      const el = document.getElementById('catalog');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  return (
    <nav>
      <a href="#" className="logo" onClick={(e) => e.preventDefault()}>
        <div className="logo-mark">%</div>
        ГдеКод
      </a>
      <div className="nav-links">
        <span className="nav-brand-prefix">Промокоды</span>
        <a href="#catalog" className="nav-link" onClick={(e) => handleCat(e, 'eda')}>🍕 Еда</a>
        <a href="#catalog" className="nav-link" onClick={(e) => handleCat(e, 'odezhda')}>👗 Одежда</a>
        <a href="#catalog" className="nav-link" onClick={(e) => handleCat(e, 'elektronika')}>📱 Электроника</a>
        <a href="#catalog" className="nav-link" onClick={(e) => handleCat(e, 'travel')}>✈️ Путешествия</a>
        <a href="#catalog" className="nav-link" onClick={(e) => handleCat(e, 'krasota')}>💄 Красота</a>
      </div>
      <div className="nav-actions">
        <a href="#" className="btn-ghost" onClick={handleLogin}>Войти</a>
        <a href="#" className="btn-primary" onClick={(e) => { e.preventDefault(); openPopup(); }}>Получить действующий промокод</a>
      </div>
    </nav>
  );
}
