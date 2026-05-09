import { useState } from 'react';

export default function Sidebar({ switchTab, scrollToEl, openModal }) {
  const [tariffValue, setTariffValue] = useState('35 ₽/день');
  const [activeMethod, setActiveMethod] = useState('operator');

  const selectPay = (method) => {
    setActiveMethod(method);
    if (method === 'operator') setTariffValue('35 ₽/день');
    else setTariffValue('499 ₽/мес');
  };

  const openPayModal = () => {
    if (activeMethod === 'operator') openModal('payOperatorModal');
    else if (activeMethod === 'card') openModal('payCardModal');
    else if (activeMethod === 'sbp') openModal('paySbpModal');
  };

  return (
    <aside className="sidebar" id="profileSection" style={{ scrollMarginTop: 80 }}>
      <div className="sidebar-card">
        <div className="profile-name">Мой профиль</div>
        <div className="profile-phone">+7 (916) ···-··-42</div>
        <div className="profile-email">user@email.com</div>
        <span className="profile-badge"><span className="sub-dot"></span>Подписка активна</span>
      </div>

      <div className="sidebar-card">
        <button className="sidebar-btn" onClick={() => { switchTab('checks'); setTimeout(() => scrollToEl(document.getElementById('panelChecks')), 80); }}>
          <span className="sidebar-btn-icon">🧾</span> Мои чеки
        </button>
        <button className="sidebar-btn" onClick={() => openModal('passwordModal')}>
          <span className="sidebar-btn-icon">🔑</span> Сменить пароль
        </button>
        <button className="sidebar-btn" onClick={() => { switchTab('support'); setTimeout(() => scrollToEl(document.getElementById('panelSupport')), 80); }}>
          <span className="sidebar-btn-icon">💬</span> Поддержка
        </button>
        <button className="sidebar-btn danger" onClick={() => openModal('cancelModal')}>
          <span className="sidebar-btn-icon">🚫</span> Отключить сервис
        </button>
      </div>

      <div className="sidebar-card">
        <div className="sub-card-title">Подписка</div>
        <div className="sub-row">
          <span className="sub-label">Тариф</span>
          <span className="sub-value gold" id="tariffValue">{tariffValue}</span>
        </div>
        <div className="sub-row">
          <span className="sub-label">Оператор</span>
          <span className="sub-value">Мегафон</span>
        </div>
        <hr className="divider-line" />
        <div className="sub-card-title">Метод оплаты</div>
        <div className="pay-methods">
          <div className={`pay-method ${activeMethod === 'operator' ? 'active' : ''}`} id="payOperator" onClick={() => selectPay('operator')}>
            <span>📱</span> Баланс оператора
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto', marginRight: 8 }}>35 ₽/день</div>
            <div className="pay-check"></div>
          </div>
          <div className={`pay-method ${activeMethod === 'card' ? 'active' : ''}`} id="payCard" onClick={() => selectPay('card')}>
            <span>💳</span> Банковская карта
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto', marginRight: 8 }}>499 ₽/мес</div>
            <div className="pay-check"></div>
          </div>
          <div className={`pay-method ${activeMethod === 'sbp' ? 'active' : ''}`} id="paySbp" onClick={() => selectPay('sbp')}>
            <span>⚡</span> СБП
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto', marginRight: 8 }}>499 ₽/мес</div>
            <div className="pay-check"></div>
          </div>
        </div>
        <button className="sidebar-subscribe-btn" onClick={openPayModal}>Изменить способ оплаты</button>
      </div>
    </aside>
  );
}
