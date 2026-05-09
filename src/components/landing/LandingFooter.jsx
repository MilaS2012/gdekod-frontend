import { useNavigate } from 'react-router-dom';
import { isLoggedIn } from '../../utils/auth.js';

export default function LandingFooter({ openDocModal, openContactsModal, openFaqModal }) {
  const navigate = useNavigate();

  const handleFaq = (e) => {
    e.preventDefault();
    if (isLoggedIn()) {
      sessionStorage.setItem('gdekod_scroll', 'faqSection');
      navigate('/lk');
    } else {
      openFaqModal();
    }
  };

  return (
    <footer>
      <div className="footer-left">
        <a href="#" className="logo" style={{ fontSize: 18 }} onClick={(e) => e.preventDefault()}>
          <div className="logo-mark" style={{ width: 24, height: 24, fontSize: 11 }}>%</div>
          ГдеКод
        </a>
        <div className="footer-links">
          <a href="#" onClick={(e) => { e.preventDefault(); openDocModal('ofertaModal'); }}>Оферта</a>
          <a href="#" onClick={(e) => { e.preventDefault(); openDocModal('privacyModal'); }}>Политика конфиденциальности</a>
          <a href="#" onClick={handleFaq}>FAQ</a>
          <a href="#" onClick={(e) => { e.preventDefault(); openContactsModal(); }}>Контакты</a>
        </div>
      </div>
      <div className="footer-note">
        © 2026 · ООО «ЭЛУССО»
      </div>
    </footer>
  );
}
