import { scrollToEl } from '../../utils/dashboard-logic.js';
import { useNavigate } from 'react-router-dom';

export default function DashFooter({ openModal, switchTab }) {
  const navigate = useNavigate();
  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)', padding: '32px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginTop: 40 }}>
      <div className="footer-left" style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <a href="/" className="logo" style={{ fontSize: 18 }} onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          <div className="logo-mark" style={{ width: 24, height: 24, fontSize: 11 }}>%</div>
          ГдеКод
        </a>
        <div className="footer-links" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); openModal('ofertaModal'); }} style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>Оферта</a>
          <a href="#" onClick={(e) => { e.preventDefault(); openModal('privacyModal'); }} style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>Политика конфиденциальности</a>
          <a href="#" onClick={(e) => { e.preventDefault(); switchTab('support'); setTimeout(() => scrollToEl(document.getElementById('faqSection')), 150); }} style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>FAQ</a>
        </div>
      </div>
      <div className="footer-note" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        © 2026 · ООО «ЭЛУССО» · ИНН 5032325868 · ОГРН 1215000018023 · <a href="mailto:support@gde-code.ru" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>support@gde-code.ru</a>
      </div>
    </footer>
  );
}
