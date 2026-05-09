import { useState, useEffect } from 'react';

export function DocModal({ id, title, icon, text, open, onClose }) {
  if (!open) return null;
  return (
    <div
      className="modal-overlay"
      id={id}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(28,22,10,0.45)', zIndex: 1000, alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
    >
      <div style={{ background: 'var(--surface)', borderRadius: 18, padding: 36, width: '100%', maxWidth: 500, margin: 24, position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'var(--surface-2)', border: 'none', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)' }}>✕</button>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, marginBottom: 20 }}>{title}</div>
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>{text}</div>
          <div style={{ fontSize: 13 }}>Документ будет добавлен до публичного запуска сервиса.</div>
        </div>
      </div>
    </div>
  );
}

export function FaqModal({ open, onClose }) {
  const [openIdx, setOpenIdx] = useState(null);
  if (!open) return null;
  const items = [
    ['Как поменять метод оплаты?', 'В личном кабинете в разделе «Подписка» выберите нужный метод — баланс оператора, карта или СБП. Нажмите «Изменить способ оплаты» и подтвердите. Изменение применится к следующему списанию.'],
    ['Почему промокод скрыт?', 'Полный код доступен только для активных подписчиков. Убедитесь что подписка активна, и нажмите «Показать» на карточке.'],
    ['Как восстановить пароль?', 'Нажмите «Забыл пароль» на странице входа. Введите email — придёт временный пароль. Войдите и смените его в разделе «Сменить пароль».'],
    ['Какие операторы поддерживаются?', 'Мегафон, Теле2 и билайн.'],
    ['Как часто обновляются промокоды?', 'Каждые несколько часов. На каждой карточке видна точная дата и время последней проверки.'],
  ];
  return (
    <div
      className="modal-overlay"
      id="faqModal"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(28,22,10,0.45)', zIndex: 1000, alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
    >
      <div style={{ background: 'var(--surface)', borderRadius: 18, padding: '36px 40px', width: '100%', maxWidth: 560, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 12px 40px rgba(28,22,10,0.12)', position: 'relative', margin: 24, animation: 'popIn 0.2s ease' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'var(--surface-2)', border: 'none', width: 28, height: 28, borderRadius: '50%', fontSize: 13, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, marginBottom: 24 }}>Частые <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>вопросы</em></div>
        <div className="faq-modal-list">
          {items.map(([q, a], i) => (
            <div key={i} className={`faq-modal-item ${openIdx === i ? 'open' : ''}`} onClick={() => setOpenIdx(openIdx === i ? null : i)}>
              <div className="faq-modal-q">{q} <span>↓</span></div>
              <div className="faq-modal-a">{a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ContactsModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div
      id="contactsModal"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(28,22,10,0.45)', zIndex: 1000, alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
    >
      <div style={{ background: 'var(--surface)', borderRadius: 18, padding: 36, width: '100%', maxWidth: 420, margin: 24, position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', animation: 'popIn 0.22s ease' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'var(--surface-2)', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, marginBottom: 20 }}>Контакты</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>Email</div>
            <a href="mailto:support@gde-code.ru" style={{ fontSize: 16, fontWeight: 500, color: 'var(--gold)', textDecoration: 'none' }}>support@gde-code.ru</a>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>Телефон</div>
            <a href="tel:+79294048888" style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', textDecoration: 'none' }}>+7 929 404 88 88</a>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>Режим работы</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Пн–Пт, 10:00–18:00 (МСК)</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Сб, Вс — выходной</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>Адрес</div>
            <div style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.6 }}>143006, Московская обл, г. Одинцово,<br />ул. Верхне-Пролетарская, д. 7, кв. 112</div>
          </div>
          <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
            ООО «ЭЛУССО» · ИНН 5032325868 · ОГРН 1215000018023
          </div>
        </div>
      </div>
    </div>
  );
}

export function CookieBanner({ openDocModal }) {
  const [show, setShow] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem('gdekod_cookie_consent')) setShow(true);
    } catch (e) {}
  }, []);

  const close = (kind) => {
    try { localStorage.setItem('gdekod_cookie_consent', kind); } catch (e) {}
    setHiding(true);
    setTimeout(() => setShow(false), 260);
  };

  if (!show) return null;
  return (
    <div id="cookieBanner" className={hiding ? 'hide' : ''} style={{ display: 'flex' }}>
      <div className="cookie-text">
        🍪 Мы используем cookies для корректной работы сайта и улучшения вашего опыта.
        Продолжая использование сайта, вы соглашаетесь с нашей{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); openDocModal('privacyModal'); }}>политикой конфиденциальности</a>.
      </div>
      <div className="cookie-actions">
        <button className="cookie-btn-decline" onClick={() => close('necessary')}>Только необходимые</button>
        <button className="cookie-btn-accept" onClick={() => close('accepted')}>Принять</button>
      </div>
    </div>
  );
}
