import { useNavigate } from 'react-router-dom';
import { isLoggedIn } from '../../utils/auth.js';

const ITEMS = [
  { icon: '🗂', title: 'Мои промокоды', desc: 'История всех раскрытых кодов с датой, магазином и статусом. Скопировать повторно — в один клик.' },
  { icon: '💳', title: 'Подписка', desc: 'Тариф, способ оплаты, кассовые чеки. Кнопка «Отключить сервис» — всегда на виду.' },
  { icon: '❤️', title: 'Избранное', desc: 'Сохраняйте понравившиеся промокоды — они всегда под рукой. Один клик на сердечко в карточке.' },
  { icon: '💬', title: 'Поддержка', desc: 'История обращений и ответов. Вопрос по оплате, списанию или коду — всё здесь.' },
];

export default function LkPromo({ openPopup }) {
  const navigate = useNavigate();
  const handleClick = () => {
    if (isLoggedIn()) navigate('/lk');
    else openPopup();
  };
  return (
    <section style={{ padding: '80px 0', borderTop: '0.5px solid var(--border)' }} id="lk">
      <div className="section-inner">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="section-label" style={{ justifyContent: 'center' }}>Личный кабинет</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,4vw,46px)', fontWeight: 600, lineHeight: 1.1, marginBottom: 12 }}>
            Всё под рукой<br /><em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>В одном месте</em>
          </div>
          <p style={{ fontSize: 16, color: 'var(--text-mid)', fontWeight: 300, maxWidth: 460, margin: '0 auto' }}>После подключения открывается личный кабинет — история, подписка, настройки.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, maxWidth: 800, margin: '0 auto' }}>
          {ITEMS.map((it) => (
            <div
              key={it.title}
              style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 14, padding: 24, transition: 'all 0.2s', cursor: 'pointer' }}
              onClick={handleClick}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = 'rgba(224,168,56,0.3)')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
            >
              <div style={{ fontSize: 22, marginBottom: 12 }}>{it.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{it.title}</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
