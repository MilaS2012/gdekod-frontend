import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { initPhoneInput } from '../../utils/phone.js';
import { setLoggedIn } from '../../utils/auth.js';

const MTS_PREFIXES = ['910','911','912','913','914','915','916','917','918','919',
  '980','981','982','983','984','985','986','987','988','989','900','901','902',
  '903','904','905','906','908'];

export default function AuthPopup({ open, onClose, openDocModal }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('register');
  const [lstep, setLstep] = useState('lstep1');
  const [pstep, setPstep] = useState('pstep1');
  const [loginMethod, setLoginMethod] = useState('phone');
  const [forgotMethod, setForgotMethod] = useState('phone');

  const [phoneErr, setPhoneErr] = useState('');
  const [codeErr, setCodeErr] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [forgotErr, setForgotErr] = useState('');

  const [showLoginSms, setShowLoginSms] = useState(false);
  const [loginSecs, setLoginSecs] = useState(0);
  const [popupSecs, setPopupSecs] = useState(0);
  const [popupTimerActive, setPopupTimerActive] = useState(false);

  const [confirmText, setConfirmText] = useState('Подключить');
  const [confirmDisabled, setConfirmDisabled] = useState(false);

  const [showPass, setShowPass] = useState(false);

  const popupPhoneRef = useRef(null);
  const smsCodeRef = useRef(null);
  const loginPhoneRef = useRef(null);
  const loginSmsRef = useRef(null);
  const loginEmailRef = useRef(null);
  const loginPassRef = useRef(null);
  const forgotPhoneRef = useRef(null);
  const forgotEmailRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      [popupPhoneRef, loginPhoneRef, forgotPhoneRef].forEach((r) => {
        if (r.current) initPhoneInput(r.current);
      });
      if (popupPhoneRef.current) {
        popupPhoneRef.current.focus();
        if (!popupPhoneRef.current.value) popupPhoneRef.current.value = '+7 ';
      }
    }, 150);
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && open) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!popupTimerActive) return;
    if (popupSecs <= 0) { setPopupTimerActive(false); return; }
    const id = setTimeout(() => setPopupSecs((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [popupTimerActive, popupSecs]);

  useEffect(() => {
    if (loginSecs <= 0) return;
    const id = setTimeout(() => setLoginSecs((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [loginSecs]);

  const reset = () => {
    setTab('register');
    setLstep('lstep1');
    setPstep('pstep1');
    setLoginMethod('phone');
    setForgotMethod('phone');
    setPhoneErr(''); setCodeErr(''); setLoginErr(''); setForgotErr('');
    setShowLoginSms(false);
    setLoginSecs(0);
    setPopupSecs(0); setPopupTimerActive(false);
    setConfirmText('Подключить'); setConfirmDisabled(false);
    [popupPhoneRef, smsCodeRef, loginPhoneRef, loginEmailRef, loginPassRef, forgotPhoneRef, forgotEmailRef, loginSmsRef].forEach((r) => {
      if (r.current) r.current.value = '';
    });
  };

  const handleClose = () => { reset(); onClose(); };

  const popupSubmitPhone = () => {
    const phone = popupPhoneRef.current.value;
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 11) { setPhoneErr('Введите корректный номер.'); return; }
    const prefix = digits.slice(1, 4);
    if (MTS_PREFIXES.includes(prefix)) {
      setPhoneErr('Оператор не поддерживается. Попробуйте Мегафон, Теле2 или билайн.');
      return;
    }
    setPhoneErr('');
    smsCodeRef.current?.focus();
    setPopupSecs(60);
    setPopupTimerActive(true);
  };

  const popupSubmitCode = () => {
    const phone = popupPhoneRef.current.value;
    const code = smsCodeRef.current.value.trim();
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 11) { setPhoneErr('Введите номер телефона.'); return; }
    if (code.length < 4) { setCodeErr('Неверный код. Попробуйте ещё раз.'); return; }

    setConfirmDisabled(true); setConfirmText('Проверяем...');
    setTimeout(() => {
      setPopupTimerActive(false);
      setPstep('pstep3');
      setLoggedIn(true);
    }, 1000);
  };

  const loginSendCode = () => {
    const phone = loginPhoneRef.current.value.trim();
    if (!phone || phone.replace(/\D/g, '').length < 11) { setLoginErr('Введите номер телефона.'); return; }
    setLoginErr('');
    setShowLoginSms(true);
    setLoginSecs(60);
    setTimeout(() => loginSmsRef.current?.focus(), 30);
  };

  const submitLogin = () => {
    setLoginErr('');
    if (loginMethod === 'phone') {
      const phone = loginPhoneRef.current.value.trim();
      const code = loginSmsRef.current?.value.trim() || '';
      if (!phone || phone.replace(/\D/g, '').length < 11) { setLoginErr('Введите номер телефона.'); return; }
      if (!code || code.length < 4) { setLoginErr('Введите код из SMS.'); return; }
    } else {
      const email = loginEmailRef.current.value.trim();
      const pass = loginPassRef.current.value;
      if (!email) { setLoginErr('Введите email.'); return; }
      if (!pass) { setLoginErr('Введите пароль.'); return; }
    }
    setTimeout(() => {
      setLoggedIn(true);
      handleClose();
      navigate('/lk');
    }, 800);
  };

  const submitForgot = () => {
    const contact = forgotMethod === 'phone'
      ? forgotPhoneRef.current.value.trim()
      : forgotEmailRef.current.value.trim();
    if (!contact) {
      setForgotErr(forgotMethod === 'phone' ? 'Введите номер телефона.' : 'Введите email.');
      return;
    }
    setForgotErr('');
    setTimeout(() => setLstep('lstep3'), 800);
  };

  const onPopupPhoneInput = (e) => {
    setPhoneErr('');
  };

  if (!open) return null;

  return (
    <div className="popup-overlay open" id="verifyOverlay" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="popup" id="verifyPopup">
        <button className="popup-close" onClick={handleClose}>✕</button>

        <div className="popup-tabs">
          <button className={`popup-tab ${tab === 'login' ? 'active' : ''}`} id="tabLogin" onClick={() => setTab('login')}>Войти</button>
          <button className={`popup-tab ${tab === 'register' ? 'active' : ''}`} id="tabRegister" onClick={() => setTab('register')}>Подключить</button>
        </div>

        {/* ПАНЕЛЬ: Вход */}
        <div className={`popup-panel ${tab === 'login' ? 'active' : ''}`} id="panelLogin">
          <div className={`popup-step ${lstep === 'lstep1' ? 'active' : ''}`} id="lstep1">
            <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 10, padding: 3, gap: 3, marginBottom: 20 }}>
              <button onClick={() => setLoginMethod('phone')} style={{ flex: 1, padding: 8, border: 'none', borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: loginMethod === 'phone' ? 'var(--text)' : 'transparent', color: loginMethod === 'phone' ? '#fff' : 'var(--text-muted)', transition: 'all 0.15s' }}>По номеру</button>
              <button onClick={() => setLoginMethod('email')} style={{ flex: 1, padding: 8, border: 'none', borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: loginMethod === 'email' ? 'var(--text)' : 'transparent', color: loginMethod === 'email' ? '#fff' : 'var(--text-muted)', transition: 'all 0.15s' }}>По email</button>
            </div>

            <div id="loginByPhone" style={{ display: loginMethod === 'phone' ? 'block' : 'none' }}>
              <div className="popup-field-row" style={{ marginBottom: 10 }}>
                <input ref={loginPhoneRef} className="popup-input" id="loginPhone" type="tel" placeholder="+7 (___) ___-__-__" style={{ flex: 1, width: 'auto', minWidth: 0, marginBottom: 0 }} />
                <button type="button" className="popup-inline-btn" onClick={loginSendCode} style={{ flexShrink: 0, padding: '0 16px', fontSize: 14, borderRadius: 10, whiteSpace: 'nowrap' }}>Получить код</button>
              </div>
              <input ref={loginSmsRef} className="popup-input" id="loginSmsCode" type="text" maxLength="4" placeholder="Код из SMS" inputMode="numeric" style={{ display: showLoginSms ? 'block' : 'none' }} />
              <div className="sms-timer" id="loginTimer" style={{ display: loginSecs > 0 ? 'block' : 'none' }}>
                Повторно через <span id="loginCountdown">{loginSecs}</span> с
              </div>
            </div>

            <div id="loginByEmail" style={{ display: loginMethod === 'email' ? 'block' : 'none' }}>
              <input ref={loginEmailRef} className="popup-input" id="loginEmail" type="email" placeholder="Email" style={{ width: '100%' }} />
              <div style={{ position: 'relative' }}>
                <input ref={loginPassRef} className="popup-input" id="loginPassword" type={showPass ? 'text' : 'password'} placeholder="Пароль" style={{ width: '100%', paddingRight: 80 }} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  {showPass ? 'Скрыть' : 'Показать'}
                </button>
              </div>
            </div>

            <div className={`popup-error ${loginErr ? 'show' : ''}`} id="loginErr">{loginErr}</div>
            <button className="popup-btn gold" style={{ marginTop: 4 }} onClick={submitLogin}>Войти</button>
            <p style={{ textAlign: 'center', marginTop: 14 }}>
              <button onClick={() => setLstep('lstep2')} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Забыл пароль?</button>
            </p>
          </div>

          <div className={`popup-step ${lstep === 'lstep2' ? 'active' : ''}`} id="lstep2">
            <button className="popup-back" onClick={() => setLstep('lstep1')}>← Назад</button>
            <div className="popup-title" style={{ fontSize: 24, marginBottom: 8 }}>Сброс пароля</div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16, fontWeight: 300 }}>Пришлём временный пароль — выберите способ.</p>

            <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 10, padding: 3, gap: 3, marginBottom: 16 }}>
              <button onClick={() => setForgotMethod('phone')} style={{ flex: 1, padding: 8, border: 'none', borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: forgotMethod === 'phone' ? 'var(--text)' : 'transparent', color: forgotMethod === 'phone' ? '#fff' : 'var(--text-muted)' }}>По номеру</button>
              <button onClick={() => setForgotMethod('email')} style={{ flex: 1, padding: 8, border: 'none', borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: forgotMethod === 'email' ? 'var(--text)' : 'transparent', color: forgotMethod === 'email' ? '#fff' : 'var(--text-muted)' }}>По email</button>
            </div>

            <div style={{ display: forgotMethod === 'phone' ? 'block' : 'none' }}>
              <input ref={forgotPhoneRef} className="popup-input" id="forgotPhone" type="tel" placeholder="+7 (___) ___-__-__" style={{ width: '100%' }} />
            </div>
            <div style={{ display: forgotMethod === 'email' ? 'block' : 'none' }}>
              <input ref={forgotEmailRef} className="popup-input" id="forgotEmail" type="email" placeholder="Email" style={{ width: '100%' }} />
            </div>

            <div className={`popup-error ${forgotErr ? 'show' : ''}`} id="forgotErr">{forgotErr}</div>
            <button className="popup-btn gold" onClick={submitForgot}>Сбросить пароль</button>
          </div>

          <div className={`popup-step ${lstep === 'lstep3' ? 'active' : ''}`} id="lstep3">
            <div className="popup-success">
              <div className="popup-success-icon" style={{ fontSize: 40 }}>✉️</div>
              <h2>Временный пароль отправлен</h2>
              <p>Проверьте email или SMS. Войдите с временным паролем и смените его в личном кабинете.</p>
              <button className="popup-btn gold" onClick={() => { setLstep('lstep1'); setTab('login'); }}>Войти</button>
            </div>
          </div>
        </div>

        {/* ПАНЕЛЬ: Регистрация */}
        <div className={`popup-panel ${tab === 'register' ? 'active' : ''}`} id="panelRegister">
          <div className={`popup-step ${pstep === 'pstep1' ? 'active' : ''}`} id="pstep1">
            <div className="popup-title">Введите номер</div>

            <div className="popup-field-row" style={{ marginBottom: 10 }}>
              <input ref={popupPhoneRef} className="popup-input" id="popupPhone" type="tel" placeholder="+7 (___) ___-__-__" style={{ marginBottom: 0, flex: 1, minWidth: 0 }} onInput={onPopupPhoneInput} onKeyDown={(e) => { if (e.key === 'Enter') popupSubmitPhone(); }} />
              <button className="popup-inline-btn" onClick={popupSubmitPhone} style={{ flexShrink: 0, padding: '0 20px', fontSize: 14, borderRadius: 10 }}>Получить код</button>
            </div>
            <div className={`popup-error ${phoneErr ? 'show' : ''}`} id="popupPhoneErr">{phoneErr || 'Оператор не поддерживается. Попробуйте Мегафон, Теле2 или билайн.'}</div>

            <div className="popup-field-row" style={{ marginTop: 12 }}>
              <input ref={smsCodeRef} className="popup-input" id="smsCodeInput" type="text" maxLength="4" placeholder="Код из SMS" inputMode="numeric" />
            </div>
            <div className={`popup-error ${codeErr ? 'show' : ''}`} id="popupCodeErr">{codeErr || 'Неверный код. Попробуйте ещё раз.'}</div>
            <div className="sms-timer" id="popupTimer" style={{ display: popupTimerActive && popupSecs > 0 ? 'block' : 'none' }}>
              Повторно через <span id="popupCountdown">{popupSecs}</span> с
            </div>

            <button className="popup-btn gold" style={{ marginTop: 20 }} id="popupConfirmBtn" disabled={confirmDisabled} onClick={popupSubmitCode}>{confirmText}</button>

            <p className="popup-fine">
              Подписка 35 ₽/день (оператор), включая НДС.<br />
              Нажимая «Подключить», вы соглашаетесь с <a href="#" onClick={(e) => { e.preventDefault(); openDocModal('ofertaModal'); }} style={{ color: 'var(--gold)' }}>офертой</a> и <a href="#" onClick={(e) => { e.preventDefault(); openDocModal('privacyModal'); }} style={{ color: 'var(--gold)' }}>политикой конфиденциальности</a>.
            </p>
          </div>

          <div className={`popup-step ${pstep === 'pstep3' ? 'active' : ''}`} id="pstep3">
            <div className="popup-success">
              <div className="popup-success-icon">✓</div>
              <h2>Добро пожаловать!</h2>
              <p>Номер подтверждён. Доступ к промокодам открыт. Временный пароль отправлен в SMS.</p>
              <button className="popup-btn green" onClick={() => navigate('/lk')}>Смотреть промокоды</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
