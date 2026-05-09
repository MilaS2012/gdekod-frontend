import { useNavigate } from 'react-router-dom';
import { setLoggedIn } from '../../utils/auth.js';

export default function DashNav() {
  const navigate = useNavigate();

  const scrollToProfile = () => {
    const el = document.getElementById('profileSection');
    if (!el) return;
    const navH = document.querySelector('nav')?.offsetHeight || 70;
    const top = el.getBoundingClientRect().top + window.scrollY - navH - 8;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const handleLogout = (e) => {
    e.preventDefault();
    setLoggedIn(false);
    navigate('/');
  };

  return (
    <nav>
      <a href="/" className="logo" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
        <div className="logo-mark">%</div>
        ГдеКод
      </a>
      <div className="nav-center" onClick={scrollToProfile} style={{ cursor: 'pointer' }}>Личный кабинет</div>
      <div className="nav-actions">
        <div className="sub-status"><span className="sub-dot"></span>Подписка активна</div>
        <div className="user-chip">
          <div className="user-avatar">👤</div>
          +7 (916) ···-··-42
        </div>
        <div className="nav-buttons-col">
          <a href="/" className="btn-ghost" style={{ color: 'var(--text-muted)' }} onClick={handleLogout}>Выйти</a>
        </div>
      </div>
    </nav>
  );
}
