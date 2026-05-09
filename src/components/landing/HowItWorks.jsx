export default function HowItWorks({ openPopup }) {
  return (
    <section className="how-section" id="how">
      <div className="section-inner">
        <div className="how-header">
          <div className="section-label" style={{ justifyContent: 'center' }}>Как это работает</div>
          <div className="how-title">Один шаг<br />до скидки</div>
          <p className="how-sub">Подключи сервис — и пользуйся неограниченным доступом к каталогу промокодов.</p>
        </div>

        <div className="one-step-block">
          <div className="one-step-left" onClick={() => openPopup()} style={{ cursor: 'pointer' }} title="Подключить">
            <div className="one-step-num">35 ₽</div>
            <div className="one-step-per">в день</div>
            <div className="one-step-note">499 ₽/мес · включая НДС</div>
          </div>
          <div className="one-step-divider"></div>
          <div className="one-step-right">
            <div className="one-step-headline">Экономь до −50%<br />от стоимости покупок</div>
            <div className="one-step-item">
              <span className="one-step-ico">🔍</span>
              <span>Неограниченный поиск промокодов по всем магазинам и категориям</span>
            </div>
            <div className="one-step-item">
              <span className="one-step-ico">✓</span>
              <span>Каждый код проверен — вы видите время последней проверки</span>
            </div>
            <div className="one-step-item">
              <span className="one-step-ico">⚡</span>
              <span>Доступ открывается сразу после подключения сервиса</span>
            </div>
            <div className="one-step-item">
              <span className="one-step-ico">🔓</span>
              <span>Отключить можно в любой момент из личного кабинета</span>
            </div>
            <button className="one-step-btn" onClick={(e) => { e.preventDefault(); openPopup(); }}>Подключить</button>
          </div>
        </div>
      </div>
    </section>
  );
}
