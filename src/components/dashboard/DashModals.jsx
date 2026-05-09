import { useState, useEffect, useRef } from 'react';
import { initPhoneInput } from '../../utils/phone.js';

export function ModalShell({ id, open, onClose, children, modalStyle }) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && open) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div
      className={`modal-overlay ${open ? 'open' : ''}`}
      id={id}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" style={modalStyle}>
        <button className="modal-close" onClick={onClose}>✕</button>
        {children}
      </div>
    </div>
  );
}

export function PasswordModal({ open, onClose }) {
  const [step, setStep] = useState(1);
  const refs = {
    old: useRef(null), n1: useRef(null), n2: useRef(null),
    email: useRef(null), code: useRef(null), rn1: useRef(null), rn2: useRef(null),
  };
  const [resetEmail, setResetEmail] = useState('');

  useEffect(() => { if (open) setStep(1); }, [open]);

  const savePassword = () => {
    const o = refs.old.current.value, n = refs.n1.current.value, n2 = refs.n2.current.value;
    if (!o || !n || !n2) return alert('Заполните все поля');
    if (n !== n2) return alert('Новые пароли не совпадают');
    setStep(5);
  };
  const sendResetCode = () => {
    const email = refs.email.current.value.trim();
    if (!email) return;
    setResetEmail(email);
    setStep(3);
  };
  const verifyResetCode = () => {
    const code = refs.code.current.value.trim();
    if (!code || code.length < 4) return;
    setStep(4);
  };
  const saveNewPassword = () => {
    const p1 = refs.rn1.current.value, p2 = refs.rn2.current.value;
    if (!p1 || p1 !== p2) { alert('Пароли не совпадают'); return; }
    setStep(5);
  };

  return (
    <ModalShell id="passwordModal" open={open} onClose={onClose}>
      {step === 1 && (
        <>
          <div className="modal-title">Сменить пароль</div>
          <input ref={refs.old} className="modal-input" type="password" placeholder="Старый пароль" id="oldPass" />
          <input ref={refs.n1} className="modal-input" type="password" placeholder="Новый пароль" id="newPass" />
          <input ref={refs.n2} className="modal-input" type="password" placeholder="Повторите новый пароль" id="newPass2" />
          <button className="modal-btn gold" onClick={savePassword}>Сохранить</button>
          <p className="modal-note">Забыли пароль? <a href="#" onClick={(e) => { e.preventDefault(); setStep(2); }}>Сбросить через email</a></p>
        </>
      )}
      {step === 2 && (
        <>
          <div className="modal-title">Сброс пароля</div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, fontWeight: 300 }}>Введите email — пришлём код подтверждения.</p>
          <input ref={refs.email} className="modal-input" type="email" placeholder="Ваш email" id="resetEmail" />
          <button className="modal-btn gold" onClick={sendResetCode}>Отправить код</button>
          <p className="modal-note"><a href="#" onClick={(e) => { e.preventDefault(); setStep(1); }}>← Назад</a></p>
        </>
      )}
      {step === 3 && (
        <>
          <div className="modal-title">Код подтверждения</div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, fontWeight: 300 }}>Введите код из письма на <span style={{ color: 'var(--text)', fontWeight: 500 }}>{resetEmail}</span></p>
          <input ref={refs.code} className="modal-input" type="text" placeholder="Код из email" id="resetCode" maxLength="6" inputMode="numeric" />
          <button className="modal-btn gold" onClick={verifyResetCode}>Подтвердить</button>
          <p className="modal-note"><a href="#" onClick={(e) => { e.preventDefault(); setStep(2); }}>← Назад</a></p>
        </>
      )}
      {step === 4 && (
        <>
          <div className="modal-title">Новый пароль</div>
          <input ref={refs.rn1} className="modal-input" type="password" placeholder="Новый пароль" id="resetNewPass" />
          <input ref={refs.rn2} className="modal-input" type="password" placeholder="Повторите пароль" id="resetNewPass2" />
          <button className="modal-btn gold" onClick={saveNewPassword}>Сохранить</button>
        </>
      )}
      {step === 5 && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div className="modal-title" style={{ fontSize: 22 }}>Пароль изменён</div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>Используйте новый пароль при следующем входе.</p>
          <button className="modal-btn gold" onClick={onClose}>Готово</button>
        </div>
      )}
    </ModalShell>
  );
}

export function CancelModal({ open, onClose }) {
  const handleCancel = () => {
    const accessUntil = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem('gdekod_sub_status', 'cancelled');
    localStorage.setItem('gdekod_access_until', accessUntil.toString());
    localStorage.setItem('gdekod_cancelled_at', Date.now().toString());
    onClose();

    const date = new Date(accessUntil).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    if (!document.getElementById('accessExpiryBanner')) {
      const banner = document.createElement('div');
      banner.id = 'accessExpiryBanner';
      banner.style.cssText = 'background:#FFF3CD;border:1px solid #F0C040;border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#7a5c00;display:flex;align-items:center;gap:10px;';
      banner.innerHTML = `<span style="font-size:18px;">⚠️</span> Подписка отключена. Доступ к промокодам сохраняется до <strong>${date}</strong>. После этой даты история и поиск будут недоступны.`;
      const main = document.querySelector('.main-content');
      if (main) main.prepend(banner);
    }
    const dot = document.querySelector('.sub-dot');
    const statusEl = document.querySelector('.sub-status');
    if (dot) dot.style.background = '#F0A020';
    if (statusEl) statusEl.innerHTML = '<span class="sub-dot" style="background:#F0A020"></span>Подписка отменена';
  };

  return (
    <ModalShell id="cancelModal" open={open} onClose={onClose}>
      <div className="modal-title">Отключить сервис</div>
      <div className="modal-warn">
        После отключения сервиса, списания остановятся сразу. Доступ к промокодам останется до окончания оплаченного периода.
      </div>
      <button className="modal-btn ghost" style={{ border: '1.5px solid var(--red)', color: 'var(--red)', marginTop: 6 }} onClick={handleCancel}>Да, отключить</button>
      <button className="modal-btn" style={{ background: 'var(--green)', color: '#fff', marginTop: 8 }} onClick={onClose}>Отмена</button>
    </ModalShell>
  );
}

export function PayOperatorModal({ open, onClose }) {
  const phoneRef = useRef(null);
  const codeRef = useRef(null);
  const [showCode, setShowCode] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [phoneErr, setPhoneErr] = useState(false);

  useEffect(() => {
    if (open) {
      setTimeout(() => phoneRef.current && initPhoneInput(phoneRef.current), 100);
    } else {
      setShowCode(false); setShowConfirm(false); setPhoneErr(false);
      if (phoneRef.current) phoneRef.current.value = '';
      if (codeRef.current) codeRef.current.value = '';
    }
  }, [open]);

  const sendCode = () => {
    const phone = phoneRef.current.value.trim();
    if (!phone || phone.length < 10) { setPhoneErr(true); return; }
    setPhoneErr(false); setShowCode(true); setShowConfirm(true);
  };
  const confirm = () => {
    const code = codeRef.current.value.trim();
    if (!code || code.length < 4) return;
    onClose();
    alert('Метод оплаты изменён на баланс оператора');
  };

  return (
    <ModalShell id="payOperatorModal" open={open} onClose={onClose}>
      <div className="modal-title">Оплата через оператора</div>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, fontWeight: 300 }}>35 ₽/день · Мегафон, Теле2, билайн. Введите номер телефона для подтверждения.</p>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: 8, marginBottom: 10 }}>
        <input ref={phoneRef} className="modal-input" type="tel" placeholder="+7 (___) ___-__-__" style={{ flex: 1, width: 'auto', minWidth: 0, marginBottom: 0 }} />
        <button type="button" onClick={sendCode} style={{ flexShrink: 0, background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 8, padding: '0 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>Получить код</button>
      </div>
      <div className="popup-error" style={{ fontSize: 12, marginBottom: 8, display: phoneErr ? 'block' : 'none' }}>Оператор не поддерживается. Попробуйте Мегафон, Теле2 или билайн.</div>
      <input ref={codeRef} className="modal-input" type="text" maxLength="4" placeholder="Код из SMS" inputMode="numeric" style={{ display: showCode ? 'block' : 'none' }} />
      <button className="modal-btn gold" onClick={confirm} style={{ display: showConfirm ? 'block' : 'none' }}>Подключить</button>
    </ModalShell>
  );
}

export function PayCardModal({ open, onClose }) {
  return (
    <ModalShell id="payCardModal" open={open} onClose={onClose}>
      <div className="modal-title">Оплата картой</div>
      <p style={{ fontSize: 15, color: 'var(--text)', marginBottom: 24, fontWeight: 400 }}>499 ₽/мес списываются сразу. Сервис подключится сразу после успешной оплаты.</p>
      <div style={{ background: 'var(--gold-dim)', border: '1px solid var(--border-gold)', borderRadius: 14, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>💳</div>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>Visa, Mastercard, Мир</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Безопасная оплата через CloudPayments</div>
      </div>
      <button className="modal-btn gold" onClick={() => alert('CloudPayments виджет откроется здесь после подключения бэкенда')} style={{ marginTop: 16 }}>Оплатить 499 ₽</button>
      <p className="modal-note" style={{ marginTop: 8, textAlign: 'center' }}>Нажимая «Оплатить», вы соглашаетесь с офертой и политикой конфиденциальности.</p>
    </ModalShell>
  );
}

export function PaySbpModal({ open, onClose }) {
  return (
    <ModalShell id="paySbpModal" open={open} onClose={onClose}>
      <div className="modal-title">Оплата через СБП</div>
      <p style={{ fontSize: 15, color: 'var(--text)', marginBottom: 24, fontWeight: 400 }}>499 ₽/мес списываются сразу. Сервис подключится сразу после успешной оплаты.</p>
      <div style={{ background: 'var(--gold-dim)', border: '1px solid var(--border-gold)', borderRadius: 14, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>⚡</div>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>Система быстрых платежей</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Оплата через приложение вашего банка</div>
      </div>
      <button className="modal-btn gold" onClick={() => alert('CloudPayments виджет откроется здесь после подключения бэкенда')} style={{ marginTop: 16 }}>Оплатить 499 ₽</button>
      <p className="modal-note" style={{ marginTop: 8, textAlign: 'center' }}>Нажимая «Оплатить», вы соглашаетесь с офертой и политикой конфиденциальности.</p>
    </ModalShell>
  );
}

export function ContactsModalDash({ open, onClose }) {
  return (
    <ModalShell id="contactsModal" open={open} onClose={onClose}>
      <div className="modal-title">Контакты</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 8 }}>
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
          <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>Пн–Пт, 10:00–18:00 (МСК)</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Сб, Вс — выходной</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>Адрес</div>
          <div style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.6 }}>143006, Московская обл, г. Одинцово,<br />ул. Верхне-Пролетарская, д. 7, кв. 112</div>
        </div>
        <div style={{ paddingTop: 8, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
          ООО «ЭЛУССО» · ИНН 5032325868 · ОГРН 1215000018023
        </div>
      </div>
    </ModalShell>
  );
}

export function OfertaModal({ open, onClose }) {
  return (
    <ModalShell id="ofertaModal" open={open} onClose={onClose} modalStyle={{ maxWidth: 560, maxHeight: '80vh', overflowY: 'auto' }}>
      <div className="modal-title">Оферта</div>
      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>Текст оферты появится здесь</div>
        <div style={{ fontSize: 13 }}>Документ будет добавлен до публичного запуска сервиса.</div>
      </div>
    </ModalShell>
  );
}

export function PrivacyModal({ open, onClose }) {
  return (
    <ModalShell id="privacyModal" open={open} onClose={onClose} modalStyle={{ maxWidth: 560, maxHeight: '80vh', overflowY: 'auto' }}>
      <div className="modal-title">Политика конфиденциальности</div>
      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>Политика конфиденциальности появится здесь</div>
        <div style={{ fontSize: 13 }}>Документ будет добавлен до публичного запуска сервиса.</div>
      </div>
    </ModalShell>
  );
}

export function ReceiptModal({ open, onClose }) {
  return (
    <ModalShell id="receiptModal" open={open} onClose={onClose} modalStyle={{ maxWidth: 420 }}>
      <div className="modal-title">Кассовый чек</div>
      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>ООО «ЭЛУССО»</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>ИНН 5032325868</span>
        </div>
        <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 12 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Дата и время</div>
          <div style={{ fontSize: 15, fontWeight: 500 }} id="ofdDate">—</div>
        </div>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Сумма</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }} id="ofdSum">—</div>
        </div>
        <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Фискальный признак</div>
            <div style={{ fontSize: 13, fontWeight: 500, letterSpacing: 0.5 }} id="ofdFiscal">—</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Номер ККТ</div>
            <div style={{ fontSize: 13, fontWeight: 500, letterSpacing: 0.5 }} id="ofdKkt">—</div>
          </div>
        </div>
        <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Проверить чек на сайте ФНС</div>
          <a href="https://check.nalog.ru" target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: 'var(--gold)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>Открыть на ОФД →</a>
        </div>
      </div>
    </ModalShell>
  );
}
