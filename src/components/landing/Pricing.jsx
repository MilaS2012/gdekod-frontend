import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initPhoneInput } from '../../utils/phone.js';
import { setLoggedIn } from '../../utils/auth.js';

export default function Pricing({ openDocModal }) {
  const navigate = useNavigate();
  const [phoneErr, setPhoneErr] = useState(false);
  const [codeErr, setCodeErr] = useState(false);
  const phoneRef = useRef(null);
  const codeRef = useRef(null);

  useEffect(() => {
    if (phoneRef.current) initPhoneInput(phoneRef.current);
  }, []);

  const submitPhone = () => {
    const phone = phoneRef.current?.value.trim() || '';
    if (!phone || phone.length < 10) { setPhoneErr(true); return; }
    setPhoneErr(false);
    if (codeRef.current) codeRef.current.focus();
  };

  const submitCode = () => {
    const code = codeRef.current?.value.trim() || '';
    if (!code || code.length < 4) { setCodeErr(true); return; }
    setCodeErr(false);
    setLoggedIn(true);
    navigate('/lk');
  };

  return (
    <section className="pricing-section" id="pricing">
      <div className="section-inner">
        <div className="pricing-wrap">
          <div className="pricing-left">
            <div className="section-label">Подписка</div>
            <div className="pricing-title">Честная цена<br /><em>Проверенные промокоды</em></div>
            <p className="pricing-desc">
              Подписка активируется сразу после подключения сервиса.
              Неограниченный доступ ко всему каталогу промокодов пока подписка активна.
            </p>
            <ul className="features-list">
              <li><span className="feat-icon">✓</span> Неограниченный доступ ко всем промокодам в базе</li>
              <li><span className="feat-icon">✓</span> История раскрытых кодов в личном кабинете</li>
              <li><span className="feat-icon">✓</span> Оплата через оператора, карту или СБП</li>
              <li><span className="feat-icon">✓</span> Отключение в любой момент из личного кабинета</li>
            </ul>
          </div>
          <div>
            <div className="pricing-card">
              <div className="price-tag">
                <span className="price-amount">35</span><span className="price-per">₽/день</span>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400, marginTop: 2 }}>при оплате со счёта телефона</div>
                <div style={{ fontSize: 15, color: 'var(--text-muted)', fontWeight: 400, marginTop: 4 }}>или 499 ₽/мес при оплате картой · СБП</div>
              </div>

              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="popup-field-row">
                    <input
                      ref={phoneRef}
                      className="popup-input"
                      id="pricingPhone"
                      type="tel"
                      placeholder="+7 (___) ___-__-__"
                      style={{ flex: 1, width: 'auto', minWidth: 0, padding: '12px 14px', fontSize: 15, boxSizing: 'border-box', marginBottom: 0 }}
                    />
                    <button type="button" className="popup-inline-btn" onClick={submitPhone} style={{ flexShrink: 0, padding: '0 16px', fontSize: 14, borderRadius: 10, whiteSpace: 'nowrap' }}>Получить код</button>
                  </div>
                  <div className={`popup-error ${phoneErr ? 'show' : ''}`} id="pricingPhoneErr" style={{ fontSize: 12, display: phoneErr ? 'block' : 'none' }}>
                    Оператор не поддерживается. Попробуйте Мегафон, Теле2 или билайн.
                  </div>
                  <input
                    ref={codeRef}
                    className="popup-input"
                    id="pricingSmsCode"
                    type="text"
                    maxLength="4"
                    placeholder="Код из SMS"
                    inputMode="numeric"
                    style={{ width: '100%', padding: '12px 14px', fontSize: 15, boxSizing: 'border-box' }}
                  />
                  <div className={`popup-error ${codeErr ? 'show' : ''}`} id="pricingCodeErr" style={{ fontSize: 12, display: codeErr ? 'block' : 'none' }}>
                    Неверный код. Попробуйте ещё раз.
                  </div>
                </div>
                <button type="button" className="popup-btn gold" style={{ width: '100%', marginTop: 14, padding: 14 }} onClick={submitCode}>Подключить</button>
                <p className="pricing-disclaimer" style={{ marginTop: 10 }}>
                  Подписка 35 ₽/день (оператор), включая НДС.<br />
                  Нажимая «Подключить», вы соглашаетесь с <a href="#" onClick={(e) => { e.preventDefault(); openDocModal('ofertaModal'); }} style={{ color: 'var(--gold)' }}>офертой</a> и <a href="#" onClick={(e) => { e.preventDefault(); openDocModal('privacyModal'); }} style={{ color: 'var(--gold)' }}>политикой конфиденциальности</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
