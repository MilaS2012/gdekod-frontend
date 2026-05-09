// Данные партнёров (магазины и промокоды)
export const PARTNERS = [
  { name: 'Авиасейлс', domain: 'aviasales.ru', cat: 'travel', promos: [{ disc: '−500 ₽', desc: 'На первый заказ', code: 'AVIA500R', verified: '2 ч', expires: '2026-05-31' }] },
  { name: 'AliExpress', domain: 'aliexpress.ru', cat: 'elektronika', promos: [{ disc: '−300 ₽', desc: 'На заказ от 2 000 ₽', code: 'ALI300APP', verified: '3 ч', expires: null }, { disc: '−10%', desc: 'На электронику', code: 'ALIELEC10', verified: '5 ч', expires: '2026-06-15' }] },
  { name: 'билайн', domain: 'beeline.ru', cat: 'other', promos: [{ disc: '−20%', desc: 'На тариф при смене', code: 'BEE20NEW', verified: '8 ч', expires: null }] },
  { name: 'Wildberries', domain: 'wildberries.ru', cat: 'odezhda', promos: [{ disc: '−500 ₽', desc: 'На заказ от 3 000 ₽', code: 'WB500RUB', verified: '2 ч', expires: '2026-04-20' }, { disc: '−15%', desc: 'На первый заказ', code: 'WB15NEW', verified: '4 ч', expires: '2026-06-01' }, { disc: '−300 ₽', desc: 'На одежду от 2 000 ₽', code: 'WB300CLO', verified: '1 ч', expires: '2026-07-01' }, { disc: '−10%', desc: 'На обувь', code: 'WB10SHO', verified: '3 ч', expires: null }] },
  { name: 'DNS', domain: 'dns-shop.ru', cat: 'elektronika', promos: [{ disc: '−2 000 ₽', desc: 'На ноутбуки от 50 000 ₽', code: 'DNS2000N', verified: '8 ч', expires: '2026-06-10' }] },
  { name: 'Delivery Club', domain: 'delivery-club.ru', cat: 'eda', promos: [{ disc: '−300 ₽', desc: 'На первый заказ от 800 ₽', code: 'DC300FIR', verified: '3 ч', expires: '2026-05-30' }] },
  { name: 'Золотое Яблоко', domain: 'goldapple.ru', cat: 'krasota', promos: [{ disc: '−10%', desc: 'На первый заказ', code: 'GOLD10NW', verified: '3 ч', expires: '2026-05-02' }, { disc: '−15%', desc: 'На уходовую косметику', code: 'GOLDCARE', verified: '6 ч', expires: '2026-06-20' }] },
  { name: 'Zara', domain: 'zara.com', cat: 'odezhda', promos: [{ disc: '−10%', desc: 'На новую коллекцию', code: 'ZARA10SS', verified: '6 ч', expires: '2026-06-01' }] },
  { name: 'Ситилинк', domain: 'citilink.ru', cat: 'elektronika', promos: [{ disc: '−5%', desc: 'На весь заказ от 10 000 ₽', code: 'CITI5PCT', verified: '4 ч', expires: '2026-05-01' }, { disc: '−10%', desc: 'На смартфоны', code: 'CITI10SM', verified: '3 ч', expires: '2026-06-30' }] },
  { name: 'Самокат', domain: 'samokat.ru', cat: 'eda', promos: [{ disc: '−15%', desc: 'На первые 2 заказа', code: 'SAM15OFF', verified: '1 ч', expires: '2026-06-15' }] },
  { name: 'Lamoda', domain: 'lamoda.ru', cat: 'odezhda', promos: [{ disc: '−15%', desc: 'На первый заказ', code: 'LAMODA15', verified: '5 ч', expires: '2026-06-15' }, { disc: '−500 ₽', desc: 'От 5 000 ₽', code: 'LAM500', verified: '7 ч', expires: null }] },
  { name: 'М.Видео', domain: 'mvideo.ru', cat: 'elektronika', promos: [{ disc: '−3 000 ₽', desc: 'На технику от 30 000 ₽', code: 'MVIDEO3K', verified: '1 ч', expires: '2026-04-30' }, { disc: '−500 ₽', desc: 'На аксессуары', code: 'MVID500A', verified: '2 ч', expires: null }] },
  { name: 'Ozon', domain: 'ozon.ru', cat: 'other', promos: [{ disc: '−10%', desc: 'На первый заказ', code: 'OZON10NEW', verified: '4 ч', expires: null }, { disc: '−500 ₽', desc: 'На заказ от 2 500 ₽', code: 'OZON500', verified: '6 ч', expires: '2026-05-28' }] },
  { name: 'Яндекс Еда', domain: 'eda.yandex.ru', cat: 'eda', promos: [{ disc: '−20%', desc: 'На первые 3 заказа', code: 'EDA20NEW', verified: '14 ч', expires: null }] },
  { name: 'Яндекс Маркет', domain: 'market.yandex.ru', cat: 'other', promos: [{ disc: '−300 ₽', desc: 'На первый заказ', code: 'YMKT300', verified: '2 ч', expires: '2026-05-31' }] },
].sort((a, b) => a.name.localeCompare(b.name, 'ru'));

export const BRAND_COLORS = {
  'wildberries.ru': ['#7B2D8B', '#fff', 'W'],
  'aliexpress.ru': ['#E62E04', '#fff', 'A'],
  'lamoda.ru': ['#000', '#fff', 'L'],
  'mvideo.ru': ['#D62027', '#fff', 'М'],
  'ozon.ru': ['#005BFF', '#fff', 'O'],
  'eda.yandex.ru': ['#FC3F1D', '#fff', 'Е'],
  'goldapple.ru': ['#BF1F2E', '#fff', 'З'],
  'aviasales.ru': ['#01A4E4', '#fff', 'А'],
  'market.yandex.ru': ['#FFCC00', '#333', 'Я'],
  'delivery-club.ru': ['#FF3C00', '#fff', 'D'],
  'samokat.ru': ['#E63946', '#fff', 'С'],
  'citilink.ru': ['#F47920', '#fff', 'С'],
  'dns-shop.ru': ['#1A1A2E', '#fff', 'D'],
  'beeline.ru': ['#FFD400', '#000', 'Б'],
  'zara.com': ['#000', '#fff', 'Z'],
};

export function brandAvatar(domain, size = 32) {
  if (!domain) {
    return `<div style="width:${size}px;height:${size}px;border-radius:${Math.round(size * 0.25)}px;background:#C8A96E;color:#fff;display:flex;align-items:center;justify-content:center;font-size:${Math.round(size * 0.44)}px;font-weight:700;font-family:Arial,sans-serif;flex-shrink:0;">?</div>`;
  }
  const r = Math.round(size * 0.25);
  const fs = Math.round(size * 0.44);
  const letter = domain[0].toUpperCase();
  const [bg, fg] = BRAND_COLORS[domain] ? [BRAND_COLORS[domain][0], BRAND_COLORS[domain][1]] : ['#C8A96E', '#fff'];
  return `<div style="width:${size}px;height:${size}px;border-radius:${r}px;overflow:hidden;flex-shrink:0;position:relative;">
    <img src="https://logo.clearbit.com/${domain}" width="${size}" height="${size}"
      style="width:${size}px;height:${size}px;object-fit:contain;border-radius:${r}px;display:block;"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" alt="">
    <div style="display:none;width:${size}px;height:${size}px;border-radius:${r}px;background:${bg};color:${fg};align-items:center;justify-content:center;font-size:${fs}px;font-weight:700;font-family:Arial,sans-serif;position:absolute;top:0;left:0;">${letter}</div>
  </div>`;
}

export function isExpired(expires) {
  if (!expires) return false;
  return Math.ceil((new Date(expires) - new Date()) / 86400000) < 0;
}

export function expiresText(expires) {
  if (!expires) return 'Действует сегодня';
  const diff = Math.ceil((new Date(expires) - new Date()) / 86400000);
  if (diff < 0) return 'Истёк';
  if (diff === 0) return 'Последний день';
  return `Осталось ${diff} дн.`;
}

export function catLabel(cat) {
  const labels = { eda: 'Доставка еды', odezhda: 'Одежда и обувь', elektronika: 'Электроника', travel: 'Путешествия', krasota: 'Красота и здоровье', other: 'Другое' };
  return labels[cat] || cat;
}
